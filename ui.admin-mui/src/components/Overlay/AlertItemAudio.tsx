import { AlertAudio, Alerts } from '@backend/database/entity/overlay';
import { Box } from '@mui/material';
import { useAtom, useSetAtom } from 'jotai';
import React from 'react';
import { useLocalstorageState } from 'rooks';

import { anExpectedSoundCount, anFinishedSoundCount } from './AlertItem/atom';
import defaultAudio from './assets/alerts/default.mp3';
import type { Props } from './ChatItem';

export const AlertItemAudio: React.FC<Props<AlertAudio> & { variant: Omit<Alerts['items'][number], 'variants'> }>
= ({ item, width, height, active, variant }) => {
  const [ server ] = useLocalstorageState('server', 'https://demobot.sogebot.xyz');
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const [ canPlay, setCanPlay ] = React.useState(false);

  const [ itemAnimationTriggered, setItemAnimationTriggered ] = React.useState(false);
  const [finishedSoundCount, setFinishedSoundCount] = useAtom(anFinishedSoundCount);

  React.useEffect(() => {
    if (active) {
      setItemAnimationTriggered(true);
    }

    if (!active && itemAnimationTriggered) {
      setTimeout(() => {
        setItemAnimationTriggered(false);
      }, variant.alertDuration);
    }
  }, [ active, itemAnimationTriggered ]);

  React.useEffect(() => {
    if (canPlay && itemAnimationTriggered) {
      setTimeout(() =>{
        audioRef.current?.play();
      }, item.delay);
    }
  }, [canPlay, itemAnimationTriggered]);

  const setExpectedSoundCount = useSetAtom(anExpectedSoundCount);
  React.useEffect(() => {
    setExpectedSoundCount((count) => count === -1 ? 1 : count + 1);
  }, []);

  return <Box sx={{
    width:         '100%',
    height:        '100%',
    position:      'relative',
    overflow:      'hidden',
    textTransform: 'none',
    lineHeight:    'initial',
  }}>
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
      <audio
        onEnded={() => setFinishedSoundCount(finishedSoundCount + 1)}
        ref={ref => {
          if (ref) {
            audioRef.current = ref;
          }
        }}
        onLoadedData={(ev) => ev.currentTarget.volume = item.volume}
        preload='metadata'
        onCanPlay={() => setCanPlay(true)}
        src={item.galleryId === '%default%' ? defaultAudio : `${server}/gallery/${item.galleryId}`}
      />
    </Box>
  </Box>;
};
