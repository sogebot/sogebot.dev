import { Attributes } from '@sogebot/backend/dest/database/entity/event';
import { OBSWebsocket as Entity } from '@sogebot/backend/dest/database/entity/overlay';
import axios from 'axios';
import OBSWebSocket from 'obs-websocket-js';
import type ObsWebSocket from 'obs-websocket-js';
import React from 'react';
import { Socket } from 'socket.io-client';

import { isAlreadyProcessed } from './_processedSocketCalls';
import type { Props } from './ChatItem';
import { getSocket } from '../../helpers/socket';

const runningTasks: string[] = [];

export const events = [
  'CurrentSceneCollectionChanging',
  'CurrentSceneCollectionChanged',
  'SceneCollectionListChanged',
  'CurrentProfileChanging',
  'CurrentProfileChanged',
  'ProfileListChanged',
  'SourceFilterListReindexed',
  'SourceFilterCreated',
  'SourceFilterRemoved',
  'SourceFilterNameChanged',
  'SourceFilterEnableStateChanged',
  'InputCreated',
  'InputRemoved',
  'InputNameChanged',
  'InputActiveStateChanged',
  'InputShowStateChanged',
  'InputMuteStateChanged',
  'InputVolumeChanged',
  'InputAudioBalanceChanged',
  'InputAudioSyncOffsetChanged',
  'InputAudioTracksChanged',
  'InputAudioMonitorTypeChanged',
  'InputVolumeMeters',
  'MediaInputPlaybackStarted',
  'MediaInputPlaybackEnded',
  'MediaInputActionTriggered',
  'StreamStateChanged',
  'RecordStateChanged',
  'ReplayBufferStateChanged',
  'VirtualcamStateChanged',
  'ReplayBufferSaved',
  'SceneItemCreated',
  'SceneItemRemoved',
  'SceneItemListReindexed',
  'SceneItemEnableStateChanged',
  'SceneItemLockStateChanged',
  'SceneItemSelected',
  'SceneItemTransformChanged',
  'SceneCreated',
  'SceneRemoved',
  'SceneNameChanged',
  'CurrentProgramSceneChanged',
  'CurrentPreviewSceneChanged',
  'SceneListChanged',
  'CurrentSceneTransitionChanged',
  'CurrentSceneTransitionDurationChanged',
  'SceneTransitionStarted',
  'SceneTransitionEnded',
  'SceneTransitionVideoEnded',
  'StudioModeStateChanged',
  'ScreenshotSaved',
  'VendorEvent',
  'CustomEvent'
] as const;

const inputMuted = (obs: ObsWebSocket, socket?: Socket) => {
  const listener = (data: {
    inputName: string; inputMuted: boolean;
  }) => {
    if (process.env.BUILD === 'web') {
      console.debug(`obs::websocket::on:inputmuted ${data.inputName} | ${data.inputMuted}`);
      socket?.emit('integration::obswebsocket::event', {
        type:       'obs-input-mute-state-changed',
        inputName:  data.inputName,
        inputMuted: data.inputMuted,
        location:   window.location.href,
      });
    }
  };
  obs.off('InputMuteStateChanged', listener).on('InputMuteStateChanged', listener);
};

const switchScenes = (obs: ObsWebSocket, socket?: Socket) => {
  const listener = (data: {
    sceneName: string;
  }) => {
    if (process.env.BUILD === 'web') {
      console.debug(`obs::websocket::on:switchscenes ${data.sceneName}`);
      socket?.emit('integration::obswebsocket::event', {
        type:      'obs-scene-changed',
        sceneName: data.sceneName,
        location:  window.location.href,
      });
    }
  };
  obs.off('CurrentProgramSceneChanged', listener).on('CurrentProgramSceneChanged', listener);
};

function createHash(string: string) {
  const utf8 = new TextEncoder().encode(string);
  return crypto.subtle.digest('SHA-256', utf8).then((hashBuffer) => {
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((bytes) => bytes.toString(16).padStart(2, '0'))
      .join('');
    return hashHex;
  });
}

/* eslint-disable */
const evaluateScript = async(tasks: string, opts: {
  event: Attributes | undefined,
  obs: OBSWebSocket ,
  waitMs: (ms: number) => Promise<void>,
  log: (logMessage: string) => void,
}) => {
  const { event, obs, waitMs, log } = opts;
  eval(`(async function evaluation () { ${tasks} })()`);
};
/* eslint-enable */

const taskRunner = async (obs: ObsWebSocket, opts: { code: string, hash?: string, attributes?: Attributes }): Promise<void> => {
  const hash = opts.hash ?? await createHash(opts.code);
  const tasks = opts.code;
  if (runningTasks.includes(hash)) {
    // we need to have running only one
    await new Promise(resolve => setTimeout(resolve, 1));
    return taskRunner(obs, opts);
  }

  runningTasks.push(hash);

  try {
    evaluateScript(tasks, {
      event:  opts.attributes,
      obs,
      waitMs: (ms: number) => {
        return new Promise((resolve) => setTimeout(resolve, ms, null));
      },
      // we are using error on code so it will be seen in OBS Log Viewer
      log: (logMessage: string) => {
        console.error(logMessage);
        axios.post(`${JSON.parse(localStorage.server)}/integrations/obswebsocket/log`, { message: logMessage });
      },
    });
  } catch (e: any) {
    axios.post(`${JSON.parse(localStorage.server)}/integrations/obswebsocket/log`, { message: (e as Error).stack ?? '' });
    console.error(e);
    throw e;
  } finally {
    runningTasks.splice(runningTasks.indexOf(hash), 1);
  }
};

export const OBSWebsocketItem: React.FC<Props<Entity>> = ({ item }) => {
  const obs = React.useMemo(() => new OBSWebSocket(), []);

  const init = React.useCallback(async () => {
    console.log('====== OBS WEBSOCKET ======');
    if (item.allowedIPs.length > 0) {
      const currentIP = await new Promise<string>((resolve) => {
        fetch('https://api64.ipify.org?format=json')
          .then((res) => res.json())
          .then((json) => resolve(json.ip));
      });
      if (item.allowedIPs.includes(currentIP)) {
        console.log(`IP ${currentIP} have access to this OBSWebsocket overlay.`);
      } else {
        console.error(`IP ${currentIP} DON'T have access to this OBSWebsocket overlay.`);
        return;
      }
    } else {
      console.log(`There is no IP restrictions set.`);
    }

    try {
      if (item.password === '') {
        await obs.connect(`ws://localhost:${item.port ?? 4455}`);
      } else {
        await obs.connect(`ws://localhost:${item.port ?? 4455}`, item.password);
      }
      console.log('OBSWebsocket connected.');
    } catch (e) {
      console.error(e);
    }

    for (const event of events) {
      obs.off(event);
      obs.on(event, (args) => {
        getSocket('/', true).emit('integration::obswebsocket::listener', { event, args });
        console.log('integration::obswebsocket::listener', event, args);
      });
    }

    getSocket('/', true).on('integration::obswebsocket::trigger', async (opts, cb) => {
      console.log('integration::obswebsocket::trigger', opts);
      cb(); // resolve first so connection is OK
      try {
        await taskRunner(obs, opts);
      } catch (e) {
        axios.post(`${JSON.parse(localStorage.server)}/integrations/obswebsocket/log`, { message: (e as Error).stack ?? '' });
        console.error(e);
      }
    });

    getSocket('/', true).on('integration::obswebsocket::call', async (opts) => {
      if (isAlreadyProcessed(opts.id)) {
        return;
      }
      try {
        console.group('integration::obswebsocket::call');
        console.log({ opts });
        const res = await obs.call(opts.event as any, opts.args);
        console.log({ res });
        console.groupEnd();
        axios.post(`${JSON.parse(localStorage.server)}/api/plugins/obs`, res, { headers: {
          id: opts.id,
          'Content-Type': 'application/json',
        } });
      } catch (e) {
        axios.post(`${JSON.parse(localStorage.server)}/integrations/obswebsocket/log`, { message: (e as Error).stack ?? '' });
        console.error(e);
      }
    });

    getSocket('/', true).on('integration::obswebsocket::callBatch', async (opts, cb) => {
      if (isAlreadyProcessed(opts.id)) {
        return;
      }
      try {
        console.group('integration::obswebsocket::callBatch');
        console.log({ opts });
        const res = await obs.callBatch(opts.requests as any, opts.options).then(cb);
        console.log({ res });
        console.groupEnd();
        axios.post(`${JSON.parse(localStorage.server)}/api/plugins/obs/`, res, { headers: {
          id: opts.id,
          'Content-Type': 'application/json',
        } });
      } catch (e) {
        axios.post(`${JSON.parse(localStorage.server)}/integrations/obswebsocket/log`, { message: (e as Error).stack ?? '' });
        console.error(e);
      }
    });

    // add listeners
    switchScenes(obs, getSocket('/', true) as any);
    inputMuted(obs, getSocket('/', true) as any);
  }, []);

  React.useEffect(() => {
    init();
  }, [ init ]);

  return <></>;
};