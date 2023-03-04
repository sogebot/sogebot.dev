import {
  Box, Button, Grow, SxProps, Theme,
} from '@mui/material';
import { Alert, EmitData } from '@sogebot/backend/dest/database/entity/alert';
import { AlertsRegistry } from '@sogebot/backend/dest/database/entity/overlay';
import { UserInterface } from '@sogebot/backend/dest/database/entity/user';
import { itemsToEvalPart } from '@sogebot/ui-helpers/queryFilter';
import { shadowGenerator, textStrokeGenerator } from '@sogebot/ui-helpers/text';
import axios from 'axios';
import baffle from 'baffle';
import HTMLReactParser from 'html-react-parser';
import { get } from 'lodash';
import React from 'react';
import { Helmet } from 'react-helmet';
import { Typewriter } from 'react-simple-typewriter';
import reactStringReplace from 'react-string-replace';
import { useIntervalWhen } from 'rooks';
import urlRegex from 'url-regex';
import { v4 } from 'uuid';
import './assets/letter-animations.css';

import type { Props } from './ChatItem';
import getAccessToken from '../../getAccessToken';
import { getSocket } from '../../helpers/socket';

require('animate.css');

const layouts: Record<string, SxProps<Theme>> = {
  '0': { display: 'none' },
  '1': {
    display:       'flex',
    flexDirection: 'column',
  },
  '2': {
    display:       'flex',
    flexDirection: 'column-reverse',
  },
  '3': {
    display:    'grid',
    alignItems: 'center',
    '& > *':    {
      position:  'absolute',
      top:       '50%',
      left:      '50%',
      transform: 'translate(-50%, -50%) !important',
    },
  },
  '4': {
    display:       'flex',
    alignItems:    'center',
    flexDirection: 'row-reverse',
  },
  '5': {
    display:       'flex',
    alignItems:    'center',
    flexDirection: 'row',
  },
};

type RunningAlert = EmitData & {
  id: string;
  isShowingText: boolean;
  isShowing: boolean;
  soundPlayed: boolean;
  hideAt: number;
  showTextAt: number;
  showAt: number;
  waitingForTTS: boolean;
  alert: (Alert['items'][number]) & { ttsTemplate?: string };
  isTTSMuted: boolean;
  isSoundMuted: boolean;
  TTSService: number,
  TTSKey: string,
  caster: null | UserInterface,
  user: null | UserInterface,
  recipientUser: null | UserInterface,
  game?: string,
};

const loadedFonts: string[] = [];
const loadedScripts: string[] = [];
const loadedMedia: string[] = [];

const typeOfMedia: Map<string, 'audio' | 'image' | 'video' | 'thumbnail' | null> = new Map();
const sizeOfMedia: Map<string | null, [width: number, height: number]> = new Map();

let snd: HTMLAudioElement; // to be able to parry

let isTTSPlaying = false;
let cleanupAlert = false;

const alerts: (EmitData & {
  isTTSMuted: boolean, isSoundMuted: boolean, TTSService: number, TTSKey: string,
  caster: null | UserInterface,
  user: null | UserInterface,
  recipientUser: null | UserInterface,
  game?: string,
})[] = [];

/* eslint-disable */
const triggerFunction = (_____________code: string, _____________fnc: 'onStarted' | 'onEnded', _____________alert: RunningAlert) => {
  const waitMs = (ms: number) => {
    return new Promise(resolve => setTimeout(resolve, ms, null));
  };
  const caster = _____________alert.caster;
  const user = _____________alert.user;
  const recipient = _____________alert.recipientUser;
  eval(
    `(async function() { ${_____________code}; if (typeof ${_____________fnc} === 'function') { console.log('executing ${_____________fnc}()'); await ${_____________fnc}() } else { console.log('no ${_____________fnc}() function found'); } })()`,
  );
};
/* eslint-enable */
const filterVariants = (emitData: EmitData) => (o: Alert['items'][number]) => {
  if (!o.enabled) {
    return false;
  }
  const filter = o.filter ? JSON.parse(o.filter) : null;
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
const getSizeOfMedia = (mediaId: string | null, scale: number, type: 'height' | 'width') => {
  const [width, height] = sizeOfMedia.get(mediaId) ?? [0, 0];

  if (height === 0 || width === 0) {
    return 'auto';
  }

  if (type === 'height') {
    return `${height * scale}px`;
  } else {
    return `${width * scale}px`;
  }
};
const haveAvailableAlert = (emitData: EmitData, data: Alert | null) => {
  if (emitData && data) {
    let possibleAlerts = data.items.filter(o => o.type === emitData.event);

    // select only correct triggered events
    if (emitData.event === 'rewardredeem') {
      possibleAlerts = (possibleAlerts as any).filter((o: any) => o.rewardId === emitData.rewardId);
    }
    if (possibleAlerts.length > 0) {
      // filter variants
      possibleAlerts = possibleAlerts.filter(filterVariants(emitData));

      // after we have possible alerts -> generate random
      const possibleAlertsWithRandomCount: Alert['items'] = [];
      // check if exclusive alert is there then run only it (+ other exclusive)
      if (possibleAlerts.find(o => o.variantAmount === 5)) {
        for (const alert of possibleAlerts.filter(o => o.variantAmount === 5)) {
          possibleAlertsWithRandomCount.push(alert);
        }
      } else {
        // randomize variants
        for (const alert of possibleAlerts) {
          for (let i = 0; i < alert.variantAmount; i++) {
            possibleAlertsWithRandomCount.push(alert);
          }
        }
      }

      const alert: Alert['items'][number] | undefined = possibleAlertsWithRandomCount[Math.floor(Math.random() * possibleAlertsWithRandomCount.length)];
      return !!alert;
    }
  }
  return false;
};
const link = (val: string | null) => {
  return `${JSON.parse(localStorage.server)}/gallery/${val}`;
};
const getMeta = (mediaId: string, type: 'Video' | 'Image' | 'Thumbnail') => {
  if (type === 'Video') {
    const vid = document.createElement('video');
    vid.addEventListener('loadedmetadata', (ev) => {
      const el = ev.target as HTMLVideoElement;
      sizeOfMedia.set(mediaId, [el.videoWidth, el.videoHeight]);
    });
    vid.src = link(mediaId);
  } else if (type === 'Image') {
    const img = new Image();
    img.addEventListener('load', (ev) => {
      const el = ev.target as HTMLImageElement;
      sizeOfMedia.set(mediaId, [el.naturalWidth, el.naturalHeight]);
    });
    img.src = link(mediaId);
  } else {
    const img = new Image();
    img.addEventListener('load', (ev) => {
      const el = ev.target as HTMLImageElement;
      sizeOfMedia.set(mediaId, [el.naturalWidth, el.naturalHeight]);
    });
    img.src = mediaId;
  }
};
const encodeFont = (font: string) => {
  return `'${font}'`;
};
const withEmotes = (text: string | undefined, emotes: any, runningAlert: RunningAlert) => {
  if (typeof text === 'undefined' || text.length === 0) {
    return '';
  }
  // checking emotes
  for (const emote of emotes) {
    if (get(runningAlert, `alert.message.allowEmotes.${emote.type}`, false)) {
      const split: string[] = (text as string).split(' ');
      for (let i = 0; i < split.length; i++) {
        if (split[i] === emote.code) {
          split[i] = `<img src='${emote.urls[1]}' style='position: relative; top: 0.1rem;'/>`;
        }
      }
      text = split.join(' ');
    }
  }
  return text;
};
const prepareMessageTemplate = (alert: Alert, runningAlert: RunningAlert, msg: string) => {
  const prepareChar = (char: string, index: number) => {
    if (char.trim().length === 0) {
      return <span style={{ paddingLeft: `${(runningAlert.alert.font?.size ?? 10) * 2}px` }} />;
    }
    return <div
      style= {{
        animationDelay: `${index * 50}ms`,
        color:          runningAlert.alert.font ? runningAlert.alert.font.highlightcolor : alert?.font.highlightcolor,
        display:        'inline-block',
      }}
      className={`animate__animated animate__infinite animate__${runningAlert.alert.animationText} animate__${runningAlert.alert.animationTextOptions.speed}`}>
      { char }
    </div>;
  };
  let game = (runningAlert.game || '').split('').map(prepareChar);
  let name = (runningAlert.name || '').split('').map(prepareChar);
  let recipient = (runningAlert.recipient || '').split('').map(prepareChar);
  let amount = (String(runningAlert.amount) || '').split('').map(prepareChar);
  let currency = (runningAlert.currency || '').split('').map(prepareChar);
  let monthsName = (runningAlert.monthsName || '').split('').map(prepareChar);

  const isFadingOut = runningAlert.hideAt - Date.now() <= 0
        && !isTTSPlaying
        && !runningAlert.waitingForTTS;

  if (!isFadingOut && (runningAlert.alert.animationText === 'baffle' || runningAlert.alert.animationText === 'typewriter')) {
    if (runningAlert.alert.animationText === 'baffle') {
      name = [<span className="obfuscate-name" style={{ color: runningAlert.alert.font ? runningAlert.alert.font.highlightcolor : alert?.font.highlightcolor }}>{runningAlert.name}</span>];
      game = [<span className="obfuscate-game" style={{ color: runningAlert.alert.font ? runningAlert.alert.font.highlightcolor : alert?.font.highlightcolor }}>{runningAlert.game}</span>];
      recipient = [<span className="obfuscate-recipient" style={{ color: runningAlert.alert.font ? runningAlert.alert.font.highlightcolor : alert?.font.highlightcolor }}>{runningAlert.recipient}</span>];
      amount = [<span className="obfuscate-amount" style={{ color: runningAlert.alert.font ? runningAlert.alert.font.highlightcolor : alert?.font.highlightcolor }}>{runningAlert.amount}</span>];
      currency = [<span className="obfuscate-currency" style={{ color: runningAlert.alert.font ? runningAlert.alert.font.highlightcolor : alert?.font.highlightcolor }}>{runningAlert.currency}</span>];
      monthsName = [<span className="obfuscate-monthsName" style={{ color: runningAlert.alert.font ? runningAlert.alert.font.highlightcolor : alert?.font.highlightcolor }}>{runningAlert.monthsName}</span>];
      setTimeout(() => {
        for (const item of ['game', 'name', 'recipient', 'amount', 'currency', 'monthsName']) {
          baffle('.obfuscate-' + item, {
            characters: runningAlert.alert.animationTextOptions.characters,
            speed:      runningAlert.alert.animationTextOptions.speed,
          }).start().reveal(4000, 4000);
        }
      });
    } else {
      name = [<span style={{ color: runningAlert.alert.font ? runningAlert.alert.font.highlightcolor : alert?.font.highlightcolor }}>
        <Typewriter
          words={['', runningAlert.name]}
          loop={1}
          cursor
          cursorStyle='_'
          typeSpeed={runningAlert.alert.animationTextOptions.speed as unknown as number}

          delaySpeed={runningAlert.alert.animationInDuration + runningAlert.alert.alertTextDelayInMs}
        />
      </span>];
    }
  }
  let replacedText = reactStringReplace(msg, /(\{name:highlight\})/g, () => name);
  replacedText = reactStringReplace(replacedText, /(\{game:highlight\})/g, () => game);
  replacedText = reactStringReplace(replacedText, /(\{recipient:highlight\})/g, () => recipient);
  replacedText = reactStringReplace(replacedText, /(\{amount:highlight\})/g, () => amount);
  replacedText = reactStringReplace(replacedText, /(\{currency:highlight\})/g, () => currency);
  replacedText = reactStringReplace(replacedText, /(\{monthsName:highlight\})/g, () => monthsName);
  replacedText = reactStringReplace(replacedText, /(\{game\})/g, () => runningAlert.game || '');
  replacedText = reactStringReplace(replacedText, /(\{name\})/g, () => runningAlert.name);
  replacedText = reactStringReplace(replacedText, /(\{amount\})/g, () => String(runningAlert.amount));
  replacedText = reactStringReplace(replacedText, /(\{currency\})/g, () => runningAlert.currency);
  replacedText = reactStringReplace(replacedText, /(\{monthsName\})/g, () => runningAlert.monthsName);

  return <Box sx={{
    fontFamily: encodeFont(runningAlert.alert.font ? runningAlert.alert.font.family : alert.font.family),
    fontSize:   (runningAlert.alert.font ? runningAlert.alert.font.size : alert.font.size) + 'px',
    fontWeight: runningAlert.alert.font ? runningAlert.alert.font.weight : alert.font.weight,
    color:      runningAlert.alert.font ? runningAlert.alert.font.color : alert.font.color,
    textShadow: [
      textStrokeGenerator(
        runningAlert.alert.font ? runningAlert.alert.font.borderPx : alert.font.borderPx,
        runningAlert.alert.font ? runningAlert.alert.font.borderColor : alert.font.borderColor,
      ),
      shadowGenerator(runningAlert.alert.font ? runningAlert.alert.font.shadow : alert.font.shadow)].filter(Boolean).join(', '),
  }}>
    {replacedText}
  </Box>;
};

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

export const AlertItem: React.FC<Props<AlertsRegistry>> = ({ item, selected }) => {
  getSocket('/core/emotes', true); // init socket

  const [ timestamp, setTimestamp ] = React.useState(0);
  const [ alert, setAlert ] = React.useState<null | Alert>(null);
  const [ ready, setReady ] = React.useState(false);
  const [ defaultProfanityList, setDefaultProfanityList ] = React.useState<string[]>([]);
  const [ listHappyWords, setListHappyWords ] = React.useState<string[]>([]);
  const [ emotes, setEmotes ] = React.useState<{
    code: string;
    type: 'twitch' | 'twitch-sub' | 'ffz' | 'bttv' | '7tv';
    urls: { '1': string; '2': string; '3': string };
  }[]>([]);

  const [responsiveVoiceKey, setResponsiveVoiceKey] = React.useState<string | null>(null);

  const [ runningAlert, setRunningAlert ] = React.useState<null | RunningAlert>(null);
  const [ showImage, setShowImage ] = React.useState(false);
  const [ shouldAnimate, setShouldAnimate ] = React.useState(false);

  const animationTextClass = React.useMemo(() => {
    if (runningAlert && runningAlert.showTextAt <= timestamp) {
      return runningAlert.hideAt - timestamp <= 0
          && (!isTTSPlaying || !runningAlert.alert.tts.keepAlertShown)
          && !runningAlert.waitingForTTS
        ? runningAlert.alert.animationOut
        : runningAlert.alert.animationIn;
    } else {
      return 'none';
    }
  }, [ runningAlert, timestamp ]);
  const animationSpeed = React.useMemo(() => {
    if (runningAlert) {
      return runningAlert.hideAt - timestamp <= 0
          && (!isTTSPlaying || !runningAlert.alert.tts.keepAlertShown)
          && !runningAlert.waitingForTTS
        ? (runningAlert.alert.animationOut === 'none' ? 0 : runningAlert.alert.animationOutDuration)
        : (runningAlert.alert.animationIn === 'none' ? 0 : runningAlert.alert.animationInDuration);
    } else {
      return 1000;
    }
  }, [ runningAlert, timestamp ]);
  const animationClass = React.useMemo(() => {
    if (runningAlert) {
      if (runningAlert.hideAt - timestamp <= 0
          && (!isTTSPlaying || !runningAlert.alert.tts.keepAlertShown)
          && !runningAlert.waitingForTTS) {
        // animation out
        return runningAlert.alert.animationOutDuration === 0 ? 'none' : runningAlert.alert.animationOut;
      } else {
        return runningAlert.alert.animationInDuration === 0 ? 'none' : runningAlert.alert.animationIn;
      }
    } else {
      return 'none';
    }
  }, [ runningAlert, timestamp ]);

  const messageTemplateSplit = React.useMemo(() => {
    if (runningAlert) {
      return runningAlert.alert.messageTemplate.split('|').map(o => o.trim());
    }
    return [];
  }, [runningAlert]);
  const [messageTemplateSplitIdx, setMessageTemplateSplitIdx] = React.useState(-1);

  React.useEffect(() => {
    if (shouldAnimate) {
      setMessageTemplateSplitIdx(0); // this starts splitting
    } else {
      setMessageTemplateSplitIdx(-1);
    }
  }, [shouldAnimate]);

  React.useEffect(() => {
    if (!runningAlert) {
      return;
    }
    if (messageTemplateSplitIdx > -1) {
      // get num of rows
      const rows = messageTemplateSplit.length;
      const alertDuration = runningAlert.hideAt - runningAlert.showTextAt;
      const timePerRow = alertDuration / rows;
      if (runningAlert.hideAt > Date.now()) {
        setTimeout(() => {
          if (messageTemplateSplitIdx > -1 && messageTemplateSplitIdx < rows - 1) {
            console.log('Showing next row');
            // change only if bigger then -1
            setMessageTemplateSplitIdx(o => o + 1);
          }
        }, timePerRow);
      }
    }
  }, [ messageTemplateSplitIdx ]);

  const speak = React.useCallback(async (text: string, voice: string, rate: number, pitch: number, volume: number) => {
    isTTSPlaying = true;
    if (runningAlert?.TTSService === 0) {
      console.log('Using ResponsiveVoice as TTS Service.');
      for (const TTS of text.split('/ ')) {
        await new Promise<void>((resolve) => {
          if (TTS.trim().length === 0) {
            setTimeout(() => resolve(), 500);
          } else if ((window as any).responsiveVoice) {
            (window as any).responsiveVoice.speak(TTS, voice, {
              rate, pitch, volume, onend: () => setTimeout(() => resolve(), 500),
            });
          } else {
            resolve();
          }
        });
        isTTSPlaying = false;
      }
    } else if (runningAlert?.TTSService === 1) {
      console.log('Using Google TTS as TTS Service.');
      getSocket('/registries/alerts', true).emit('speak', {
        volume, pitch, rate, voice, text, key: runningAlert.TTSKey,
      }, (err, b64mp3) => {
        if (err) {
          isTTSPlaying = false;
          return console.error(err);
        }
        snd = new Audio(`data:audio/mp3;base64,` + b64mp3);
        snd.play();
        snd.onended = () => (isTTSPlaying = false);
      });
    } else {
      isTTSPlaying = false;
    }
  }, [ runningAlert ]);

  const processIncomingAlert = async (data2: EmitData & {
    isTTSMuted: boolean;
    isSoundMuted: boolean;
    TTSService: number;
    TTSKey: string;
    caster: UserInterface | null;
    user: UserInterface | null;
    recipientUser: UserInterface | null;
  }) => {
    console.debug('Incoming alert', data2);

    if (data2.TTSService === 0) {
      setResponsiveVoiceKey(data2.TTSKey);
      await isResponsiveVoiceEnabled();
    }

    // checking for vulgarities
    if (data2.message && data2.message.length > 0) {
      for (const vulgar of defaultProfanityList) {
        if (alert) {
          if (alert.profanityFilterType === 'replace-with-asterisk') {
            data2.message = data2.message.replace(new RegExp(vulgar, 'gmi'), '***');
          } else if (alert.profanityFilterType === 'replace-with-happy-words') {
            data2.message = data2.message.replace(new RegExp(vulgar, 'gmi'), listHappyWords[Math.floor(Math.random() * listHappyWords.length)]);
          } else if (alert.profanityFilterType === 'hide-messages') {
            if (data2.message.search(new RegExp(vulgar, 'gmi')) >= 0) {
              console.debug('Message contain vulgarity "' + vulgar + '" and is hidden.');
              data2.message = '';
            }
          } else if (alert.profanityFilterType === 'disable-alerts') {
            if (data2.message.search(new RegExp(vulgar, 'gmi')) >= 0) {
              console.debug('Message contain vulgarity "' + vulgar + '" and is alert disabled.');
              return;
            }
          }
        }
      }
    }

    if (data2.event === 'promo' && data2.user && data2.user.profileImageUrl) {
      getMeta(data2.user.profileImageUrl, 'Thumbnail');
    }

    if (alert && ['tips', 'cheers', 'resubs', 'subs'].includes(data2.event) && runningAlert && alert.parry.enabled && haveAvailableAlert(data2, alert)) {
      alerts.push(data2);
      console.log('Skipping playing alert - parrying enabled');
      setTimeout(() => {
        setRunningAlert(null);
        if (typeof (window as any).responsiveVoice !== 'undefined') {
          (window as any).responsiveVoice.cancel();
        }
        if (snd) {
          snd.pause();
          isTTSPlaying = false;
        }
      }, alert.parry.delay);
    } else {
      alerts.push(data2);
    }
  };

  React.useEffect(() => {
    console.log('alert', 'init');
    getSocket('/registries/alerts', true).on('alert', (data2) => {
      processIncomingAlert(data2);
    });
    getSocket('/registries/alerts', true).on('skip', () => {
      if (runningAlert) {
        console.log('Skipping playing alert');
        setRunningAlert(null);
        if (typeof (window as any).responsiveVoice !== 'undefined') {
          (window as any).responsiveVoice.cancel();
        }
      } else {
        console.log('No alert to skip');
      }
    });
  }, []);

  // process alert refresh
  useIntervalWhen(() => {
    // update alert only if no alert is currently in progress
    if (!runningAlert) {
      axios.get<Alert>(`${JSON.parse(localStorage.server)}/api/registries/alerts/${item.id}`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
        .then(async res => {
          if (!alert || alert.updatedAt !== res.data.updatedAt) {
            setReady(false);
            setAlert(res.data);

            // process cache
            // determinate if image is image or video
            for (const event of res.data.items) {
              event.soundId = event.soundId === '_default_' ? '_default_audio' : event.soundId;
              event.imageId = event.imageId === '_default_' ? '_default_image' : event.imageId;

              if (event.soundId && !loadedMedia.includes(event.soundId)) {
                loadedMedia.push(event.soundId);
                fetch(link(event.soundId), { headers: { 'Cache-Control': 'max-age=604800' } })
                  .then((response2) => {
                    if (!response2.ok) {
                      throw new Error('Network response was not ok');
                    }
                    return response2.blob();
                  })
                  .then(() => {
                    console.log(`Audio ${event.soundId} was found on server.`);
                    typeOfMedia.set(event.soundId || '', 'audio');
                  })
                  .catch((error) => {
                    typeOfMedia.set(event.soundId || '', null);
                    console.error(`Audio ${event.soundId} was not found on server.`);
                    console.error(error);
                  });
              }
              if (event.imageId && !loadedMedia.includes(event.imageId)) {
                loadedMedia.push(event.imageId);
                fetch(link(event.imageId), { headers: { 'Cache-Control': 'max-age=604800' } })
                  .then(async (response2) => {
                    if (!response2.ok || !event.imageId) {
                      throw new Error('Network response was not ok');
                    }
                    const myBlob = await response2.blob();
                    console.log(`${myBlob.type.startsWith('video') ? 'Video' : 'Image'} ${event.imageId} was found on server.`);
                    typeOfMedia.set(event.imageId, myBlob.type.startsWith('video') ? 'video' : 'image');

                    if (event.imageId) {
                      getMeta(event.imageId, myBlob.type.startsWith('video') ? 'Video' : 'Image');
                    }
                  })
                  .catch((error) => {
                    console.error(error);
                    typeOfMedia.set(event.imageId || '', null);
                    console.error(`Image/Video ${event.imageId} was not found on server.`);
                  });
              }
            }
            for (const [lang, isEnabled] of Object.entries(res.data.loadStandardProfanityList)) {
              if (lang.startsWith('_')) {
                continue;
              }
              if (isEnabled) {
                fetch(`${JSON.stringify(localStorage.server)}/assets/vulgarities/${lang}.txt`)
                  .then(response2 => response2.text())
                  .then((text) => {
                    setDefaultProfanityList(Array.from(
                      new Set([...defaultProfanityList, ...text.split(/\r?\n/), ...res.data.customProfanityList.split(',').map(o => o.trim())].filter(o => o.trim().length > 0)),
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
            setDefaultProfanityList([...defaultProfanityList, ...res.data.customProfanityList.split(',').map(o => o.trim())].filter(o => o.trim().length > 0));

            const head = document.getElementsByTagName('head')[0];
            const style = document.createElement('style');
            style.type = 'text/css';
            for (const event of res.data.items) {
              const fontFamily = event.font ? event.font.family : res.data.font.family;
              if (fontFamily && !loadedFonts.includes(fontFamily)) {
                console.debug('Loading font', fontFamily);
                loadedFonts.push(fontFamily);
                const font = fontFamily.replace(/ /g, '+');
                const css = '@import url(\'https://fonts.googleapis.com/css?family=' + font + '\');';
                style.appendChild(document.createTextNode(css));
              }
              const messageFontFamily = (event as any).message?.font?.family || res.data.fontMessage.family;
              if (typeof (event as any).message !== 'undefined' && !loadedFonts.includes(messageFontFamily)) {
                console.debug('Loading font', messageFontFamily);
                loadedFonts.push(messageFontFamily);
                const font = ((event as any).message.font ? (event as any).message.font.family : res.data.fontMessage.family).replace(/ /g, '+');
                const css = '@import url(\'https://fonts.googleapis.com/css?family=' + font + '\');';
                style.appendChild(document.createTextNode(css));
              }
            }
            head.appendChild(style);

            // load emotes
            await new Promise((done) => {
              setTimeout(() => {
                getSocket('/core/emotes', true).emit('getCache', (err3, data3) => {
                  if (err3) {
                    return console.error(err3);
                  }
                  setEmotes(data3);
                  console.debug('= Emotes loaded');
                  done(true);
                });
              }, 1000);
            });

            setReady(true);
            console.log('====== ALERT ' + item.id + ' ======');
          }
        });
    }
  }, 1000, true, true);

  // process running alert
  useIntervalWhen(async () => {
    setTimestamp(Date.now());
    if (runningAlert) {
      // cleanup alert after 5s and if responsiveVoice is done
      if (runningAlert.hideAt - Date.now() <= 0
            && !isTTSPlaying
            && !runningAlert.waitingForTTS) {
        if (!cleanupAlert) {
          console.debug('Cleanin up', {
            isTTSPlaying, waitingForTTS: runningAlert.waitingForTTS, hideAt: runningAlert.hideAt - Date.now() <= 0,
          });
          // eval onEnded
          setTimeout(() => {
            if (runningAlert && runningAlert.alert.enableAdvancedMode) {
              triggerFunction(runningAlert.alert.advancedMode.js || '', 'onEnded', runningAlert);
            }
          });

          cleanupAlert = true;
          setTimeout(() => {
            setRunningAlert(null);
            setShouldAnimate(false);
            cleanupAlert = false;
          }, runningAlert.alert.animationOutDuration);
        }
        return;
      } else {
        cleanupAlert = false;
      }

      if (runningAlert.showAt <= Date.now() && !runningAlert.isShowing) {
        console.debug('showing image');
        runningAlert.isShowing = true;
        setShouldAnimate(true);

        setTimeout(() => {
          const video = document.getElementById('video') as null | HTMLMediaElement;
          if (video && runningAlert) {
            if (runningAlert.isSoundMuted) {
              video.volume = 0;
              console.log('Audio is muted.');
            } else {
              video.volume = runningAlert.alert.soundVolume / 100;
            }
            video.play();
          }
        }, 100);
      }

      if (runningAlert.showTextAt <= Date.now() && !runningAlert.isShowingText) {
        console.debug('showing text');
        runningAlert.isShowingText = true;

        if (runningAlert.alert.enableAdvancedMode) {
          let evaluated = false;
          const interval = setInterval(() => {
            if (evaluated) {
              clearInterval(interval);
              return;
            }
            if (runningAlert) {
              // wait for wrap to be available
              if (!document.getElementById('wrap-' + runningAlert.alert.id)) {
                console.log('Wrap element not yet ready to run onStarted, trying again.');
              } else {
                evaluated = true;
                console.log('Wrap element found, triggering onStarted.');

                triggerFunction(runningAlert.alert.advancedMode.js || '', 'onStarted', runningAlert);
              }
            }
          }, 10);
        }
      }

      const audio = document.getElementById('audio') as null | HTMLMediaElement;
      if (runningAlert.waitingForTTS && (runningAlert.alert.soundId === null || (audio && audio.ended))) {
        let message = runningAlert.message ?? '';
        if (runningAlert.alert.tts.skipUrls) {
          for (const match of message.match(urlRegex({ strict: false })) ?? []) {
            message = message.replace(match, '');
          }
        }
        if (!runningAlert.isTTSMuted && !runningAlert.isSoundMuted && alert) {
          let ttsTemplate = message;
          if (runningAlert.alert.ttsTemplate) {
            ttsTemplate = runningAlert.alert.ttsTemplate
              .replace(/\{name\}/g, runningAlert.name)
              .replace(/\{game\}/g, runningAlert.game || '')
              .replace(/\{recipient\}/g, runningAlert.recipient || '')
              .replace(/\{amount\}/g, String(runningAlert.amount))
              .replace(/\{monthsName\}/g, runningAlert.monthsName)
              .replace(/\{currency\}/g, runningAlert.currency)
              .replace(/\{message\}/g, message);
          }
          console.log({
            template: runningAlert.alert.ttsTemplate, ttsTemplate,
          });

          if (ttsTemplate.trim().length > 0) {
            if (alert?.tts === null) {
              // use default values
              console.log('TTS running with default values.');
              speak(ttsTemplate, runningAlert.TTSService === 0 ? 'UK English Female' : 'en-US-Wavenet-A', 1, 1, 1);
            } else {
              speak(ttsTemplate, alert.tts.voice, alert.tts.rate, alert.tts.pitch, alert.tts.volume);
            }
          }
        } else {
          console.log('TTS is muted.');
        }
        runningAlert.waitingForTTS = false;
      }

      if (runningAlert.showAt <= Date.now() && !runningAlert.soundPlayed) {
        if (runningAlert.alert.soundId) {
          console.debug('playing audio', runningAlert.alert.soundId);
          if (typeOfMedia.get(runningAlert.alert.soundId) !== null) {
            if (!audio) {
              console.error('Audio element not found.');
            } else {
              if (runningAlert.isSoundMuted) {
                audio.volume = 0;
                console.log('Audio is muted.');
              } else {
                audio.volume = runningAlert.alert.soundVolume / 100;
              }
              audio.play();
            }
          }
          runningAlert.soundPlayed = true;
        } else {
          console.debug('Audio not set - skipping');
          runningAlert.soundPlayed = true;
        }
      }
    }

    if (ready) {
      if (runningAlert === null && alerts.length > 0) {
        console.log({ alerts });
        const emitData = alerts.shift();
        if (emitData && alert) {
          let possibleAlerts = alert.items.filter(o => o.type === emitData.event);

          // select only correct triggered events
          if (emitData.event === 'rewardredeem') {
            possibleAlerts = (possibleAlerts as any[]).filter(o => o.rewardId === emitData.rewardId);
          }

          let omitFilters = false;
          if (emitData.event === 'custom' && emitData.alertId) {
            console.log('Alert is command redeem and triggers', emitData.alertId, 'by force');
            possibleAlerts = possibleAlerts.filter(o => o.id === emitData.alertId);
            omitFilters = true;
          }
          if (possibleAlerts.length > 0) {
            // filter variants
            if (!omitFilters) {
              possibleAlerts = possibleAlerts.filter(filterVariants(emitData));
            }

            // after we have possible alerts -> generate random
            const possibleAlertsWithRandomCount: Alert['items'] = [];
            // check if exclusive alert is there then run only it (+ other exclusive)
            if (possibleAlerts.find(o => o.variantAmount === 5)) {
              for (const pa of possibleAlerts.filter(o => o.variantAmount === 5)) {
                possibleAlertsWithRandomCount.push(pa);
              }
            } else {
              // randomize variants
              for (const pa of possibleAlerts) {
                for (let i = 0; i < pa.variantAmount; i++) {
                  possibleAlertsWithRandomCount.push(pa);
                }
              }
            }

            console.debug({
              emitData, possibleAlerts, possibleAlertsWithRandomCount,
            });

            const selectedItem: Alert['items'][number] | undefined = possibleAlertsWithRandomCount[Math.floor(Math.random() * possibleAlertsWithRandomCount.length)];
            if (!selectedItem || !selectedItem.id) {
              console.log('No alert found or all are disabled');
              return;
            }

            console.log('alert', { selectedItem });

            // advancedMode
            if (selectedItem.enableAdvancedMode) {
              // prepare HTML
              const advancedModeHTML = selectedItem.advancedMode.html || '';

              const scriptRegex = /<script.*src="(.*)"\/?>/gm;
              let scriptMatch = scriptRegex.exec(advancedModeHTML);
              while (scriptMatch !== null) {
                const scriptLink = scriptMatch[1];
                if (loadedScripts.includes(scriptLink)) {
                  scriptMatch = scriptRegex.exec(advancedModeHTML);
                  continue;
                }
                const script = document.createElement('script');
                script.src = scriptLink;
                document.getElementsByTagName('head')[0].appendChild(script);
                scriptMatch = scriptRegex.exec(advancedModeHTML);

                // wait for load
                await new Promise((resolve) => {
                  script.onload = () => {
                    console.log(`Custom script loaded: ${scriptLink}`);
                    loadedScripts.push(scriptLink);
                    resolve(true);
                  };
                });
              }
            }

            setShowImage(true);
            const isAmountForTTSInRange = selectedItem.tts.minAmountToPlay === null || selectedItem.tts.minAmountToPlay <= emitData.amount;
            selectedItem.messageTemplate = selectedItem.messageTemplate
              .replace(/\{name\}/g, '{name:highlight}')
              .replace(/\{game\}/g, '{game:highlight}')
              .replace(/\{recipient\}/g, '{recipient:highlight}')
              .replace(/\{amount\}/g, '{amount:highlight}')
              .replace(/\{monthsName\}/g, '{monthsName:highlight}')
              .replace(/\{currency\}/g, '{currency:highlight}');
            setRunningAlert({
              id:            v4(),
              soundPlayed:   false,
              isShowing:     false,
              isShowingText: false,
              showAt:        alert.alertDelayInMs + Date.now(),
              hideAt:        alert.alertDelayInMs + Date.now() + selectedItem.alertDurationInMs + selectedItem.animationInDuration,
              showTextAt:    alert.alertDelayInMs + Date.now() + selectedItem.alertTextDelayInMs,
              waitingForTTS: selectedItem.tts.enabled && isAmountForTTSInRange,
              alert:         selectedItem,
              ...emitData,
            });
          } else {
            console.log('No possible alert found.');
            setRunningAlert(null);
          }
        } else {
          setRunningAlert(null);
        }
      }
    }
  }, 100, true, true );

  const test = () => {
    console.log('test');
    console.log({ emotes });
  };

  const preparedMessage = React.useMemo(() => {
    if (alert && runningAlert && messageTemplateSplitIdx > -1) {
      console.log({
        messageTemplateSplit, messageTemplateSplitIdx,
      });
      return prepareMessageTemplate(alert, runningAlert, messageTemplateSplit[messageTemplateSplitIdx]);
    } else {
      return '';
    }
  }, [alert, runningAlert, messageTemplateSplit, messageTemplateSplitIdx]);

  return <Box sx={{
    width:         '100%',
    height:        '100%',
    textTransform: 'none !important',
    position:      'relative',
    lineHeight:    'normal !important',
  }}>
    <Helmet>
      {responsiveVoiceKey && <script src={`https://code.responsivevoice.org/responsivevoice.js?key=${responsiveVoiceKey}`}></script>}
    </Helmet>
    {alert && <>
      {runningAlert && <Box id={`wrap-${runningAlert.alert.id}`} key={runningAlert.id} sx={{
        position:  'absolute',
        top:       '50%',
        left:      '50%',
        transform: 'translate(-50%, -50%) !important',
        width:     'max-content !important',
      }}>
        {(runningAlert.alert.soundId && typeOfMedia.get(runningAlert.alert.soundId) === 'audio') && <audio id="audio">
          <source src={link(runningAlert.alert.soundId)}/>
        </audio>
        }

        {runningAlert.isShowing && <Box
          className={`animate__animated ${shouldAnimate ? `animate__${animationClass}` : ''}`}
          sx={{
            animationDuration: `${animationSpeed}ms`, ...layouts[runningAlert.alert.layout],
          }}
        >
          {showImage && <>
            {(runningAlert.alert.imageId || (runningAlert.event === 'promo' && runningAlert.user?.profileImageUrl)) && <Box sx={{ visibility: shouldAnimate ? 'visible': 'hidden' }}>
              { runningAlert.event === 'promo'
                ? runningAlert.user?.profileImageUrl && <img
                  title="Alert profile image"
                  src={runningAlert.user.profileImageUrl}
                  style={{
                    display:     'block',
                    marginLeft:  'auto',
                    marginRight: 'auto',
                    width:       150 * (runningAlert.alert.imageOptions.scale / 100),
                    height:      150 * (runningAlert.alert.imageOptions.scale / 100),
                    transform:   'translate(' + runningAlert.alert.imageOptions.translateX +'px, ' + runningAlert.alert.imageOptions.translateY +'px)',
                  }}
                />
                : typeOfMedia.get(runningAlert.alert.imageId!) === 'video'
                  ? <video id="video" loop={runningAlert.alert.imageOptions.loop}  style={{
                    display:     'block',
                    marginLeft:  'auto',
                    marginRight: 'auto',
                    width:       getSizeOfMedia(runningAlert.alert.imageId, runningAlert.alert.imageOptions.scale / 100, 'width'),
                    height:      getSizeOfMedia(runningAlert.alert.imageId, runningAlert.alert.imageOptions.scale / 100, 'height'),
                    transform:   'translate(' + runningAlert.alert.imageOptions.translateX +'px, ' + runningAlert.alert.imageOptions.translateY +'px)',
                  }}
                  >
                    <source
                      src={link(runningAlert.alert.imageId)}
                      type="video/webm"
                    />
                Your browser does not support the video tag.
                  </video>
                  : <img
                    title="Alert media image"
                    src={link(runningAlert.alert.imageId)}
                    style={{
                      display:     'block',
                      marginLeft:  'auto',
                      marginRight: 'auto',
                      width:       getSizeOfMedia(runningAlert.alert.imageId, runningAlert.alert.imageOptions.scale / 100, 'width'),
                      height:      getSizeOfMedia(runningAlert.alert.imageId, runningAlert.alert.imageOptions.scale / 100, 'height'),
                      transform:   'translate(' + runningAlert.alert.imageOptions.translateX +'px, ' + runningAlert.alert.imageOptions.translateY +'px)',
                    }}
                  />}
            </Box>}
          </>}

          {messageTemplateSplitIdx > -1 && <Box key={String(runningAlert.isShowingText)}
            className={`animate__animated animate__${animationTextClass} animate__${runningAlert.alert.animationTextOptions.speed}`}
            sx={{
              gridColumn: 1,
              gridRow:    1,
              zIndex:     9999,
              visibility: runningAlert.isShowingText ? 'visible' : 'hidden',
              textAlign:  (runningAlert.alert.font ? runningAlert.alert.font.align : alert.font.align),
            }}>
            {preparedMessage}
            {('message' in runningAlert.alert && runningAlert.alert.message && (runningAlert.alert.message.minAmountToShow || 0) <= runningAlert.amount) && <Box
              sx={{
                width:      '30rem',
                margin:     (runningAlert.alert.message.font ? runningAlert.alert.message.font.align : alert.fontMessage.align) === 'center' ? 'auto' : 'inherit',
                textAlign:  runningAlert.alert.message.font ? runningAlert.alert.message.font.align : alert.fontMessage.align,
                flex:       '1 0 0px',
                fontFamily: encodeFont(runningAlert.alert.message.font ? runningAlert.alert.message.font.family : alert.fontMessage.family),
                fontSize:   (runningAlert.alert.message.font ? runningAlert.alert.message.font.size : alert.fontMessage.size) + 'px',
                fontWeight: runningAlert.alert.message.font ? runningAlert.alert.message.font.weight : alert.fontMessage.weight,
                color:      runningAlert.alert.message.font ? runningAlert.alert.message.font.color : alert.fontMessage.color,
                textShadow: textStrokeGenerator(
                  runningAlert.alert.message.font ? runningAlert.alert.message.font.borderPx : alert.fontMessage.borderPx,
                  runningAlert.alert.message.font ? runningAlert.alert.message.font.borderColor : alert.fontMessage.borderColor,
                ),
              }}>
              {HTMLReactParser(withEmotes(runningAlert.message, emotes, runningAlert))}
            </Box>}
          </Box>}
        </Box>}
      </Box>}
    </>}

    <Grow in={selected} unmountOnExit mountOnEnter>
      <Box sx={{
        position: 'absolute', top: `-35px`, fontSize: '10px', textAlign: 'left', left: 0,
      }}>
        <Button size='small' onClick={test} variant='contained'>Test</Button>
      </Box>
    </Grow>
  </Box>;
};