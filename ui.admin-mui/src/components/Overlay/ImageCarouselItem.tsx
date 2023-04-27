import { ScopedCssBaseline } from '@mui/material';
import { Carousel } from '@sogebot/backend/dest/database/entity/overlay';
import React from 'react';

import type { Props } from './ChatItem';

export const ImageCarouselItem: React.FC<Props<Carousel>> = ({ item, active }) => {
  const [ model, setModel ] = React.useState(item);

  React.useEffect(() => {
    if (!active) {
      setModel(item);
    }
  }, [active, item]);

  return <ScopedCssBaseline
    sx={{
      width:         '100%',
      height:        '100%',
      position:      'relative',
      overflow:      'hidden',
      background:    'transparent',
      textTransform: 'none',
    }}>
    {JSON.stringify(model.images)}
  </ScopedCssBaseline>;
};