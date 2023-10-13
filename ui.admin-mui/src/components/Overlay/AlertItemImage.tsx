import { Box } from '@mui/material';
import { AlertImage, Alerts } from '@sogebot/backend/src/database/entity/overlay';
import React, { useRef } from 'react';
import { useIntervalWhen, useLocalstorageState } from 'rooks';

import defaultImage from './assets/alerts/default.gif';
import type { Props } from './ChatItem';

export const AlertItemImage: React.FC<Props<AlertImage> & {variant: Omit<Alerts['items'][number], 'variants'>}>
= ({ item, width, height, active, variant }) => {
  const [ server ] = useLocalstorageState('server', 'https://demobot.sogebot.xyz');

  const videoPlayer = useRef<HTMLVideoElement>(null);

  const [ itemAnimationTriggered, setItemAnimationTriggered ] = React.useState(false);
  const [ endAnimationShouldPlay, setEndAnimationShouldPlay ] = React.useState<boolean>(false);

  // countdown timer for item to be hidden
  const [ timestamp, setTimestamp ] = React.useState<number>(variant.alertDuration);
  useIntervalWhen(() => {
    setTimestamp((t) => t - 100);
  }, 100, timestamp > 0 && active);

  React.useEffect(() => {
    if (active) {
      setItemAnimationTriggered(true);
    }

    // reset timestamp
    setTimestamp(variant.alertDuration);

    if (itemAnimationTriggered) {
      videoPlayer.current?.play();
    }

    if (!active && itemAnimationTriggered) {
      setEndAnimationShouldPlay(true);
      setTimeout(() =>{
        videoPlayer.current?.pause();
      }, item.animationOutDuration ?? variant.animationOutDuration);
      setTimeout(() => {
        setEndAnimationShouldPlay(false);
        setItemAnimationTriggered(false);
      }, (item.animationOutDuration ?? variant.animationOutDuration) + 5000);
    }
  }, [ active, itemAnimationTriggered ]);

  const animationType = React.useMemo(() => {
    if (!itemAnimationTriggered) {
      return 'none';
    }
    return !endAnimationShouldPlay
      ? item.animationIn ?? variant.animationIn
      : item.animationOut ?? variant.animationOut;
  }, [ timestamp, itemAnimationTriggered, endAnimationShouldPlay ]);
  const animationDuration = React.useMemo(() => {
    if (!itemAnimationTriggered) {
      return 0; // disable animations if not active
    }
    return !endAnimationShouldPlay
      ? item.animationInDuration ?? variant.animationInDuration
      : item.animationOutDuration ?? variant.animationOutDuration;
  }, [ timestamp, itemAnimationTriggered, endAnimationShouldPlay ]);
  const animationDelay = React.useMemo(() => itemAnimationTriggered && !endAnimationShouldPlay
    ? item.animationDelay ?? 0
    : 0, [ itemAnimationTriggered, endAnimationShouldPlay ]);

  return <Box sx={{
    width:             '100%',
    height:            '100%',
    position:          'relative',
    overflow:          'hidden',
    textTransform:     'none',
    lineHeight:        'initial',
    animationDuration: `${animationDuration}ms !important`,
    animationDelay:    `${animationDelay}ms !important`,
  }}
  className={`animate__animated animate__${animationType}`}>
    {/* we need to create overlay over iframe so it is visible but it cannot be clicked */}
    <Box sx={{
      width:          `${width}px`,
      height:         `${height}px`,
      position:       'absolute',
      display:        'flex',
      justifyContent: 'center',
      alignItems:     'center',
      overflow:       'hidden',
    }}>
      {item.galleryId === '%default%' && <img src={defaultImage} alt='default'
        style={{
          maxWidth:  '100%',
          maxHeight: '100%',
          width:     'auto',
          height:    'auto',
        }}/>}
      {item.galleryId !== '%default%' && <>
        {item.isVideo
          ? <video src={`${server}/gallery/${item.galleryId}`}
            ref={videoPlayer}
            controls={false}
            loop={item.loop}
            style={{
              maxWidth:  '100%',
              maxHeight: '100%',
              width:     'auto',
              height:    'auto',
            }} />
          : <img src={`${server}/gallery/${item.galleryId}`} alt='' style={{
            maxWidth:  '100%',
            maxHeight: '100%',
            width:     'auto',
            height:    'auto',
          }} />}
      </>}
    </Box>
  </Box>;
};
