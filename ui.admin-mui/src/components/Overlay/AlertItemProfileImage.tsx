import { AlertProfileImage, Alerts } from '@backend/database/entity/overlay';
import { Box } from '@mui/material';
import { useAtomValue } from 'jotai';
import React, { useRef } from 'react';
import { useIntervalWhen } from 'rooks';

import { anEmitData } from './AlertItem/atom';
import type { Props } from './ChatItem';

export const AlertItemProfileImage: React.FC<Props<AlertProfileImage> & {
  test?: boolean, variant: Omit<Alerts['items'][number], 'variants'>,
}>
= ({ item, width, height, active, variant, test, groupId }) => {
  const videoPlayer = useRef<HTMLVideoElement>(null);
  const emitData = useAtomValue(anEmitData);

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
        if (test) {
          console.log('= Resetting animation');
          setEndAnimationShouldPlay(false);
          setItemAnimationTriggered(false);
        }
      }, (item.animationOutDuration ?? variant.animationOutDuration) + 5000);
    }
  }, [ active, itemAnimationTriggered, test ]);

  const animationType = React.useMemo(() => {
    if (!itemAnimationTriggered) {
      return 'none';
    }
    const animation = !endAnimationShouldPlay
      ? item.animationIn ?? variant.animationIn
      : item.animationOut ?? variant.animationOut;

    const animationBoundaries = !endAnimationShouldPlay
      ? variant.animationInWindowBoundaries
      : variant.animationOutWindowBoundaries;

    if (animationBoundaries) {
      if (animation.startsWith('slideIn') || animation.startsWith('slideOut')) {
        return `${animation}Window`;
      }
    }

    return animation;
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
      <img src={test ? `https://i.pravatar.cc/${width}` : emitData[groupId]?.user?.profileImageUrl} alt='default'
        style={{
          maxWidth:  '100%',
          maxHeight: '100%',
          width:     'auto',
          height:    'auto',
        }}/>
    </Box>
  </Box>;
};
