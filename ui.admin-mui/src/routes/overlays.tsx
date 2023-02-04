import { Buffer } from 'buffer';

import { Box } from '@mui/material';
import { Overlay } from '@sogebot/backend/dest/database/entity/overlay';
import React from 'react';
import { useParams } from 'react-router-dom';

import { ClipsCarouselItem } from '../components/Overlay/ClipsCarouselItem';
import { CountdownItem } from '../components/Overlay/CountdownItem';
import { getSocket } from '../helpers/socket';

export default function Overlays() {
  const { base64 } = useParams();
  const [ overlay, setOverlay ] = React.useState<null | Overlay>(null);
  const [ loading, setLoading ] = React.useState(true);
  const [ server, setServer ] = React.useState<null | string>(null);
  const [ id, setId ] = React.useState<null | string>(null);
  document.getElementsByTagName('body')[0].style.backgroundColor = 'transparent';

  React.useEffect(() => {
    if (base64) {
      const data = JSON.parse(String(Buffer.from(base64, 'base64')));
      sessionStorage.server = JSON.stringify(data.server);
      setServer(data.server);
      setId(data.id);
    }
  }, [ base64 ]);

  React.useEffect(() => {
    if (server && id) {
      getSocket('/registries/overlays', true).emit('generic::getOne', id, (err, result) => {
        if (err) {
          return console.error(err);
        }
        setOverlay(result);
        setLoading(false);
      });
    }
  }, [ server ]);

  return <>
    { !loading && id && overlay && overlay.items
      .filter(o => o.isVisible)
      .map(item => <Box key={item.id} sx={{
        position: 'absolute',
        width:    `${item.width}px`,
        height:   `${item.height}px`,
        left:     `${item.alignX}px`,
        top:      `${item.alignY}px`,
      }}>
        {item.opts.typeId === 'countdown' && <CountdownItem key={item.id} id={item.id} groupId={id} item={item.opts} active />}
        {item.opts.typeId === 'clipscarousel' && <ClipsCarouselItem key={item.id} id={item.id} groupId={id} item={item.opts} active />}
      </Box>,
      )
    }
  </>;
}