import {
  Box, Button, Grow,
} from '@mui/material';
import { Alert, EmitData } from '@sogebot/backend/dest/database/entity/alert';
import { AlertsRegistry } from '@sogebot/backend/dest/database/entity/overlay';
import { UserInterface } from '@sogebot/backend/dest/database/entity/user';
import { itemsToEvalPart } from '@sogebot/ui-helpers/queryFilter';
import { shadowGenerator, textStrokeGenerator } from '@sogebot/ui-helpers/text';
import axios from 'axios';
import { get } from 'lodash';
import React from 'react';
import { Helmet } from 'react-helmet';
import { useIntervalWhen } from 'rooks';
import urlRegex from 'url-regex';
import { v4 } from 'uuid';

import type { Props } from './ChatItem';
import getAccessToken from '../../getAccessToken';
import { getSocket } from '../../helpers/socket';

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
const loadedCSS: string[] = [];
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
  const [ preparedAdvancedHTML, setPreparedAdvancedHTML ] = React.useState('');

  const animationTextClass = React.useMemo(() => {
    if (runningAlert && runningAlert.showTextAt <= Date.now()) {
      return runningAlert.hideAt - Date.now() <= 0
          && (!isTTSPlaying || !runningAlert.alert.tts.keepAlertShown)
          && !runningAlert.waitingForTTS
        ? runningAlert.alert.animationOut
        : runningAlert.alert.animationIn;
    } else {
      return 'none';
    }
  }, [ runningAlert ]);
  const animationSpeed = React.useMemo(() => {
    if (runningAlert) {
      return runningAlert.hideAt - Date.now() <= 0
          && (!isTTSPlaying || !runningAlert.alert.tts.keepAlertShown)
          && !runningAlert.waitingForTTS
        ? (runningAlert.alert.animationOut === 'none' ? 0 : runningAlert.alert.animationOutDuration)
        : (runningAlert.alert.animationIn === 'none' ? 0 : runningAlert.alert.animationInDuration);
    } else {
      return 1000;
    }
  }, [ runningAlert ]);
  const animationClass = React.useMemo(() => {
    if (runningAlert) {
      if (runningAlert.hideAt - Date.now() <= 0
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
  }, [ runningAlert ]);

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
                fetch(`${process.env.isNuxtDev ? 'http://localhost:20000' : location.origin}/assets/vulgarities/${lang}.txt`)
                  .then(response2 => response2.text())
                  .then((text) => {
                    setDefaultProfanityList(Array.from(
                      new Set([...defaultProfanityList, ...text.split(/\r?\n/), ...res.data.customProfanityList.split(',').map(o => o.trim())].filter(o => o.trim().length > 0)),
                    ));
                  })
                  .catch((e) => {
                    console.error(e);
                  });

                fetch(`${process.env.isNuxtDev ? 'http://localhost:20000' : location.origin}/assets/happyWords/${lang}.txt`)
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
        });
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
              let advancedModeHTML = selectedItem.advancedMode.html || '';

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

              // load ref="text" class
              const refTextClassMatch = /<div.*class="(.*?)".*ref="text"|<div.*ref="text".*class="(.*?)"/gm.exec(advancedModeHTML);
              let refTextClass = '';
              if (refTextClassMatch) {
                if (refTextClassMatch[1]) {
                  refTextClass = refTextClassMatch[1];
                }
                if (refTextClassMatch[2]) {
                  refTextClass = refTextClassMatch[2];
                }
                advancedModeHTML = advancedModeHTML.replace(refTextClassMatch[0], '<div ref="text"');
              }

              // load ref="image" class
              const refImageClassMatch = /<div.*class="(.*?)".*ref="image"|<div.*ref="image".*class="(.*?)"/gm.exec(advancedModeHTML);
              let refImageClass = '';
              if (refImageClassMatch) {
                if (refImageClassMatch[1]) {
                  refImageClass = refImageClassMatch[1];
                }
                if (refImageClassMatch[2]) {
                  refImageClass = refImageClassMatch[2];
                }
                advancedModeHTML = advancedModeHTML.replace(refImageClassMatch[0], '<div ref="image"');
              }

              const fontFamily = selectedItem.font ? selectedItem.font.family : alert.font.family;
              const fontSize = selectedItem.font ? selectedItem.font.size : alert.font.size;
              const fontWeight = selectedItem.font ? selectedItem.font.weight : alert.font.weight;
              const fontColor = selectedItem.font ? selectedItem.font.color : alert.font.color;
              const shadowBorderPx = selectedItem.font ? selectedItem.font.borderPx : alert.font.borderPx;
              const shadowBorderColor = selectedItem.font ? selectedItem.font.borderColor : alert.font.borderColor;
              const shadow = [textStrokeGenerator(shadowBorderPx, shadowBorderColor), shadowGenerator(selectedItem.font ? selectedItem.font.shadow : alert.font.shadow)].filter(Boolean).join(', ');

              const messageTemplate = get(selectedItem, 'messageTemplate', '')
                .replace(/\{name\}/g, '{name:highlight}')
                .replace(/\{game\}/g, '{game:highlight}')
                .replace(/\{recipient\}/g, '{recipient:highlight}')
                .replace(/\{amount\}/g, '{amount:highlight}')
                .replace(/\{monthsName\}/g, '{monthsName:highlight}')
                .replace(/\{currency\}/g, '{currency:highlight}');
              advancedModeHTML
                    = advancedModeHTML
                  .replace(/\{message\}/g, `
                        <span :style="{
                          'font-family': encodeFont(runningAlert.alert.message.font ? runningAlert.alert.message.font.family : data.fontMessage.family) + ' !important',
                          'font-size': (runningAlert.alert.message.font ? runningAlert.alert.message.font.size : data.fontMessage.size) + 'px !important',
                          'font-weight': (runningAlert.alert.message.font ? runningAlert.alert.message.font.weight : data.fontMessage.weight) + ' !important',
                          'color': (runningAlert.alert.message.font ? runningAlert.alert.message.font.color : data.fontMessage.color) + ' !important',
                          'text-shadow': [
                            textStrokeGenerator(
                              runningAlert.alert.message.font ? runningAlert.alert.message.font.borderPx : data.fontMessage.borderPx,
                              runningAlert.alert.message.font ? runningAlert.alert.message.font.borderColor : data.fontMessage.borderColor
                            ),
                            shadowGenerator(
                              runningAlert.alert.message.font ? runningAlert.alert.message.font.shadow : data.fontMessage.shadow
                            )
                          ].filter(Boolean).join(', ') + ' !important'
                        }"
                        v-html="withEmotes(runningAlert.message)"></span>`)
                  .replace(/\{messageTemplate\}/g, messageTemplate)
                  .replace(/\{game\}/g, emitData.game || '')
                  .replace(/\{name\}/g, emitData.name)
                  .replace(/\{recipient\}/g, emitData.recipient || '')
                  .replace(/\{amount\}/g, String(emitData.amount))
                  .replace(/\{monthsName\}/g, emitData.monthsName)
                  .replace(/\{currency\}/g, emitData.currency)
                  .replace(/\{game:highlight\}/g, '<span v-html="prepareMessageTemplate(\'{game:highlight}\')"/>')
                  .replace(/\{name:highlight\}/g, '<span v-html="prepareMessageTemplate(\'{name:highlight}\')"/>')
                  .replace(/\{recipient:highlight\}/g, '<span v-html="prepareMessageTemplate(\'{recipient:highlight}\')"/>')
                  .replace(/\{amount:highlight\}/g, '<span v-html="prepareMessageTemplate(\'{amount:highlight}\')"/>')
                  .replace(/\{monthsName:highlight\}/g, '<span v-html="prepareMessageTemplate(\'{monthsName:highlight}\')"/>')
                  .replace(/\{currency:highlight\}/g, '<span v-html="prepareMessageTemplate(\'{currency:highlight}\')"/>')
                  .replace('id="wrap"', `
                        id="wrap-${alert.id}"
                        :style="{
                          'animation-duration': runningAlert.animationSpeed + 'ms'
                        }"
                        class="animate__animated ${refImageClass}"
                    `)
                  .replace(/<div.*class="(.*?)".*ref="text">|<div.*ref="text".*class="(.*?)">/gm, '<div ref="text">') // we need to replace id with class with proper id
                  .replace('ref="text"', `
                        v-if="runningAlert.isShowingText"
                        class=" ${refTextClass}"
                        :style="{
                          'animation-duration': runningAlert.animationSpeed + 'ms',
                          'font-family': encodeFont('${fontFamily}'),
                          'font-size': '${fontSize} px',
                          'font-weight': '${fontWeight}',
                          'color': '${fontColor}',
                          'text-shadow': '${shadow} !important'
                        }"
                      `)
                  .replace(/<div.*class="(.*?)".*ref="image">|<div.*ref="image".*class="(.*?)">/gm, '<div ref="image">') // we need to replace id with class with proper id
                  .replace('ref="image"', `
                        v-if="runningAlert.isShowingText && showImage"
                        @error="showImage=false"
                        :src="runningAlert.event === 'promo' ? runningAlert.user?.profileImageUrl : link(runningAlert.alert.imageId)"
                      `);

              setPreparedAdvancedHTML(advancedModeHTML);

              // load CSS
              if (!loadedCSS.includes(selectedItem.id)) {
                console.debug('loaded custom CSS for ' + selectedItem.id);
                loadedCSS.push(alert.id);
                const head = document.getElementsByTagName('head')[0];
                const style = document.createElement('style');
                style.type = 'text/css';
                const css = selectedItem.advancedMode.css
                  .replace(/#wrap/g, '#wrap-' + alert.id); // replace .wrap with only this goal wrap
                style.appendChild(document.createTextNode(css));
                head.appendChild(style);
              }
            } else {
              // we need to add :highlight to name, amount, monthName, currency by default
              selectedItem.messageTemplate = selectedItem.messageTemplate
                .replace(/\{game\}/g, '{game:highlight}')
                .replace(/\{name\}/g, '{name:highlight}')
                .replace(/\{recipient\}/g, '{recipient:highlight}')
                .replace(/\{amount\}/g, '{amount:highlight}')
                .replace(/\{monthName\}/g, '{monthName:highlight}')
                .replace(/\{currency\}/g, '{currency:highlight}');
            }
            const isAmountForTTSInRange = selectedItem.tts.minAmountToPlay === null || selectedItem.tts.minAmountToPlay <= emitData.amount;

            setShowImage(true);
            setRunningAlert({
              id:            v4(),
              soundPlayed:   false,
              isShowing:     false,
              isShowingText: false,
              showAt:        alert.alertDelayInMs + Date.now(),
              hideAt:        alert.alertDelayInMs + Date.now() + selectedItem.alertDurationInMs + selectedItem.animationInDuration,
              showTextAt:    alert.alertDelayInMs + Date.now() + selectedItem.alertTextDelayInMs,
              waitingForTTS: selectedItem.tts.enabled && isAmountForTTSInRange,
              alert:         alert as any,
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
      {runningAlert && <Box>
        GOT RUNNIG ALERT
        {runningAlert.isShowing && <>
          { showImage && <Box>
            <img
              src={link(runningAlert.alert.imageId)}
              style={{
                display:     'block',
                marginLeft:  'auto',
                marginRight: 'auto',
                width:       getSizeOfMedia(runningAlert.alert.imageId, runningAlert.alert.imageOptions.scale / 100, 'width'),
                height:      getSizeOfMedia(runningAlert.alert.imageId, runningAlert.alert.imageOptions.scale / 100, 'height'),
                transform:   'translate(' + runningAlert.alert.imageOptions.translateX +'px, ' + runningAlert.alert.imageOptions.translateY +'px)',
              }}
            />
          </Box>}
        </>}
      </Box>}

      {JSON.stringify({
        showImage,isTTSPlaying, preparedAdvancedHTML, shouldAnimate, animationSpeed, animationTextClass, animationClass,
      })}
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