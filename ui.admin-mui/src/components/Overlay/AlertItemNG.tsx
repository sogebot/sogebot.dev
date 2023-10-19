import { Box } from '@mui/material';
import { EmitData } from '@sogebot/backend/dest/database/entity/alert';
import { Alerts } from '@sogebot/backend/dest/database/entity/overlay';
import { UserInterface } from '@sogebot/backend/dest/database/entity/user';
import { flatten } from '@sogebot/backend/dest/helpers/flatten';
import { Filter } from '@sogebot/backend/src/database/entity/alert';
import { itemsToEvalPart } from '@sogebot/ui-helpers/queryFilter';
import {
  useAtom, useAtomValue, useSetAtom,
} from 'jotai';
import React from 'react';
import { Helmet } from 'react-helmet';
import { useIntervalWhen, useSessionstorageState } from 'rooks';

import { isAlreadyProcessed } from './_processedSocketCalls';
import {
  anEmitData, anExpectedSoundCount, anFinishedSoundCount, anWaitingForTTS,
} from './AlertItem/atom';
import { AlertItemAudio } from './AlertItemAudio';
import { AlertItemCustom } from './AlertItemCustom';
import { AlertItemImage } from './AlertItemImage';
import { AlertItemText } from './AlertItemText';
import { AlertItemTTS } from './AlertItemTTS';
import type { Props } from './ChatItem';
import { getSocket } from '../../helpers/socket';

const loadedFonts: string[] = [];

const isResponsiveVoiceEnabled = () => {
  return new Promise<void>((resolve) => {
    const check = () => {
      if (typeof (window as any).responsiveVoice === 'undefined') {
        setTimeout(() => check(), 200);
      } else {
        console.debug('= ResponsiveVoice init OK');
        (window as any).responsiveVoice.init();
        resolve();
      }
    };
    check();
  });
};

const processFilter = (emitData: EmitData, filter: Filter): boolean => {
  if (filter && filter.items.length > 0) {
    const script = itemsToEvalPart(filter.items, filter.operator);
    const tierAsNumber = emitData.tier === 'Prime' ? 0 : Number(emitData.tier);

    /* eslint-disable */
    const username =  emitData.name;
    const name =      emitData.name;
    const game =      emitData.game || '';
    const amount =    emitData.amount;
    const service =   emitData.service;
    const message =   emitData.message;
    const tier =      tierAsNumber;
    const recipient = emitData.recipient;
    return eval(script);
    /* eslint-enable */
  }

  return true;
};

export const AlertItemNG: React.FC<Props<Alerts>> = ({ item }) => {
  const [ activeUntil, setActiveUntil ] = React.useState(0);

  getSocket('/core/emotes', true); // init socket

  const [responsiveVoiceKey, setResponsiveVoiceKey] = React.useState<string | null>(null);

  const [ defaultProfanityList, setDefaultProfanityList ] = React.useState<string[]>([]);
  const [ listHappyWords, setListHappyWords ] = React.useState<string[]>([]);
  const [ , setEmotesCache ] = useSessionstorageState<{
    code: string;
    type: 'twitch' | 'twitch-sub' | 'ffz' | 'bttv' | '7tv';
    urls: { '1': string; '2': string; '3': string };
  }[]>('emotes::cache', []);

  React.useEffect(() => {
    getSocket('/core/emotes', true).emit('getCache', (err, data) => {
      if (err) {
        return console.error(err);
      }
      setEmotesCache(data);
      console.debug('= Emotes loaded');
    });

    for (const [lang, isEnabled] of Object.entries(item.profanityFilter.list)) {
      if (lang.startsWith('_')) {
        continue;
      }
      if (isEnabled) {
        fetch(`${JSON.stringify(localStorage.server)}/assets/vulgarities/${lang}.txt`)
          .then(response2 => response2.text())
          .then((text) => {
            setDefaultProfanityList(Array.from(
              new Set([...defaultProfanityList, ...text.split(/\r?\n/), ...item.profanityFilter.customWords.split(',').map(o => o.trim())].filter(o => o.trim().length > 0)),
            ));
          })
          .catch((e) => {
            console.error(e);
          });

        fetch(`${JSON.stringify(localStorage.server)}/assets/happyWords/${lang}.txt`)
          .then(response2 => response2.text())
          .then((text) => {
            setListHappyWords([...listHappyWords, ...text.split(/\r?\n/)]);
          })
          .catch((e) => {
            console.error(e);
          });
      }
    }

    const head = document.getElementsByTagName('head')[0];
    const style = document.createElement('style');
    style.type = 'text/css';

    const fontsToLoad = [item.globalFont1.family, item.globalFont2.family];
    for (const key of Object.keys(flatten(item.items))) {
      if (key.includes('font')) {
        fontsToLoad.push((flatten(item.items))[key]);
      }
    }

    for (const fontFamily of fontsToLoad) {
      if (fontFamily && !loadedFonts.includes(fontFamily)) {
        console.debug('Loading font', fontFamily);
        loadedFonts.push(fontFamily);
        const font = fontFamily.replace(/ /g, '+');
        const css = '@import url(\'https://fonts.googleapis.com/css?family=' + font + '\');';
        style.appendChild(document.createTextNode(css));
      }
    }
    head.appendChild(style);
  }, []);

  // need to be done only for parryable alerts
  const haveAvailableAlert = (emitData: EmitData) => {
    if (emitData) {
      let possibleAlerts: (Alerts['items'][number] | Omit<Alerts['items'][number], 'variants' | 'hooks'>)[] = item.items.filter(o => o.hooks.includes(emitData.event as any));

      if (possibleAlerts.length === 0) {
        console.log('alert', 'No valid alerts found for hook:', emitData.event);
        console.log('alert', 'Throwing away emit data');
        setActiveUntil(0);
        setEmitData(null);
        return;
      }

      // now we need to generate alerts with variants also
      for (const alert of possibleAlerts) {
        if ('variants' in alert) {
          for (const variant of alert.variants) {
            possibleAlerts.push(variant);
          }
        }
      }

      possibleAlerts = possibleAlerts
        .filter(o => o.enabled !== false)
        .filter(o => processFilter(emitData, o.filter));
      if (possibleAlerts.length === 0) {
        console.log('alert', 'No valid alerts found after filter');
        setActiveUntil(0);
        return false;
      }
      return true;
    }
    return false;
  };

  const processIncomingAlert = async (data: EmitData & {
    id: string;
    isTTSMuted: boolean;
    isSoundMuted: boolean;
    TTSService: number;
    TTSKey: string;
    caster: UserInterface | null;
    user: UserInterface | null;
    recipientUser: UserInterface | null;
  }) => {
    if (isAlreadyProcessed(data.id)) {
      return;
    }
    console.debug('Incoming alert', data);

    if (data.TTSService === 0) {
      setResponsiveVoiceKey(data.TTSKey);
      await isResponsiveVoiceEnabled();
    }

    // checking for vulgarities
    if (data.message && data.message.length > 0) {
      for (const vulgar of defaultProfanityList) {
        if (item) {
          if (item.profanityFilter.type === 'replace-with-asterisk') {
            data.message = data.message.replace(new RegExp(vulgar, 'gmi'), '***');
          } else if (item.profanityFilter.type === 'replace-with-happy-words') {
            data.message = data.message.replace(new RegExp(vulgar, 'gmi'), listHappyWords[Math.floor(Math.random() * listHappyWords.length)]);
          } else if (item.profanityFilter.type === 'hide-messages') {
            if (data.message.search(new RegExp(vulgar, 'gmi')) >= 0) {
              console.debug('Message contain vulgarity "' + vulgar + '" and is hidden.');
              data.message = '';
            }
          } else if (item.profanityFilter.type === 'disable-alerts') {
            if (data.message.search(new RegExp(vulgar, 'gmi')) >= 0) {
              console.debug('Message contain vulgarity "' + vulgar + '" and is alert disabled.');
              return;
            }
          }
        }
      }
    }

    if (data.event === 'promo' && data.user && data.user.profileImageUrl) {
      console.log('TODO: add profile image');
      // getMeta(data.user.profileImageUrl, 'Thumbnail');
    }

    setTimeout(() => {
      if (['tip', 'cheer', 'resub', 'sub'].includes(data.event) && emitDataRef.current && item.parry.enabled && haveAvailableAlert(data)) {
        setEmitDataList(list => [...list, data]);
        console.log('Skipping playing alert - parrying enabled');
        setTimeout(() => {
          setActiveUntil(0);
          if (typeof (window as any).responsiveVoice !== 'undefined') {
            (window as any).responsiveVoice.cancel();
          }
        }, item.parry.delay);
      } else {
        setEmitDataList(list => [...list, data]);
      }
    }, item.alertDelayInMs);
  };

  const [ emitDataList, setEmitDataList ] = React.useState<NonNullable<typeof emitData>[]>([]);

  const [ emitData, setEmitData] = useAtom(anEmitData);
  const emitDataRef = React.useRef(emitData);
  React.useEffect(() => {
    emitDataRef.current = emitData;
  }, [ emitData ]);

  useIntervalWhen(() => {
    if (emitDataList.length === 0 || emitData !== null) {
      return;
    }

    setEmitDataList(list => {
      const data = list.shift();
      console.log('Triggering data');
      if (data) {
        setEmitData(data);
      }
      return [...list];
    });
  }, 100);

  React.useEffect(() => {
    console.log('= Listening to alert events');
    getSocket('/registries/alerts', true).on('alert', (data) => processIncomingAlert(data));
    getSocket('/registries/alerts', true).on('skip', () => {
      setActiveUntil(0);
      if (typeof (window as any).responsiveVoice !== 'undefined') {
        (window as any).responsiveVoice.cancel();
      }
    });
  }, []);

  const selectedGroup = React.useMemo(() => {
    if(!emitData) {
      return;
    }
    let possibleAlerts: (Alerts['items'][number] | Omit<Alerts['items'][number], 'variants' | 'hooks'>)[] = item.items.filter(o => o.hooks.includes(emitData.event as any));
    if (emitData.event === 'rewardredeem') {
      possibleAlerts = (possibleAlerts as any).filter((o: any) => o.rewardId === emitData.rewardId);
    }

    if (emitData.event === 'custom') {
      console.log('alert', 'Received custom event', emitData);
    }

    if (possibleAlerts.length === 0) {
      console.log('alert', 'No valid alerts found for hook:', emitData.event);
      console.log('alert', 'Throwing away emit data');
      setActiveUntil(0);
      setEmitData(null);
      return;
    }

    // now we need to generate alerts with variants also
    for (const alert of possibleAlerts) {
      if ('variants' in alert) {
        for (const variant of alert.variants) {
          possibleAlerts.push(variant);
        }
      }
    }

    possibleAlerts = possibleAlerts
      .filter(o => o.enabled !== false)
      .filter(o => processFilter(emitData, o.filter));
    if (possibleAlerts.length === 0) {
      console.log('alert', 'No valid alerts found after filter');
      setActiveUntil(0);
      return;
    }

    // after we have possible alerts -> generate random
    const possibleAlertsWithRandomCount: typeof possibleAlerts = [];
    // randomize variants
    for (const alert of possibleAlerts) {
      for (let i = 0; i < alert.weight; i++) {
        possibleAlertsWithRandomCount.push(alert);
      }
    }
    const selected = possibleAlertsWithRandomCount[Math.floor(Math.random() * possibleAlertsWithRandomCount.length)];
    for (const it of selected.items) {
      setTimeout(() => {
        const retry = () => {
          const el = document.getElementById(it.id);
          if (el) {
            el.style.opacity = '1';
          } else {
            setTimeout(() => retry(), 10);
          }
        };
        retry();
      }, 10);
    }

    console.log('Selected alert', selected);
    return selected;
  }, [item, emitData]);

  const selectedGroupMain = React.useMemo<Alerts['items'][number] | null | undefined>(() => {
    if (!selectedGroup) {
      return null;
    } else {
      if ('variants' in selectedGroup) {
        return selectedGroup as any; // main already
      } else {
        for (const alert of item.items) {
          for (const variant of alert.variants) {
            if (variant.id === selectedGroup.id) {
              return alert;
            }
          }
        }
      }
    }
  }, [selectedGroup, item]);

  React.useEffect(() => {
    if (selectedGroup) {
      setActiveUntil(Date.now() + (selectedGroup?.alertDuration ?? 0));
      // check if any audio component is present
      if (!selectedGroup.items.find(o => o.type === 'audio')) {
        setExpectedSoundCount(0);
      }
    }
  }, [ selectedGroup ]);

  const [ timestamp, setTimestamp ] = React.useState(Date.now());
  const waitingForTTS = useAtomValue(anWaitingForTTS);
  useIntervalWhen(() => {
    setTimestamp(Date.now());

    if (waitingForTTS) {
      console.log(`= waiting for TTS to finish`);
      return;
    }
    if (activeUntil - timestamp < (selectedGroup?.animationOutDuration ? -selectedGroup.animationOutDuration : -2000) && emitData) {
      console.log(`= Freeing up alert ${(selectedGroup?.animationOutDuration ?? 2000) / 1000} second after finished`);
      setActiveUntil(0);
    }
  }, 100);

  const setExpectedSoundCount = useSetAtom(anExpectedSoundCount);
  const setFinishedSoundCount = useSetAtom(anFinishedSoundCount);
  React.useEffect(() => {
    if (activeUntil === 0) {
      console.log('= Resetting emit data');
      setEmitData(null);
      setExpectedSoundCount(-1); // setting to -1
      setFinishedSoundCount(0);
    }
  }, [ activeUntil ]);

  return <Box sx={{
    width:         '100%',
    height:        '100%',
    textTransform: 'none !important',
    position:      'relative',
    lineHeight:    'normal !important',
    color:         'black',
  }}>
    <Helmet>
      {responsiveVoiceKey && <script src={`https://code.responsivevoice.org/responsivevoice.js?key=${responsiveVoiceKey}`}></script>}
    </Helmet>
    {activeUntil > 0 && <Box key={emitData?.id ?? 'no-id'}>
      {selectedGroup?.items.map((o) => <Box id={`${o.id}`} key={`${o.id}-${emitData?.id ?? 'no-id'}`} sx={{
        position:        'absolute' ,
        width:           `${o.width}px`,
        height:          `${o.height}px`,
        left:            `${o.alignX}px`,
        top:             `${o.alignY}px`,
        transform:       `rotate(${ o.rotation ?? 0 }deg)`,
        opacity:         0,
        transition:      `opacity 200ms`,
        transitionDelay: `${'animationDelay' in o ? o.animationDelay : 0}ms`,
      }}>
        {(selectedGroupMain && o.type === 'audio' && !emitData!.isSoundMuted) && <AlertItemAudio height={o.height} width={o.width} id={o.id} item={o} groupId={''} active={activeUntil - timestamp >= 0} variant={selectedGroupMain!}/>}
        {(selectedGroupMain && o.type === 'gallery') && <AlertItemImage height={o.height} width={o.width} id={o.id} item={o} groupId={''} variant={selectedGroupMain!} active={activeUntil - timestamp >= 0}/>}
        {(selectedGroupMain && o.type === 'text' && processFilter(emitData!, o.enabledWhen)) && <AlertItemText parent={item} height={o.height} width={o.width} id={o.id} item={o} groupId={''} variant={selectedGroupMain!} active={activeUntil - timestamp >= 0}/>}
        {(selectedGroupMain && o.type === 'custom' && processFilter(emitData!, o.enabledWhen)) && <AlertItemCustom parent={item} height={o.height} width={o.width} id={o.id} item={o} groupId={''}/>}
        {(selectedGroupMain && o.type === 'tts' && processFilter(emitData!, o.enabledWhen) && !emitData!.isSoundMuted && !emitData!.isTTSMuted) && <AlertItemTTS parent={item} height={o.height} width={o.width} id={o.id} item={o} groupId={''}/>}
      </Box>)}
    </Box>}
  </Box>;
};