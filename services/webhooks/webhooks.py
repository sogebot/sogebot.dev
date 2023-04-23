import asyncio
import traceback
import signal
import sys
import logging

from twitchAPI.twitch import Twitch
from twitchAPI.helper import first
from twitchAPI.eventsub import EventSub
from twitchAPI.oauth import UserAuthenticator
from twitchAPI.types import AuthScope

from dotenv import dotenv_values
config = dotenv_values(".env")

from pyngrok import ngrok
http_tunnel = ngrok.connect('http://localhost:8080')

formatter = logging.Formatter(fmt='%(asctime)s %(levelname)-8s %(message)s',
                              datefmt='%Y-%m-%d %H:%M:%S')

APP_ID = config.get('TWITCH_EVENTSUB_CLIENTID')
APP_SECRET = config.get('TWITCH_EVENTSUB_CLIENTSECRET')
EVENTSUB_URL = 'https://webhooks.sogebot.xyz/handler'
EVENTSUB_URL = http_tunnel.public_url
USERID = '96965261'

def setup_custom_logger(name):
    formatter = logging.Formatter(fmt='%(asctime)s %(levelname)-8s %(message)s',
                                  datefmt='%Y-%m-%d %H:%M:%S')
    handler = logging.FileHandler('log.txt', mode='w')
    handler.setFormatter(formatter)
    screen_handler = logging.StreamHandler(stream=sys.stdout)
    screen_handler.setFormatter(formatter)
    logger = logging.getLogger(name)
    logger.setLevel(logging.DEBUG)
    logger.addHandler(handler)
    logger.addHandler(screen_handler)
    return logger
logger = setup_custom_logger('myapp')

logger.info('Starting up EventSub Webhooks service')

async def on_channel_redemption_add(data: dict):
    # our event happend, lets do things with the data we got!
    logger.info(data)

async def eventsub_example():
  try:
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
    try:
      await event_sub.listen_channel_points_custom_reward_redemption_add(USERID, on_channel_redemption_add)
      logger.info(f'User {USERID} subscribed to listen_channel_points_custom_reward_redemption_add')
    except Exception as e:
      logger.error(f'User {USERID} error for listen_channel_points_custom_reward_redemption_add: {e}')

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

# lets run our example
asyncio.run(eventsub_example())