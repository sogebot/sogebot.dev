import { ScopedCssBaseline } from '@mui/material';
import { Carousel } from '@sogebot/backend/dest/database/entity/overlay';
import React from 'react';
import { useLocalstorageState } from 'rooks';

import type { Props } from './ChatItem';

export const ImageCarouselItem: React.FC<Props<Carousel>> = ({ item, active }) => {
  const [ index, setIndex ] = React.useState(-1);
  const [server] = useLocalstorageState('server', 'https://demobot.sogebot.xyz');

  React.useEffect(() => {
    if (item.images.length > 0) {
      setIndex(0);
    }
  }, [active, item]);

  const currentImage = React.useMemo(() => index >= 0 ? item.images[index] : undefined, [ index ]);
  const [ show, setShow ] = React.useState(false);

  React.useEffect(() => {
    if (index === -1) {
      return;
    }

    // clean up variables
    setShow(false);

    (async function process () {
      console.log('Waiting before', item.images[index].waitBefore);
      await new Promise(resolve => setTimeout(resolve, item.images[index].waitBefore));

      console.log('Showing image', item.images[index].animationInDuration);
      setShow(true);
      await new Promise(resolve => setTimeout(resolve, item.images[index].animationInDuration));

      console.log('Waiting', item.images[index].duration);
      await new Promise(resolve => setTimeout(resolve, item.images[index].duration));

      console.log('Hiding image', item.images[index].animationOutDuration);
      setShow(false);
      await new Promise(resolve => setTimeout(resolve, item.images[index].animationOutDuration));

      console.log('Waiting after', item.images[index].waitAfter);
      await new Promise(resolve => setTimeout(resolve, item.images[index].waitAfter));

      if(item.images[index + 1]) {
        setIndex(index + 1);
      } else {
        setIndex(0);
      }
    })();
  }, [ index ]);

  return <ScopedCssBaseline
    sx={{
      width:         '100%',
      height:        '100%',
      position:      'relative',
      overflow:      'hidden',
      background:    'transparent',
      textTransform: 'none',
    }}>
    {currentImage && <>
      <img src={`${server}/gallery/${currentImage.url}`} style={{
        height:    '100%',
        width:     '100%',
        objectFit: 'scale-down',
        opacity:   show ? 1 : 0,
      }}/>
    </>}
  </ScopedCssBaseline>;
};