import { URL } from '@entity/overlay';
import { Box } from '@mui/material';
import React from 'react';

import type { Props } from './ChatItem';

export const UrlItem: React.FC<Props<URL>> = ({ item }) => {
  return <Box sx={{
    width:  '100%',
    height: '100%',
  }}>
    <iframe src={item.url} width='100%' height='100%' frameBorder={0} scrolling='no' seamless style={{
      zIndex: -1, position: 'absolute',
    }}/>
  </Box>;
};