from logger import logger
import asyncio

async def listen_channel_points_custom_reward_redemption_add(broadcaster_user_id, scopes, callback, event_sub):
  if 'channel:read:redemptions' in scopes:
    try:
      await event_sub.listen_channel_points_custom_reward_redemption_add(broadcaster_user_id, callback)
      logger.info(f'User {broadcaster_user_id} subscribed to listen_channel_points_custom_reward_redemption_add')
    except Exception as e:
      if 'subscription already exists' not in str(e):
        logger.error(f'User {broadcaster_user_id} error for listen_channel_points_custom_reward_redemption_add: {str(e)}')

async def listen_channel_follow_v2(broadcaster_user_id, scopes, callback, event_sub):
  if 'moderator:read:followers' in scopes:
    try:
      await event_sub.listen_channel_follow_v2(broadcaster_user_id, broadcaster_user_id, callback)
      logger.info(f'User {broadcaster_user_id} subscribed to listen_channel_follow_v2')
    except Exception as e:
      if 'subscription already exists' not in str(e):
        logger.error(f'User {broadcaster_user_id} error for listen_channel_follow_v2: {str(e)}')

async def listen_channel_cheer(broadcaster_user_id, scopes, callback, event_sub):
  if 'bits:read' in scopes:
    try:
      await event_sub.listen_channel_cheer(broadcaster_user_id, callback)
      logger.info(f'User {broadcaster_user_id} subscribed to listen_channel_cheer')
    except Exception as e:
      if 'subscription already exists' not in str(e):
        logger.error(f'User {broadcaster_user_id} error for listen_channel_cheer: {str(e)}')

async def listen_channel_ban(broadcaster_user_id, scopes, callback, event_sub):
  if 'channel:moderate' in scopes:
    try:
      await event_sub.listen_channel_ban(broadcaster_user_id, callback)
      logger.info(f'User {broadcaster_user_id} subscribed to listen_channel_ban')
    except Exception as e:
      if 'subscription already exists' not in str(e):
        logger.error(f'User {broadcaster_user_id} error for listen_channel_ban: {str(e)}')

async def listen_channel_unban(broadcaster_user_id, scopes, callback, event_sub):
  if 'channel:moderate' in scopes:
    try:
      await event_sub.listen_channel_unban(broadcaster_user_id, callback)
      logger.info(f'User {broadcaster_user_id} subscribed to listen_channel_unban')
    except Exception as e:
      if 'subscription already exists' not in str(e):
        logger.error(f'User {broadcaster_user_id} error for listen_channel_unban: {str(e)}')

async def listen_channel_prediction_begin(broadcaster_user_id, scopes, callback, event_sub):
  if 'channel:read:predictions' in scopes:
    try:
      await event_sub.listen_channel_prediction_begin(broadcaster_user_id, callback)
      logger.info(f'User {broadcaster_user_id} subscribed to listen_channel_prediction_begin')
    except Exception as e:
      if 'subscription already exists' not in str(e):
        logger.error(f'User {broadcaster_user_id} error for listen_channel_prediction_begin: {str(e)}')

async def listen_channel_prediction_progress(broadcaster_user_id, scopes, callback, event_sub):
  if 'channel:read:predictions' in scopes:
    try:
      await event_sub.listen_channel_prediction_progress(broadcaster_user_id, callback)
      logger.info(f'User {broadcaster_user_id} subscribed to listen_channel_prediction_progress')
    except Exception as e:
      if 'subscription already exists' not in str(e):
        logger.error(f'User {broadcaster_user_id} error for listen_channel_prediction_progress: {str(e)}')

async def listen_channel_prediction_lock(broadcaster_user_id, scopes, callback, event_sub):
  if 'channel:read:predictions' in scopes:
    try:
      await event_sub.listen_channel_prediction_lock(broadcaster_user_id, callback)
      logger.info(f'User {broadcaster_user_id} subscribed to listen_channel_prediction_lock')
    except Exception as e:
      if 'subscription already exists' not in str(e):
        logger.error(f'User {broadcaster_user_id} error for listen_channel_prediction_lock: {str(e)}')

async def listen_channel_prediction_end(broadcaster_user_id, scopes, callback, event_sub):
  if 'channel:read:predictions' in scopes:
    try:
      await event_sub.listen_channel_prediction_end(broadcaster_user_id, callback)
      logger.info(f'User {broadcaster_user_id} subscribed to listen_channel_prediction_end')
    except Exception as e:
      if 'subscription already exists' not in str(e):
        logger.error(f'User {broadcaster_user_id} error for listen_channel_prediction_end: {str(e)}')

async def listen_channel_poll_begin(broadcaster_user_id, scopes, callback, event_sub):
  if 'channel:read:polls' in scopes:
    try:
      await event_sub.listen_channel_poll_begin(broadcaster_user_id, callback)
      logger.info(f'User {broadcaster_user_id} subscribed to listen_channel_poll_begin')
    except Exception as e:
      if 'subscription already exists' not in str(e):
        logger.error(f'User {broadcaster_user_id} error for listen_channel_poll_begin: {str(e)}')

async def listen_channel_poll_progress(broadcaster_user_id, scopes, callback, event_sub):
  if 'channel:read:polls' in scopes:
    try:
      await event_sub.listen_channel_poll_progress(broadcaster_user_id, callback)
      logger.info(f'User {broadcaster_user_id} subscribed to listen_channel_poll_progress')
    except Exception as e:
      if 'subscription already exists' not in str(e):
        logger.error(f'User {broadcaster_user_id} error for listen_channel_poll_progress: {str(e)}')

async def listen_channel_poll_end(broadcaster_user_id, scopes, callback, event_sub):
  if 'channel:read:polls' in scopes:
    try:
      await event_sub.listen_channel_poll_end(broadcaster_user_id, callback)
      logger.info(f'User {broadcaster_user_id} subscribed to listen_channel_poll_end')
    except Exception as e:
      if 'subscription already exists' not in str(e):
        logger.error(f'User {broadcaster_user_id} error for listen_channel_poll_end: {str(e)}')

async def listen_hype_train_begin(broadcaster_user_id, scopes, callback, event_sub):
  if 'channel:read:hype_train' in scopes:
    try:
      await event_sub.listen_hype_train_begin(broadcaster_user_id, callback)
      logger.info(f'User {broadcaster_user_id} subscribed to listen_hype_train_begin')
    except Exception as e:
      if 'subscription already exists' not in str(e):
        logger.error(f'User {broadcaster_user_id} error for listen_hype_train_begin: {str(e)}')

async def listen_hype_train_progress(broadcaster_user_id, scopes, callback, event_sub):
  if 'channel:read:hype_train' in scopes:
    try:
      await event_sub.listen_hype_train_progress(broadcaster_user_id, callback)
      logger.info(f'User {broadcaster_user_id} subscribed to listen_hype_train_progress')
    except Exception as e:
      if 'subscription already exists' not in str(e):
        logger.error(f'User {broadcaster_user_id} error for listen_hype_train_progress: {str(e)}')

async def listen_hype_train_end(broadcaster_user_id, scopes, callback, event_sub):
  try:
    await event_sub.listen_hype_train_end(broadcaster_user_id, callback)
    logger.info(f'User {broadcaster_user_id} subscribed to listen_hype_train_end')
  except Exception as e:
    if 'subscription already exists' not in str(e):
      logger.error(f'User {broadcaster_user_id} error for listen_hype_train_end: {str(e)}')

async def listen_channel_raid(broadcaster_user_id, scopes, callback, event_sub):
  # no auth required
  try:
    await event_sub.listen_channel_raid(callback, to_broadcaster_user_id=broadcaster_user_id)
    logger.info(f'User {broadcaster_user_id} subscribed to listen_channel_raid (to broadcaster)')
  except Exception as e:
    if 'subscription already exists' not in str(e):
      logger.error(f'User {broadcaster_user_id} error for listen_channel_raid (to broadcaster): {str(e)}')