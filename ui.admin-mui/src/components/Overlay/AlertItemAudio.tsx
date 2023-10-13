import { Box } from '@mui/material';
import { AlertAudio, Alerts } from '@sogebot/backend/src/database/entity/overlay';
import React from 'react';
import { useLocalstorageState } from 'rooks';

import defaultAudio from './assets/alerts/default.mp3';
import type { Props } from './ChatItem';

export const AlertItemAudio: React.FC<Props<AlertAudio> & {variant: Omit<Alerts['items'][number], 'variants'>}>
= ({ item, width, height, active, variant }) => {
  const [ server ] = useLocalstorageState('server', 'https://demobot.sogebot.xyz');
  const audioRef = React.useRef<HTMLAudioElement>();
  const [ canPlay, setCanPlay ] = React.useState(false);

  const [ itemAnimationTriggered, setItemAnimationTriggered ] = React.useState(false);
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
      audioRef.current?.play();
    }
  }, [canPlay, itemAnimationTriggered]);

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
