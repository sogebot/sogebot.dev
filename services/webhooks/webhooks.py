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
    with conn.cursor() as cur:
      cur.execute('INSERT INTO "eventsub_events" (userId, event, data) VALUES (%s, %s, %s)', (userId, event, json_data))
    return

async def callback(data: dict):
    # our event happend, lets do things with the data we got!
    event = data.get('subscription')['type']
    userId = data.get('subscription')['condition']['broadcaster_user_id']
    json_data = json.dumps(data)
    add_event_to_database(event, userId, json_data)
    logger.info(data)

def getUsers(conn, only_flagged):
  if os.getenv('ENV') == 'development':
    logger.info('Getting users from DB (only_flagged=%s)' % (only_flagged,))
  with conn.cursor() as cur:
    if only_flagged:
      cur.execute('SELECT "userId", "scopes" FROM "eventsub_users" WHERE "eventsub_users"."updated" = %s', (True,))
    else:
      cur.execute('SELECT "userId", "scopes" FROM "eventsub_users"')
    users_from_db = cur.fetchall()

    cur.execute('UPDATE "eventsub_users" SET "updated" = %s', (False,))
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

    only_flagged = False
    while True:
      current_timestamp = datetime.datetime.now(tz=pytz.utc) - datetime.timedelta(minutes=1)
      users_from_db = getUsers(conn, only_flagged)
      only_flagged = True

      for broadcaster_user_id, scopes in users_from_db:
        if 'channel:read:redemptions' in scopes:
          try:
            await event_sub.listen_channel_points_custom_reward_redemption_add(broadcaster_user_id, callback)
            logger.info(f'User {broadcaster_user_id} subscribed to listen_channel_points_custom_reward_redemption_add')
          except Exception as e:
            if 'subscription already exists' not in str(e):
              logger.error(f'User {broadcaster_user_id} error for listen_channel_points_custom_reward_redemption_add: {str(e)}')

        if 'moderator:read:followers' in scopes:
          try:
            await event_sub.listen_channel_follow_v2(broadcaster_user_id, broadcaster_user_id, callback)
            logger.info(f'User {broadcaster_user_id} subscribed to listen_channel_follow_v2')
          except Exception as e:
            if 'subscription already exists' not in str(e):
              logger.error(f'User {broadcaster_user_id} error for listen_channel_follow_v2: {str(e)}')

        if 'bits:read' in scopes:
          try:
            await event_sub.listen_channel_cheer(broadcaster_user_id, callback)
            logger.info(f'User {broadcaster_user_id} subscribed to listen_channel_cheer')
          except Exception as e:
            if 'subscription already exists' not in str(e):
              logger.error(f'User {broadcaster_user_id} error for listen_channel_cheer: {str(e)}')

        if 'channel:moderate' in scopes:
          try:
            await event_sub.listen_channel_ban(broadcaster_user_id, callback)
            logger.info(f'User {broadcaster_user_id} subscribed to listen_channel_ban')
          except Exception as e:
            if 'subscription already exists' not in str(e):
              logger.error(f'User {broadcaster_user_id} error for listen_channel_ban: {str(e)}')

          try:
            await event_sub.listen_channel_unban(broadcaster_user_id, callback)
            logger.info(f'User {broadcaster_user_id} subscribed to listen_channel_unban')
          except Exception as e:
            if 'subscription already exists' not in str(e):
              logger.error(f'User {broadcaster_user_id} error for listen_channel_unban: {str(e)}')

        if 'channel:read:predictions' in scopes:
          try:
            await event_sub.listen_channel_prediction_begin(broadcaster_user_id, callback)
            logger.info(f'User {broadcaster_user_id} subscribed to listen_channel_prediction_begin')
          except Exception as e:
            if 'subscription already exists' not in str(e):
              logger.error(f'User {broadcaster_user_id} error for listen_channel_prediction_begin: {str(e)}')

          try:
            await event_sub.listen_channel_prediction_progress(broadcaster_user_id, callback)
            logger.info(f'User {broadcaster_user_id} subscribed to listen_channel_prediction_progress')
          except Exception as e:
            if 'subscription already exists' not in str(e):
              logger.error(f'User {broadcaster_user_id} error for listen_channel_prediction_progress: {str(e)}')

          try:
            await event_sub.listen_channel_prediction_lock(broadcaster_user_id, callback)
            logger.info(f'User {broadcaster_user_id} subscribed to listen_channel_prediction_lock')
          except Exception as e:
            if 'subscription already exists' not in str(e):
              logger.error(f'User {broadcaster_user_id} error for listen_channel_prediction_lock: {str(e)}')

          try:
            await event_sub.listen_channel_prediction_end(broadcaster_user_id, callback)
            logger.info(f'User {broadcaster_user_id} subscribed to listen_channel_prediction_end')
          except Exception as e:
            if 'subscription already exists' not in str(e):
              logger.error(f'User {broadcaster_user_id} error for listen_channel_prediction_end: {str(e)}')

        if 'channel:read:polls' in scopes:
          try:
            await event_sub.listen_channel_poll_begin(broadcaster_user_id, callback)
            logger.info(f'User {broadcaster_user_id} subscribed to listen_channel_poll_begin')
          except Exception as e:
            if 'subscription already exists' not in str(e):
              logger.error(f'User {broadcaster_user_id} error for listen_channel_poll_begin: {str(e)}')

          try:
            await event_sub.listen_channel_poll_progress(broadcaster_user_id, callback)
            logger.info(f'User {broadcaster_user_id} subscribed to listen_channel_poll_progress')
          except Exception as e:
            if 'subscription already exists' not in str(e):
              logger.error(f'User {broadcaster_user_id} error for listen_channel_poll_progress: {str(e)}')

          try:
            await event_sub.listen_channel_poll_end(broadcaster_user_id, callback)
            logger.info(f'User {broadcaster_user_id} subscribed to listen_channel_poll_end')
          except Exception as e:
            if 'subscription already exists' not in str(e):
              logger.error(f'User {broadcaster_user_id} error for listen_channel_poll_end: {str(e)}')

        if 'channel:read:hype_train' in scopes:
          try:
            await event_sub.listen_hype_train_begin(broadcaster_user_id, callback)
            logger.info(f'User {broadcaster_user_id} subscribed to listen_hype_train_begin')
          except Exception as e:
            if 'subscription already exists' not in str(e):
              logger.error(f'User {broadcaster_user_id} error for listen_hype_train_begin: {str(e)}')

          try:
            await event_sub.listen_hype_train_progress(broadcaster_user_id, callback)
            logger.info(f'User {broadcaster_user_id} subscribed to listen_hype_train_progress')
          except Exception as e:
            if 'subscription already exists' not in str(e):
              logger.error(f'User {broadcaster_user_id} error for listen_hype_train_progress: {str(e)}')

          try:
            await event_sub.listen_hype_train_end(broadcaster_user_id, callback)
            logger.info(f'User {broadcaster_user_id} subscribed to listen_hype_train_end')
          except Exception as e:
            if 'subscription already exists' not in str(e):
              logger.error(f'User {broadcaster_user_id} error for listen_hype_train_end: {str(e)}')

        # no auth required
        try:
          await event_sub.listen_channel_raid(callback, to_broadcaster_user_id=broadcaster_user_id)
          logger.info(f'User {broadcaster_user_id} subscribed to listen_channel_raid (to broadcaster)')
        except Exception as e:
          if 'subscription already exists' not in str(e):
            logger.error(f'User {broadcaster_user_id} error for listen_channel_raid (to broadcaster): {str(e)}')
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