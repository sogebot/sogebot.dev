import { Box, ScopedCssBaseline } from '@mui/material';
import { Carousel } from '@sogebot/backend/dest/database/entity/overlay';
import gsap from 'gsap';
import React from 'react';
import { useLocalstorageState } from 'rooks';
import shortid from 'shortid';

import type { Props } from './ChatItem';

export const ImageCarouselItem: React.FC<Props<Carousel>> = ({ item, active, height, width }) => {
  const [ index, setIndex ] = React.useState(-1);
  const [server] = useLocalstorageState('server', 'https://demobot.sogebot.xyz');
  const [ threadId ] = React.useState(shortid());

  React.useEffect(() => {
    if (index === -1 && (item.images ?? []).length > 0) {
      setIndex(0);
    }
  }, [ index, item, active ]);

  const currentImage = React.useMemo(() => index >= 0 ? item.images[index] : undefined, [ index ]);

  React.useEffect(() => {
    if (index === -1) {
      return;
    }

    (async function process () {
      const el = document.getElementById(threadId);
      const image = item.images[index]!;
      if (!el) {
        setTimeout(process, 100);
        return;
      }

      console.log('Waiting before', image.waitBefore);
      await new Promise(resolve => setTimeout(resolve, image.waitBefore));

      console.log('Showing image', image.animationInDuration);
      switch(image.animationIn) {
        case 'blur':
          gsap.to(el, {
            opacity: 0, duration: 0, filter: 'blur(500px)',
          });
          gsap.to(el, {
            filter: 'blur(0px)', opacity: 1, duration: image.animationInDuration / 1000,
          });
          break;
        case 'slideUp':
          gsap.to(el, {
            opacity: 0, duration: 0, position: 'absolute', top: height * 2,
          });
          gsap.to(el, {
            opacity: 1, top: 0, duration: image.animationInDuration / 1000,
          });
          break;
        case 'slideLeft':
          gsap.to(el, {
            opacity: 0, duration: 0, position: 'absolute', left: width * 2,
          });
          gsap.to(el, {
            opacity: 1, left: 0, duration: image.animationInDuration / 1000,
          });
          break;
        case 'slideRight':
          gsap.to(el, {
            opacity: 0, duration: 0, position: 'absolute', left: -width,
          });
          gsap.to(el, {
            opacity: 1, left: 0, duration: image.animationInDuration / 1000,
          });
          break;
        case 'slideDown':
          gsap.to(el, {
            opacity: 0, duration: 0, position: 'absolute', top: -height,
          });
          gsap.to(el, {
            opacity: 1, top: 0, duration: image.animationInDuration / 1000,
          });
          break;
        default: // fade
          gsap.to(el, {
            opacity: 1, duration: image.animationInDuration / 1000,
          });
          break;
      }
      await new Promise(resolve => setTimeout(resolve, image.animationInDuration));

      console.log('Waiting', image.duration);
      await new Promise(resolve => setTimeout(resolve, image.duration));

      console.log('Hiding image', image.animationOutDuration);
      switch(image.animationOut) {
        case 'blur':
          gsap.to(el, {
            filter: 'blur(500px)', opacity: 0, duration: image.animationInDuration / 1000,
          });
          break;
        default: // fade
          gsap.to(el, {
            opacity: 0, duration: image.animationOutDuration / 1000,
          });
          break;
        case 'slideDown':
          gsap.to(el, {
            opacity: 1, top: 0, duration: 0,
          });
          gsap.to(el, {
            opacity: 0, duration: image.animationInDuration / 1000, position: 'absolute', top: height * 2,
          });
          break;
        case 'slideRight':
          gsap.to(el, {
            opacity: 1, left: 0, duration: 0,
          });
          gsap.to(el, {
            opacity: 0, duration: image.animationInDuration / 1000, position: 'absolute', left: width * 2,
          });
          break;
        case 'slideLeft':
          gsap.to(el, {
            opacity: 1, left: 0, duration: 0,
          });
          gsap.to(el, {
            opacity: 0, duration: image.animationInDuration / 1000, position: 'absolute', left: -width,
          });
          break;
        case 'slideUp':
          gsap.to(el, {
            opacity: 1, top: 0, duration: 0,
          });
          gsap.to(el, {
            opacity: 0, duration: image.animationInDuration / 1000, position: 'absolute', top: -height,
          });
          break;
      }
      await new Promise(resolve => setTimeout(resolve, image.animationOutDuration));

      console.log('Waiting after', image.waitAfter);
      await new Promise(resolve => setTimeout(resolve, image.waitAfter));

      if(item.images[index + 1]) {
        setIndex(index + 1);
      } else {
        setIndex(-1);
      }
    })();
  }, [ index, threadId ]);

  return <ScopedCssBaseline
    sx={{
      width:         '100%',
      height:        '100%',
      position:      'relative',
      overflow:      'hidden',
      background:    'transparent',
      textTransform: 'none',
    }}>
    {currentImage && <Box id={threadId} key={currentImage.id} sx={{
      width: '100%', height: '100%',
    }} style={{ opacity: 0 }}>
      <img src={`${server}/gallery/${currentImage.url}`} style={{
        height:    '100%',
        width:     '100%',
        objectFit: 'scale-down',
      }}/>
    </Box>}
  </ScopedCssBaseline>;
};