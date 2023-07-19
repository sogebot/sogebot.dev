import { Box, Typography } from '@mui/material';
import { CreditsScreenClips } from '@sogebot/backend/dest/database/entity/overlay';
import type { getTopClips } from '@sogebot/backend/dest/services/twitch/calls/getTopClips';
import { shadowGenerator, textStrokeGenerator } from '@sogebot/ui-helpers/text';
import React from 'react';

import type { Props } from './ChatItem';
import { getSocket } from '../../helpers/socket';
import { loadFont } from '../Accordion/Font';

export const CreditsCustomClips: React.FC<Props<CreditsScreenClips>>
= ({ item, active, width, height }) => {
  const [ isLoading, setIsLoading ] = React.useState(true);
  const [ clips, setClips ] = React.useState<Awaited<ReturnType<typeof getTopClips>>>([]);

  const [ videoHeight, setVideoHeight ] = React.useState(0);

  React.useEffect(() => {
    loadFont(item.gameFont.family);
    loadFont(item.titleFont.family);
    loadFont(item.createdByFont.family);
  }, [active, item]);

  React.useEffect(() => {
    setVideoHeight(0);
  }, [ item.gameFont.size, item.titleFont.size, item.createdByFont.size ]);

  React.useEffect(() => {
    if (videoHeight > 0) {
      return;
    }
    let vHeight = 0;
    clips.map((_, idx) => {
      const el = document.getElementById('clip-' + idx);
      if (el) {
        vHeight = height - el.offsetHeight;
      }
    });
    setVideoHeight(vHeight);
  }, [clips, videoHeight]);

  React.useEffect(() => {
    if (active) {
      getSocket('/overlays/credits', true).emit('getClips', {
        show: true,
        ...item,
      }, async (data) => {
        setClips(data);
        setIsLoading(false);
      });
    } else {
      setClips([
        {
          game:               'Elephant Dream',
          mp4:                'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
          title:              'The first Blender Open Movie from 2006',
          creatorDisplayName: 'Blender Foundation',
        },
      ]);
      setIsLoading(false);
    }
  }, [item, active]);

  return <Box sx={{
    width:         `${width}px`,
    height:        `${height}px`,
    position:      'relative',
    overflow:      'visible',
    textTransform: 'none',
    lineHeight:    'initial',
    pb:            2,
  }}>
    {!active && <Box sx={{
      opacity:  0.5,
      fontSize: 100,
      position: 'absolute',
      left:     0,
      right:    0,
      top:      0,
      bottom:   0,
      margin:   'auto',
      width:    'fit-content',
      height:   'fit-content',
      rotate:   '-45deg',
    }}>
      Example
    </Box>}
    {!isLoading && <>
      {clips.map((clip, idx) => <>
        <Box id={`clip-${idx}`}>
          <Typography sx={{
            textAlign:  item.titleFont.align,
            color:      item.titleFont.color,
            fontFamily: item.titleFont.family,
            fontWeight: item.titleFont.weight,
            fontSize:   item.titleFont.size + 'px',
            pl:         `${item.titleFont.pl}px`,
            pr:         `${item.titleFont.pr}px`,
            pb:         `${item.titleFont.pb}px`,
            pt:         `${item.titleFont.pt}px`,
            textShadow: [textStrokeGenerator(item.titleFont.borderPx, item.titleFont.borderColor), shadowGenerator(item.titleFont.shadow)].filter(Boolean).join(', '),
          }}>{clip.title}</Typography>
          <Typography sx={{
            textAlign:  item.gameFont.align,
            color:      item.gameFont.color,
            fontFamily: item.gameFont.family,
            fontWeight: item.gameFont.weight,
            fontSize:   item.gameFont.size + 'px',
            pl:         `${item.gameFont.pl}px`,
            pr:         `${item.gameFont.pr}px`,
            pb:         `${item.gameFont.pb}px`,
            pt:         `${item.gameFont.pt}px`,
            textShadow: [textStrokeGenerator(item.gameFont.borderPx, item.gameFont.borderColor), shadowGenerator(item.gameFont.shadow)].filter(Boolean).join(', '),
          }}>{clip.game}</Typography>
          <Typography sx={{
            textAlign:  item.createdByFont.align,
            color:      item.createdByFont.color,
            fontFamily: item.createdByFont.family,
            fontWeight: item.createdByFont.weight,
            fontSize:   item.createdByFont.size + 'px',
            pl:         `${item.createdByFont.pl}px`,
            pr:         `${item.createdByFont.pr}px`,
            pb:         `${item.createdByFont.pb}px`,
            pt:         `${item.createdByFont.pt}px`,
            textShadow: [textStrokeGenerator(item.createdByFont.borderPx, item.createdByFont.borderColor), shadowGenerator(item.createdByFont.shadow)].filter(Boolean).join(', '),
          }}>{clip.creatorDisplayName}</Typography>
        </Box>
        <Box sx={{
          p: 4, margin: 'auto', width: '100%', textAlign: 'center', height: `${videoHeight}px`,
        }} id={`video-${idx}`}>
          <video
            style={{ height: '100%' }}
            onLoadedData={(ev) => ev.currentTarget.volume = item.volume / 100}
            src={clip.mp4}
          />
        </Box>
      </>)}
    </>}
  </Box>;
};