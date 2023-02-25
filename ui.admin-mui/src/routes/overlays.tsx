import { Buffer } from 'buffer';

import { Box } from '@mui/material';
import { Overlay } from '@sogebot/backend/dest/database/entity/overlay';
import React from 'react';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';

import { ChatItem } from '../components/Overlay/ChatItem';
import { ClipsCarouselItem } from '../components/Overlay/ClipsCarouselItem';
import { CountdownItem } from '../components/Overlay/CountdownItem';
import { EmotesFireworksItem } from '../components/Overlay/EmotesFireworksItem';
import { EmotesItem } from '../components/Overlay/EmotesItem';
import { EventlistItem } from '../components/Overlay/EventlistItem';
import { HTMLItem } from '../components/Overlay/HTMLItem';
import { HypeTrainItem } from '../components/Overlay/HypeTrainItem';
import { PollsItem } from '../components/Overlay/PollsItem';
import { TTSItem } from '../components/Overlay/TTSItem';
import { UrlItem } from '../components/Overlay/UrlItem';
import { WordcloudItem } from '../components/Overlay/WordcloudItem';
import { getConfiguration, getSocket } from '../helpers/socket';
import { setConfiguration, setTranslation } from '../store/loaderSlice';

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
        new Promise(resolve => {
          getConfiguration().then(conf => dispatch(setConfiguration(conf))).finally(() => resolve(true));
        }),
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
        position:  'absolute',
        width:     `${item.width}px`,
        height:    `${item.height}px`,
        left:      `${item.alignX}px`,
        top:       `${item.alignY}px`,
        transform: `rotate(${item.rotation ?? 0}deg)`,
      }}>
        {item.opts.typeId === 'chat' && <ChatItem key={item.id} id={item.id} groupId={id} item={item.opts} active />}
        {item.opts.typeId === 'countdown' && <CountdownItem key={item.id} id={item.id} groupId={id} item={item.opts} active />}
        {item.opts.typeId === 'clipscarousel' && <ClipsCarouselItem key={item.id} id={item.id} groupId={id} item={item.opts} active />}
        {item.opts.typeId === 'tts' && <TTSItem key={item.id} id={item.id} groupId={id} item={item.opts} active />}
        {item.opts.typeId === 'emotesfireworks' && <EmotesFireworksItem key={item.id} id={item.id} groupId={id} item={item.opts} active />}
        {item.opts.typeId === 'emotes' && <EmotesItem key={item.id} id={item.id} groupId={id} item={item.opts} active />}
        {item.opts.typeId === 'eventlist' && <EventlistItem key={item.id} id={item.id} groupId={id} item={item.opts} active />}
        {item.opts.typeId === 'url' && <UrlItem key={item.id} id={item.id} groupId={id} item={item.opts} active />}
        {item.opts.typeId === 'polls' && <PollsItem key={item.id} id={item.id} groupId={id} item={item.opts} active />}
        {item.opts.typeId === 'html' && <HTMLItem key={item.id} id={item.id} groupId={id} item={item.opts} active />}
        {item.opts.typeId === 'hypetrain' && <HypeTrainItem key={item.id} id={item.id} groupId={id} item={item.opts} active />}
        {item.opts.typeId === 'wordcloud' && <WordcloudItem key={item.id} id={item.id} groupId={id} item={item.opts} active />}
      </Box>,
      )
    }
  </>;
}