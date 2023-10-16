import { Box } from '@mui/material';
import { EmitData } from '@sogebot/backend/dest/database/entity/alert';
import { Alerts } from '@sogebot/backend/dest/database/entity/overlay';
import { flatten } from '@sogebot/backend/dest/helpers/flatten';
import { itemsToEvalPart } from '@sogebot/ui-helpers/queryFilter';
import React from 'react';
import { useIntervalWhen, useSessionstorageState } from 'rooks';

import { AlertItemText } from './AlertItemText';
import type { Props } from './ChatItem';
import { getSocket } from '../../helpers/socket';

const loadedFonts: string[] = [];

const filterVariants = (emitData: EmitData) => (o: Alerts['items'][number] | Omit<Alerts['items'][number], 'variants' | 'hooks'>) => {
  if (o.enabled === false) {
    return false;
  }
  const filter = o.filter ? o.filter : null;
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
  getSocket('/core/emotes', true); // init socket

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

  // const [ runningAlert, setRunningAlert ] = React.useState<RunningAlert | null>(null);

  // const processIncomingAlert = React.useCallback(async (data2: EmitData & {
  //   id: string;
  //   isTTSMuted: boolean;
  //   isSoundMuted: boolean;
  //   TTSService: number;
  //   TTSKey: string;
  //   caster: UserInterface | null;
  //   user: UserInterface | null;
  //   recipientUser: UserInterface | null;
  // }, _alert: Alert) => {
  //   if (isAlreadyProcessed(alert!.id + data2.id)) {
  //     return;
  //   }
  //   console.debug('Incoming alert', {
  //     data2, alert,
  //   });

  //   if (data2.TTSService === 0) {
  //     setResponsiveVoiceKey(data2.TTSKey);
  //     await isResponsiveVoiceEnabled();
  //   }

  //   // checking for vulgarities
  //   if (data2.message && data2.message.length > 0) {
  //     for (const vulgar of defaultProfanityList) {
  //       if (_alert) {
  //         if (_alert.profanityFilterType === 'replace-with-asterisk') {
  //           data2.message = data2.message.replace(new RegExp(vulgar, 'gmi'), '***');
  //         } else if (_alert.profanityFilterType === 'replace-with-happy-words') {
  //           data2.message = data2.message.replace(new RegExp(vulgar, 'gmi'), listHappyWords[Math.floor(Math.random() * listHappyWords.length)]);
  //         } else if (_alert.profanityFilterType === 'hide-messages') {
  //           if (data2.message.search(new RegExp(vulgar, 'gmi')) >= 0) {
  //             console.debug('Message contain vulgarity "' + vulgar + '" and is hidden.');
  //             data2.message = '';
  //           }
  //         } else if (_alert.profanityFilterType === 'disable-alerts') {
  //           if (data2.message.search(new RegExp(vulgar, 'gmi')) >= 0) {
  //             console.debug('Message contain vulgarity "' + vulgar + '" and is alert disabled.');
  //             return;
  //           }
  //         }
  //       }
  //     }
  //   }

  //   if (data2.event === 'promo' && data2.user && data2.user.profileImageUrl) {
  //     getMeta(data2.user.profileImageUrl, 'Thumbnail');
  //   }

  //   if (_alert) {
  //     if (['tips', 'cheers', 'resubs', 'subs'].includes(data2.event) && runningAlert && _alert.parry.enabled && haveAvailableAlert(data2, alert)) {
  //       alerts[_alert.id] ??= [];
  //       alerts[_alert.id].push(data2);
  //       console.log('Skipping playing alert - parrying enabled');
  //       setTimeout(() => {
  //         blocked = false;
  //         setRunningAlert(null);
  //         if (typeof (window as any).responsiveVoice !== 'undefined') {
  //           (window as any).responsiveVoice.cancel();
  //         }
  //         if (snd) {
  //           snd.pause();
  //           isTTSPlaying = false;
  //         }
  //       }, _alert.parry.delay);
  //     } else {
  //       alerts[_alert.id] ??= [];
  //       alerts[_alert.id].push(data2);
  //     }
  //   }
  // }, [ alert ]);

  // React.useEffect(() => {
  //   if (alert && ready) {
  //     console.log('= Listening to alert events');
  //     getSocket('/registries/alerts', true).on('alert', (data2) => processIncomingAlert(data2, alert));
  //     getSocket('/registries/alerts', true).on('skip', () => {
  //       setRunningAlert(null);
  //       if (typeof (window as any).responsiveVoice !== 'undefined') {
  //         (window as any).responsiveVoice.cancel();
  //       }
  //     });
  //   }
  // }, [ready, alert]);

  // process running alert
  // useIntervalWhen(async () => {
  //   setTimestamp(Date.now());
  //   if (runningAlert) {
  //     // cleanup alert after 5s and if responsiveVoice is done
  //     if (runningAlert.hideAt - Date.now() <= 0
  //           && !isTTSPlaying
  //           && !runningAlert.waitingForTTS) {
  //       if (!cleanupAlert) {
  //         console.debug('Cleanin up', {
  //           isTTSPlaying, waitingForTTS: runningAlert.waitingForTTS, hideAt: runningAlert.hideAt - Date.now() <= 0,
  //         });
  //         // eval onEnded
  //         setTimeout(() => {
  //           if (runningAlert && runningAlert.alert.enableAdvancedMode) {
  //             triggerFunction(runningAlert.alert.advancedMode.js || '', 'onEnded', runningAlert);
  //           }
  //         });

  //         cleanupAlert = true;
  //         setTimeout(() => {
  //           blocked = false;
  //           setRunningAlert(null);
  //           setShouldAnimate(false);
  //           cleanupAlert = false;
  //         }, runningAlert.alert.animationOutDuration);
  //       }
  //       return;
  //     } else {
  //       cleanupAlert = false;
  //     }

  //     if (runningAlert.showAt <= Date.now() && !runningAlert.isShowing) {
  //       console.debug('showing image');
  //       runningAlert.isShowing = true;
  //       setShouldAnimate(true);

  //       setTimeout(() => {
  //         const video = document.getElementById('video') as null | HTMLMediaElement;
  //         if (video && runningAlert) {
  //           if (runningAlert.isSoundMuted) {
  //             video.volume = 0;
  //             console.log('Audio is muted.');
  //           } else {
  //             video.volume = runningAlert.alert.soundVolume / 100;
  //           }
  //           video.play();
  //         }
  //       }, 100);
  //     }

  //     if (runningAlert.showTextAt <= Date.now() && !runningAlert.isShowingText) {
  //       console.debug('showing text');
  //       runningAlert.isShowingText = true;

  //       if (runningAlert.alert.enableAdvancedMode) {
  //         let evaluated = false;
  //         const interval = setInterval(() => {
  //           if (evaluated) {
  //             clearInterval(interval);
  //             return;
  //           }
  //           if (runningAlert) {
  //             // wait for wrap to be available
  //             if (!document.getElementById('wrap-' + runningAlert.alert.id)) {
  //               console.log('Wrap element not yet ready to run onStarted, trying again.');
  //             } else {
  //               evaluated = true;
  //               console.log('Wrap element found, triggering onStarted.');

  //               triggerFunction(runningAlert.alert.advancedMode.js || '', 'onStarted', runningAlert);
  //             }
  //           }
  //         }, 10);
  //       }
  //     }

  //     const audio = document.getElementById('audio') as null | HTMLMediaElement;
  //     if (runningAlert.waitingForTTS && (runningAlert.alert.soundId === null || (audio && audio.ended))) {
  //       let message = runningAlert.message ?? '';
  //       if (runningAlert.alert.tts.skipUrls) {
  //         for (const match of message.match(urlRegex({ strict: false })) ?? []) {
  //           message = message.replace(match, '');
  //         }
  //       }
  //       if (!runningAlert.isTTSMuted && !runningAlert.isSoundMuted && alert) {
  //         let ttsTemplate = message;
  //         if (runningAlert.alert.ttsTemplate) {
  //           ttsTemplate = runningAlert.alert.ttsTemplate
  //             .replace(/\{name\}/g, runningAlert.name)
  //             .replace(/\{game\}/g, runningAlert.game || '')
  //             .replace(/\{recipient\}/g, runningAlert.recipient || '')
  //             .replace(/\{amount\}/g, String(runningAlert.amount))
  //             .replace(/\{monthsName\}/g, runningAlert.monthsName)
  //             .replace(/\{currency\}/g, runningAlert.currency)
  //             .replace(/\{message\}/g, message);
  //         }

  //         if (ttsTemplate.trim().length > 0) {
  //           if (alert?.tts === null) {
  //             // use default values
  //             console.log('TTS running with default values.');
  //             speak(ttsTemplate, runningAlert.TTSService === 0 ? 'UK English Female' : 'en-US-Wavenet-A', 1, 1, 1);
  //           } else {
  //             speak(ttsTemplate, alert.tts.voice, alert.tts.rate, alert.tts.pitch, alert.tts.volume);
  //           }
  //         }
  //       } else {
  //         console.log('TTS is muted.');
  //       }
  //       runningAlert.waitingForTTS = false;
  //     }

  //     if (runningAlert.showAt <= Date.now() && !runningAlert.soundPlayed) {
  //       if (runningAlert.alert.soundId) {
  //         console.debug('playing audio', runningAlert.alert.soundId);
  //         if (typeOfMedia.get(runningAlert.alert.soundId) !== null) {
  //           if (!audio) {
  //             console.error('Audio element not found.');
  //           } else {
  //             if (runningAlert.isSoundMuted) {
  //               audio.volume = 0;
  //               console.log('Audio is muted.');
  //             } else {
  //               audio.volume = runningAlert.alert.soundVolume / 100;
  //             }
  //             audio.play();
  //           }
  //         }
  //         runningAlert.soundPlayed = true;
  //       } else {
  //         console.debug('Audio not set - skipping');
  //         runningAlert.soundPlayed = true;
  //       }
  //     }
  //   }

  //   if (ready && !blocked && alert) {
  //     if (runningAlert === null && (alerts[alert.id] ?? []).length > 0) {
  //       const emitData = alerts[alert.id].shift();
  //       if (emitData && alert) {
  //         let possibleAlerts = alert.items.filter(o => o.type === emitData.event);

  //         // select only correct triggered events
  //         if (emitData.event === 'rewardredeem') {
  //           possibleAlerts = (possibleAlerts as any[]).filter(o => o.rewardId === emitData.rewardId);
  //         }

  //         let omitFilters = false;
  //         if (emitData.event === 'custom' && emitData.alertId) {
  //           possibleAlerts = possibleAlerts.filter(o => o.id === emitData.alertId);
  //           omitFilters = true;

  //           if (emitData.customOptions) {
  //             console.log('Alert is command redeem and triggers', emitData.alertId, 'by force with custom options', emitData.customOptions);
  //             // we are forcing new values into possible alerts
  //             possibleAlerts = possibleAlerts.map(obj => ({
  //               ...obj,
  //               layout:             (emitData.customOptions?.layout ? String(emitData.customOptions?.layout) : obj.layout) as (typeof possibleAlerts)[number]['layout'],
  //               soundVolume:        (emitData.customOptions?.volume ? emitData.customOptions?.volume : obj.soundVolume),
  //               alertDurationInMs:  (emitData.customOptions?.alertDuration ? emitData.customOptions?.alertDuration : obj.alertDurationInMs),
  //               alertTextDelayInMs: (emitData.customOptions?.textDelay ? emitData.customOptions?.textDelay : obj.alertTextDelayInMs),
  //               messageTemplate:    (emitData.customOptions?.messageTemplate ? emitData.customOptions?.messageTemplate : obj.messageTemplate),
  //               imageId:            (emitData.customOptions?.mediaId ? emitData.customOptions?.mediaId : obj.imageId),
  //               soundId:            (emitData.customOptions?.audioId ? emitData.customOptions?.audioId : obj.soundId),
  //             }));

  //             if (emitData.customOptions?.audioId) {
  //               await fetchSound(emitData.customOptions?.audioId);
  //             }

  //             if (emitData.customOptions?.mediaId) {
  //               await fetchImage(emitData.customOptions?.mediaId);
  //             }
  //           } else {
  //             console.log('Alert is command redeem and triggers', emitData.alertId, 'by force');
  //           }
  //         } else if (emitData.event === 'custom' && !emitData.alertId) {
  //           blocked = false;
  //           return console.error('Missing alertId for custom, skipping');
  //         }
  //         if (possibleAlerts.length > 0) {
  //           // filter variants
  //           if (!omitFilters) {
  //             possibleAlerts = possibleAlerts.filter(filterVariants(emitData));
  //           }

  //           // after we have possible alerts -> generate random
  //           const possibleAlertsWithRandomCount: Alert['items'] = [];
  //           // check if exclusive alert is there then run only it (+ other exclusive)
  //           if (possibleAlerts.find(o => o.variantAmount === 5)) {
  //             for (const pa of possibleAlerts.filter(o => o.variantAmount === 5)) {
  //               possibleAlertsWithRandomCount.push(pa);
  //             }
  //           } else {
  //             // randomize variants
  //             for (const pa of possibleAlerts) {
  //               for (let i = 0; i < pa.variantAmount; i++) {
  //                 possibleAlertsWithRandomCount.push(pa);
  //               }
  //             }
  //           }

  //           console.debug({
  //             emitData, possibleAlerts, possibleAlertsWithRandomCount,
  //           });

  //           const selectedItem: Alert['items'][number] | undefined = possibleAlertsWithRandomCount[Math.floor(Math.random() * possibleAlertsWithRandomCount.length)];
  //           if (!selectedItem || !selectedItem.id) {
  //             console.log('No alert found or all are disabled');
  //             return;
  //           }

  //           // advancedMode
  //           if (selectedItem.enableAdvancedMode) {
  //             // prepare HTML
  //             const advancedModeHTML = selectedItem.advancedMode.html || '';

  //             const scriptRegex = /<script.*src="(.*)"\/?>/gm;
  //             let scriptMatch = scriptRegex.exec(advancedModeHTML);
  //             while (scriptMatch !== null) {
  //               const scriptLink = scriptMatch[1];
  //               if (loadedScripts.includes(scriptLink)) {
  //                 scriptMatch = scriptRegex.exec(advancedModeHTML);
  //                 continue;
  //               }
  //               const script = document.createElement('script');
  //               script.src = scriptLink;
  //               document.getElementsByTagName('head')[0].appendChild(script);
  //               scriptMatch = scriptRegex.exec(advancedModeHTML);

  //               // wait for load
  //               await new Promise((resolve) => {
  //                 script.onload = () => {
  //                   console.log(`Custom script loaded: ${scriptLink}`);
  //                   loadedScripts.push(scriptLink);
  //                   resolve(true);
  //                 };
  //               });
  //             }
  //           }

  //           setShowImage(true);
  //           const isAmountForTTSInRange = !('minAmountToPlay' in selectedItem.tts) || (selectedItem.tts.minAmountToPlay ?? 0) <= emitData.amount;
  //           selectedItem.messageTemplate = selectedItem.messageTemplate
  //             .replace(/\{name\}/g, '{name:highlight}')
  //             .replace(/\{game\}/g, '{game:highlight}')
  //             .replace(/\{recipient\}/g, '{recipient:highlight}')
  //             .replace(/\{amount\}/g, '{amount:highlight}')
  //             .replace(/\{monthsName\}/g, '{monthsName:highlight}')
  //             .replace(/\{currency\}/g, '{currency:highlight}');
  //           blocked = true;
  //           setRunningAlert({
  //             id:            v4(),
  //             soundPlayed:   false,
  //             isShowing:     false,
  //             isShowingText: false,
  //             showAt:        alert.alertDelayInMs + Date.now(),
  //             hideAt:        alert.alertDelayInMs + Date.now() + selectedItem.alertDurationInMs + selectedItem.animationInDuration,
  //             showTextAt:    alert.alertDelayInMs + Date.now() + selectedItem.alertTextDelayInMs,
  //             waitingForTTS: selectedItem.tts.enabled && isAmountForTTSInRange,
  //             alert:         selectedItem,
  //             ...emitData,
  //           });
  //         } else {
  //           console.log('No possible alert found.');
  //           blocked = false;
  //           setRunningAlert(null);
  //         }
  //       } else {
  //         blocked = false;
  //         setRunningAlert(null);
  //       }
  //     }
  //   }
  // }, 100, true, true );

  // const preparedMessage = React.useMemo(() => {
  //   if (alert && runningAlert && messageTemplateSplitIdx > -1) {
  //     return prepareMessageTemplate(alert, runningAlert, messageTemplateSplit[messageTemplateSplitIdx]);
  //   } else {
  //     return '';
  //   }
  // }, [alert, runningAlert, messageTemplateSplit, messageTemplateSplitIdx]);

  const [ emitData, setEmitData] = React.useState<null | EmitData>({
    amount:     10,
    currency:   'CZK',
    event:      'follow',
    message:    'Lorem ipsumn dolor sit amet, consectetur adipiscing elit.',
    monthsName: 'months',
    name:       'soge',
    tier:       'Prime',
  });

  const selectedGroup = React.useMemo(() => {
    if(!emitData) {
      return;
    }
    let possibleAlerts: (Alerts['items'][number] | Omit<Alerts['items'][number], 'variants' | 'hooks'>)[] = item.items.filter(o => o.hooks.includes(emitData.event as any));
    if (emitData.event === 'rewardredeem') {
      possibleAlerts = (possibleAlerts as any).filter((o: any) => o.rewardId === emitData.rewardId);
    }

    if (possibleAlerts.length === 0) {
      console.log('alert', 'No valid alerts found for hook:', emitData.event);
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

    possibleAlerts = possibleAlerts.filter(filterVariants(emitData));
    if (possibleAlerts.length === 0) {
      console.log('alert', 'No valid alerts found after filter');
      setEmitData(null);
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
    return possibleAlertsWithRandomCount[Math.floor(Math.random() * possibleAlertsWithRandomCount.length)];
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

  const [ activeUntil, setActiveUntil ] = React.useState(0);
  React.useEffect(() => {
    setActiveUntil(Date.now() + (selectedGroup?.alertDuration ?? 0));
  }, [ selectedGroup ]);
  const [ timestamp, setTimestamp ] = React.useState(Date.now());
  useIntervalWhen(() => {
    setTimestamp(Date.now());

    if (activeUntil - timestamp < -1000 && emitData) {
      console.log('= Freeing up alert 1 second after finished');
      setEmitData(null); // free up alert
    }
  }, 100);

  return <Box sx={{
    width:         '100%',
    height:        '100%',
    textTransform: 'none !important',
    position:      'relative',
    lineHeight:    'normal !important',
    color:         'black',
  }}>
    {selectedGroup?.items.map((it) => <Box key={it.id} sx={{
      position:  'absolute' ,
      width:     `${it.width}px`,
      height:    `${it.height}px`,
      left:      `${it.alignX}px`,
      top:       `${it.alignY}px`,
      transform: `rotate(${ it.rotation ?? 0 }deg)`,
      opacity:   activeUntil - timestamp >= 0 ? 1 : 0,
    }}>
      {/* {it.type === 'tts' && <AlertSettingsTTS model={props.item} onChange={onUpdate} onDelete={props.onDelete ?? function() {}}/>} */}
      {(selectedGroupMain && it.type === 'text') && <AlertItemText parent={item} height={it.height} width={it.width} id={it.id} item={it} groupId={''} variant={selectedGroupMain!} active={activeUntil - timestamp >= 0}/>}
      {/* {it.type === 'custom' && <AlertSettingsCustom model={props.item} onChange={onUpdate} onDelete={props.onDelete ?? function() {}}/>}
      {it.type === 'gallery' && <AlertSettingsGallery model={props.item} onChange={onUpdate} onDelete={props.onDelete ?? function() {}}/>}
      {it.type === 'audio' && <AlertSettingsAudio model={props.item} onChange={onUpdate} onDelete={props.onDelete ?? function() {}}/>} */}
    </Box>)}
  </Box>;
};