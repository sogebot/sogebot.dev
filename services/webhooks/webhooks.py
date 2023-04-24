# Add dependencies folder
import sys
sys.path.insert(0, 'dependencies')

import asyncio
import traceback
import signal
import json
import datetime
import pytz
import os
from pyngrok import ngrok

from twitchAPI.twitch import Twitch
from twitchAPI.helper import first
from twitchAPI.eventsub import EventSub
from twitchAPI.oauth import UserAuthenticator
from twitchAPI.types import AuthScope

from logger import logger
from server import run_server
from database import conn

from dotenv import load_dotenv
load_dotenv()

def add_event_to_database(event, userId, json_data):
    cur = conn.cursor()
    cur.execute('INSERT INTO "eventsub_events" (userId, event, data) VALUES (%s, %s, %s)', (userId, event, json_data))
    conn.commit()
    cur.close()
    return

async def save_event_to_db(data: dict):
    # our event happend, lets do things with the data we got!
    event = data.get('subscription')['type']
    userId = data.get('subscription')['condition']['broadcaster_user_id']
    json_data = json.dumps(data)
    add_event_to_database(event, userId, json_data)
    logger.info(data)

def getUsers(conn, timestamp):
  if os.getenv('ENV') == 'development':
    logger.info('Getting users from DB (t=%s)' % (timestamp,))
  with conn.cursor() as cur:
    cur.execute('SELECT "userId", "scopes" FROM "eventsub_users" WHERE "eventsub_users"."updatedat" >= %s', (timestamp,))
    users_from_db = cur.fetchall()
  return users_from_db


async def main():
  logger.info('Starting up EventSub Webhooks service')

  EVENTSUB_URL = 'https://eventsub.sogebot.xyz'
  if os.getenv('ENV') == 'development':
    logger.info('Using ngrok tunnel on development')
    http_tunnel = ngrok.connect('http://localhost:8080')
    EVENTSUB_URL = http_tunnel.public_url

  try:
    run_server(8081)

    APP_ID = os.getenv('TWITCH_EVENTSUB_CLIENTID')
    APP_SECRET = os.getenv('TWITCH_EVENTSUB_CLIENTSECRET')
    # create the api instance and get the ID of the target user
    twitch = await Twitch(APP_ID, APP_SECRET)

    # basic setup, will run on port 8080 and a reverse proxy takes care of the https and certificate
    event_sub = EventSub(EVENTSUB_URL, APP_ID, 8080, twitch)

    # unsubscribe from all old events that might still be there
    # this will ensure we have a clean slate
    await event_sub.unsubscribe_all()
    # start the eventsub client
    event_sub.start()
    # subscribing to the desired eventsub hook for our user
    # the given function (in this example on_follow) will be called every time this event is triggered
    # the broadcaster is a moderator in their own channel by default so specifying both as the same works in this example

    timestamp = datetime.datetime(1970, 1, 1, tzinfo=datetime.timezone.utc)
    while True:
      current_timestamp = datetime.datetime.now(tz=pytz.utc)
      users_from_db = getUsers(conn, timestamp)
      timestamp = current_timestamp

      for user_id, scopes in users_from_db:
        if 'channel:read:redemptions' in scopes:
          try:
            await event_sub.listen_channel_points_custom_reward_redemption_add(user_id, save_event_to_db)
            logger.info(f'User {user_id} subscribed to listen_channel_points_custom_reward_redemption_add')
          except Exception as e:
            if 'subscription already exists' not in str(e):
              logger.error(f'User {user_id} error for listen_channel_points_custom_reward_redemption_add: {str(e)}')

        if 'moderator:read:followers' in scopes:
          try:
            await event_sub.listen_channel_follow_v2(user_id, user_id, save_event_to_db)
            logger.info(f'User {user_id} subscribed to listen_channel_follow_v2')
          except Exception as e:
            if 'subscription already exists' not in str(e):
              logger.error(f'User {user_id} error for listen_channel_follow_v2: {str(e)}')

        if 'bits:read' in scopes:
          try:
            await event_sub.listen_channel_cheer(user_id, save_event_to_db)
            logger.info(f'User {user_id} subscribed to listen_channel_cheer')
          except Exception as e:
            if 'subscription already exists' not in str(e):
              logger.error(f'User {user_id} error for listen_channel_cheer: {str(e)}')

        if 'channel:moderate' in scopes:
          try:
            await event_sub.listen_channel_ban(user_id, save_event_to_db)
            logger.info(f'User {user_id} subscribed to listen_channel_ban')
          except Exception as e:
            if 'subscription already exists' not in str(e):
              logger.error(f'User {user_id} error for listen_channel_ban: {str(e)}')
          try:
            await event_sub.listen_channel_unban(user_id, save_event_to_db)
            logger.info(f'User {user_id} subscribed to listen_channel_unban')
          except Exception as e:
            if 'subscription already exists' not in str(e):
              logger.error(f'User {user_id} error for listen_channel_unban: {str(e)}')


        # no auth required
        try:
          await event_sub.listen_channel_raid(save_event_to_db, to_broadcaster_user_id=user_id)
          logger.info(f'User {user_id} subscribed to listen_channel_raid (to broadcaster)')
        except Exception as e:
          if 'subscription already exists' not in str(e):
            logger.error(f'User {user_id} error for listen_channel_raid (to broadcaster): {str(e)}')
      await asyncio.sleep(60)


    # eventsub will run in its own process
    # so lets just wait for user input before shutting it all down again
    signal.signal(signal.SIGINT, signal.SIG_DFL)
    if sys.platform.startswith('win'):
      # Windows does not support the pause() function
      input('Press any key to continue...')
    else:
      signal.pause()
    logger.warn('Signal received, cleaning up...')
    # stopping both eventsub as well as gracefully closing the connection to the API
    await event_sub.stop()
    await twitch.close()
    logger.warn('Exiting...')
  except Exception as e:
      # Print the traceback of the exception
      logger.error('An error occurred:')
      traceback.print_exc()


if __name__ == '__main__':
    asyncio.run(main())