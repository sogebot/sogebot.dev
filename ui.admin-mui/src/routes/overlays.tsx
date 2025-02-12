import { Buffer } from 'buffer';

import { Box } from '@mui/material';
import { Overlay } from '@sogebot/backend/dest/database/entity/overlay';
import axios from 'axios';
import React from 'react';
import { useParams } from 'react-router-dom';
import semver from 'semver';

import { versions } from '../compatibilityList';
import { AlertItem } from '../components/Overlay/AlertItem';
import { ChatItem } from '../components/Overlay/ChatItem';
import { ClipsCarouselItem } from '../components/Overlay/ClipsCarouselItem';
import { ClipsItem } from '../components/Overlay/ClipsItem';
import { CountdownItem } from '../components/Overlay/CountdownItem';
import { CreditsItem } from '../components/Overlay/CreditsItem';
import { EmotesComboItem } from '../components/Overlay/EmotesComboItem';
import { EmotesExplodeItem } from '../components/Overlay/EmotesExplodeItem';
import { EmotesFireworksItem } from '../components/Overlay/EmotesFireworksItem';
import { EmotesItem } from '../components/Overlay/EmotesItem';
import { EventlistItem } from '../components/Overlay/EventlistItem';
import { GoalItem } from '../components/Overlay/GoalItem';
import { HTMLItem } from '../components/Overlay/HTMLItem';
import { HypeTrainItem } from '../components/Overlay/HypeTrainItem';
import { ImageCarouselItem } from '../components/Overlay/ImageCarouselItem';
import { MarathonItem } from '../components/Overlay/MarathonItem';
import { OBSWebsocketItem } from '../components/Overlay/OBSWebsocketItem';
import { PollsItem } from '../components/Overlay/PollsItem';
import { RandomizerItem } from '../components/Overlay/RandomizerItem';
import { StatsItem } from '../components/Overlay/StatsItem';
import { StopwatchItem } from '../components/Overlay/StopwatchItem';
import { TTSItem } from '../components/Overlay/TTSItem';
import { UrlItem } from '../components/Overlay/UrlItem';
import { WordcloudItem } from '../components/Overlay/WordcloudItem';
import getAccessToken from '../getAccessToken';
import { getConfiguration, getSocket } from '../helpers/socket';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { setConfiguration, setTranslation } from '../store/loaderSlice';

export default function Overlays() {
  const { base64 } = useParams();
  const dispatch = useAppDispatch();

  const [ overlay, setOverlay ] = React.useState<null | Overlay>(null);
  const [ loading, setLoading ] = React.useState(true);
  const [ server, setServer ] = React.useState<null | string>(null);
  const [ id, setId ] = React.useState<null | string>(null);

  React.useEffect(() => {
    if (server) {
      axios.defaults.baseURL = server;

      const url = new URL(server);

      axios.get(`${url.origin}/health`)
        .then(res => {
          // request is not valid anymore
          if (server !== url.origin) {
            return;
          }

          // we don't have base path, do checks
          if ((process.env.REACT_APP_COMMIT || '').length === 0) {

            // 'OK' response was last in 16.8.0
            const version = res.data === 'OK' ? '16.8.0' : res.data;
            for (const versionKey of Object.keys(versions).reverse()) {
              if (semver.satisfies(version, versionKey)) {
                // we have found version and returning basepath
                window.location.href = `${new URL(window.location.href).origin}/${versions[versionKey as keyof typeof versions]}/overlays/${base64}`;
                return;
              }
            }
          }
        });
    }
  }, [ server, base64 ]);
  document.getElementsByTagName('body')[0].style.backgroundColor = 'transparent';

  React.useEffect(() => {
    if (base64) {
      const data = JSON.parse(String(Buffer.from(base64, 'base64')));
      localStorage.server = JSON.stringify(data.server);
      setServer(data.server);

      if (data.id) {
        setId(data.id);
      } else {
        setOverlay({
          id:     '',
          name:   '',
          canvas: {
            width:  0,
            height: 0,
          },
          items: [{
            alignX:    0,
            alignY:    0,
            height:    0,
            id:        '',
            isVisible: true,
            name:      '',
            opts:      {
              typeId: 'plugin', pluginId: data.pluginId, overlayId: data.overlayId,
            },
            rotation: 0,
            width:    0,

          }],
        } as Overlay);
        setLoading(false);
        setId('plugin');
        console.log('plugin');
      }
    }
  }, [ base64 ]);

  React.useEffect(() => {
    if (server && id) {
      Promise.all([
        new Promise(resolve => getSocket('/').emit('translations', (translations: any) => {
          dispatch(setTranslation(translations));
          resolve(true);
        })),
        new Promise(resolve => {
          getConfiguration().then(conf => dispatch(setConfiguration(conf))).finally(() => resolve(true));
        }),
        new Promise(resolve => {
          if (id === 'plugin') {
            resolve(true);
            return;
          }
          axios.get(`/api/registries/overlays/${id}`, {
            headers: {
              Authorization: `Bearer ${getAccessToken()}`
            }
          }).then(({ data }) => {
            setOverlay(data.data);
            resolve(true);
          });
        }),
      ]).finally(() => setLoading(false));
    }
  }, [ server ]);

  return <>
    { !loading && id && overlay && overlay.items
      .filter(o => o.isVisible)
      .map(item => <Box key={item.id} sx={{
        position:  'absolute',
        width:     item.opts.typeId === 'plugin' ? '100%' : `${item.width}px`,
        height:    item.opts.typeId === 'plugin' ? '100%' : `${item.height}px`,
        left:      `${item.alignX}px`,
        top:       `${item.alignY}px`,
        transform: `rotate(${item.rotation ?? 0}deg)`,
      }}>
        {item.opts.typeId === 'alerts' && <AlertItem key={item.id} id={item.id} groupId={id} item={item.opts} height={item.height} width={item.width} active />}
        {item.opts.typeId === 'chat' && <ChatItem key={item.id} zoom={1} id={item.id} groupId={id} item={item.opts} height={item.height} width={item.width} active />}
        {item.opts.typeId === 'countdown' && <CountdownItem key={item.id} id={item.id} groupId={id} item={item.opts} height={item.height} width={item.width} active />}
        {item.opts.typeId === 'credits' && <CreditsItem key={item.id} id={item.id} groupId={id} item={item.opts} height={item.height} width={item.width} active />}
        {item.opts.typeId === 'stopwatch' && <StopwatchItem key={item.id} id={item.id} groupId={id} item={item.opts} height={item.height} width={item.width} active />}
        {item.opts.typeId === 'marathon' && <MarathonItem key={item.id} id={item.id} groupId={id} item={item.opts} height={item.height} width={item.width} active />}
        {item.opts.typeId === 'obswebsocket' && <OBSWebsocketItem key={item.id} id={item.id} groupId={id} item={item.opts} height={item.height} width={item.width} active />}
        {item.opts.typeId === 'clipscarousel' && <ClipsCarouselItem key={item.id} id={item.id} groupId={id} item={item.opts} height={item.height} width={item.width} active />}
        {item.opts.typeId === 'clips' && <ClipsItem key={item.id} id={item.id} groupId={id} item={item.opts} height={item.height} width={item.width} active />}
        {item.opts.typeId === 'carousel' && <ImageCarouselItem key={item.id} id={item.id} groupId={id} item={item.opts} height={item.height} width={item.width} active />}
        {item.opts.typeId === 'tts' && <TTSItem key={item.id} id={item.id} groupId={id} item={item.opts} height={item.height} width={item.width} active />}
        {item.opts.typeId === 'emotesexplode' && <EmotesExplodeItem key={item.id} id={item.id} groupId={id} item={item.opts} height={item.height} width={item.width} active />}
        {item.opts.typeId === 'emotescombo' && <EmotesComboItem key={item.id} id={item.id} groupId={id} item={item.opts} height={item.height} width={item.width} active />}
        {item.opts.typeId === 'emotesfireworks' && <EmotesFireworksItem key={item.id} id={item.id} groupId={id} item={item.opts} height={item.height} width={item.width} active />}
        {item.opts.typeId === 'emotes' && <EmotesItem key={item.id} id={item.id} groupId={id} item={item.opts} height={item.height} width={item.width} active />}
        {item.opts.typeId === 'eventlist' && <EventlistItem key={item.id} id={item.id} groupId={id} item={item.opts} height={item.height} width={item.width} active />}
        {item.opts.typeId === 'url' && <UrlItem key={item.id} id={item.id} groupId={id} item={item.opts} height={item.height} width={item.width} active />}
        {item.opts.typeId === 'stats' && <StatsItem key={item.id} id={item.id} groupId={id} item={item.opts} height={item.height} width={item.width} active />}
        {item.opts.typeId === 'polls' && <PollsItem key={item.id} id={item.id} groupId={id} item={item.opts} height={item.height} width={item.width} active />}
        {item.opts.typeId === 'goal' && <GoalItem key={item.id} id={item.id} groupId={id} item={item.opts} height={item.height} width={item.width} active />}
        {item.opts.typeId === 'html' && <HTMLItem key={item.id} id={item.id} groupId={id} item={item.opts} height={item.height} width={item.width} active />}
        {item.opts.typeId === 'randomizer' && <RandomizerItem key={item.id} id={item.id} groupId={id} item={item.opts} height={item.height} width={item.width} active />}
        {item.opts.typeId === 'hypetrain' && <HypeTrainItem key={item.id} id={item.id} groupId={id} item={item.opts} height={item.height} width={item.width} active />}
        {item.opts.typeId === 'wordcloud' && <WordcloudItem key={item.id} id={item.id} groupId={id} item={item.opts} height={item.height} width={item.width} active />}
        {item.opts.typeId === 'plugin' && <iframe title="plugin iframe" src={`${server}/api/overlays/plugins/${item.opts.pluginId}/${item.opts.overlayId}?_raw`} scrolling='0' frameBorder={0} style={{
          width: `100%`, height: `100%`,
        }} />}
      </Box>,
      )
    }
  </>;
}