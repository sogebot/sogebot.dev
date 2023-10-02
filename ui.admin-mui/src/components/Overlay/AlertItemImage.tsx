import { Box } from '@mui/material';
import { AlertImage } from '@sogebot/backend/src/database/entity/overlay';
import React from 'react';
import { useLocalstorageState } from 'rooks';

import defaultImage from './assets/alerts/default.gif';
import type { Props } from './ChatItem';

export const AlertItemImage: React.FC<Props<AlertImage>>
= ({ item, width, height, active }) => {
  const [ server ] = useLocalstorageState('server', 'https://demobot.sogebot.xyz');
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
            controls={false}
            autoPlay={active}
            muted={!active}
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
