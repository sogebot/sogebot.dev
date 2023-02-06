import { Box } from '@mui/material';
import { URL } from '@sogebot/backend/dest/database/entity/overlay';
import React from 'react';

type Props = {
  item: URL,
  id: string,
  groupId: string,
  /** Overlay is active, e.g. used in overlay */
  active?: boolean,
};

export const UrlItem: React.FC<Props> = ({ item }) => {
  return <Box sx={{
    width:  '100%',
    height: '100%',
  }}>
    <iframe src={item.url} width='100%' height='100%' frameBorder={0} scrolling='no' seamless style={{
      zIndex: -1, position: 'absolute',
    }}/>
  </Box>;
};