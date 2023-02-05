import { Buffer } from 'buffer';

import { Box } from '@mui/material';
import { Overlay } from '@sogebot/backend/dest/database/entity/overlay';
import React from 'react';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';

import { ClipsCarouselItem } from '../components/Overlay/ClipsCarouselItem';
import { CountdownItem } from '../components/Overlay/CountdownItem';
import { EventlistItem } from '../components/Overlay/EventlistItem';
import { getSocket } from '../helpers/socket';
import { setTranslation } from '../store/loaderSlice';

export default function Overlays() {
  const { base64 } = useParams();
  const dispatch = useDispatch();

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
      Promise.all([
        new Promise(resolve => getSocket('/', true).emit('translations', (translations) => {
          dispatch(setTranslation(translations));
          resolve(true);
        })),
        new Promise(resolve => getSocket('/registries/overlays', true).emit('generic::getOne', id, (err, result) => {
          if (err) {
            return console.error(err);
          }
          setOverlay(result);
          resolve(true);
        })),
      ]).finally(() => setLoading(false));
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
        {item.opts.typeId === 'eventlist' && <EventlistItem key={item.id} id={item.id} groupId={id} item={item.opts} active />}
      </Box>,
      )
    }
  </>;
}