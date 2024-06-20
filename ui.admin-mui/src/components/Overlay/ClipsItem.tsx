import { Circle } from '@mui/icons-material';
import { Alert, Box, Fade, keyframes } from '@mui/material';
import { Clips } from '@sogebot/backend/dest/database/entity/overlay';
import React from 'react';

import type { Props } from './ChatItem';
import { isVideoSupported } from '../../helpers/isVideoSupported';
import { getSocket } from '../../helpers/socket';

const fadeInOut = keyframes`
  0% {
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
`;

export const ClipsItem: React.FC<Props<Clips>> = ({ item, active }) => {
  const [ model, setModel ] = React.useState(item);
  const [ clips, setClips ] = React.useState<{ id: string, mp4: string }[]>([]);

  const activeClip = React.useMemo(() => clips[0], [ clips ]);
  const isPlaying = React.useRef(false);
  const activeClipRef = React.useRef(activeClip);

  React.useEffect(() => {
    activeClipRef.current = activeClip;
  }, [ activeClip ]);

  const filter = React.useMemo(() => {
    if (model.filter === 'grayscale') {
      return { filter: 'grayscale(1)' };
    }
    if (model.filter === 'sepia') {
      return { filter: 'sepia(1)' };
    }
    if (model.filter === 'tint') {
      return { filter: 'sepia(1) hue-rotate(200deg)' };
    }
    if (model.filter === 'washed') {
      return { filter: 'contrast(1.4) saturate(1.8) sepia(0.6)' };
    }
    return {};
  }, [ model ]);

  React.useEffect(() => {
    if (!active) {
      setModel(item);
    }
  }, [active, item]);

  React.useEffect(() => {
    getSocket('/overlays/clips' as any).on('clips', (data: any) => {
      setClips(val => [...val, ...data.clips]);
    });

    setInterval(() => {
      const video = document.getElementById('video') as HTMLVideoElement;
      if (video !== null && video.ended) {
        isPlaying.current = false;
        setClips(clip => [...clip.slice(1)]);
        return;
      }

      if (!isPlaying.current) {
        isPlaying.current = !!activeClipRef.current;
        if (activeClipRef.current) {
          const source = document.createElement('source');
          source.setAttribute('src', activeClipRef.current.mp4);
          source.setAttribute('type', 'video/mp4');

          while (video.firstChild) {
            video.removeChild(video.firstChild);
          }
          video.appendChild(source);
          video.load();

          setTimeout(() => {
            video.currentTime = 0;
            video.volume = model.volume / 100;
            video.play().catch((reason) => {
              console.error(`Video cannot be started: ${reason}. Trying again in 1s.`);
              isPlaying.current = false;
            });
          }, 100);
        }
      }
    }, 100);

    if (active) {
      console.log(`====== CLIPS ======`);
    }
  }, [item]);

  return <>
    { isVideoSupported
      ? <Box sx={{
        width:    '100%',
        height:   '100%',
        overflow: 'hidden',
      }}>
        <Fade in={activeClip !== undefined}>
          <Box sx={{
            width:    '100%',
            position: 'relative',
            ...filter,
          }}>
            <Box sx={{
              position:  'absolute',
              left:      '5px',
              top:       '5px',
              color:     'red',
              animation: `${fadeInOut} 2s ease-in-out infinite`,
            }}><Circle fontSize='small'/></Box>
            <video preload="auto" playsInline style={{ width: '100%' }} id="video"/>
          </Box>
        </Fade>
      </Box>
      : <Box sx={{
        width:          '100%',
        height:         '100%',
        alignItems:     'center',
        justifyContent: 'center',
      }}>
        <Alert severity='error' sx={{ height: 'fit-content' }}>We are sorry, but this browser doesn't support video mp4/h264</Alert>
      </Box>
    }
  </>;
};