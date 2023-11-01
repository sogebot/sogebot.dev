import { Box } from '@mui/material';
import { Alerts, AlertTTS } from '@sogebot/backend/src/database/entity/overlay';
import { useAtomValue, useSetAtom } from 'jotai';
import React from 'react';

import {
  anEmitData, anExpectedSoundCount, anFinishedSoundCount, anWaitingForTTS,
} from './AlertItem/atom';
import type { Props } from './ChatItem';
import { getSocket } from '../../helpers/socket';

let snd: HTMLAudioElement; // to be able to parry

export const AlertItemTTS: React.FC<Props<AlertTTS> & { parent: Alerts }>
= ({ item, parent }) => {
  const emitData = useAtomValue(anEmitData);
  const expectedSoundCount = useAtomValue(anExpectedSoundCount);
  const finishedSoundCount = useAtomValue(anFinishedSoundCount);
  const setTTSWaiting = useSetAtom(anWaitingForTTS);

  const speak = async () => {
    console.log('Speaking TTS');
    if (!emitData) {
      // no data
      setTTSWaiting(false);
      return;
    }
    console.log('= Replacing values');
    const text = item.ttsTemplate
      .replace(/\{name\}/g, emitData.name)
      .replace(/\{game\}/g, emitData.game || '')
      .replace(/\{recipient\}/g, emitData.recipient || '')
      .replace(/\{amount\}/g, String(emitData.amount))
      .replace(/\{monthsName\}/g, emitData.monthsName)
      .replace(/\{currency\}/g, emitData.currency)
      .replace(/\{message\}/g, emitData.message);

    if (item.speakDelay) {
      console.log('= Delaying TTS for', item.speakDelay, 'ms');
      await new Promise((resolve) => setTimeout(resolve, item.speakDelay ?? 0));
    }
    console.log('= Speaking', text);

    const voice = item.tts ? item.tts.voice : parent.tts.voice;
    const rate = item.tts ? item.tts.rate : parent.tts.rate;
    const pitch = item.tts ? item.tts.pitch : parent.tts.pitch;
    const volume = Math.min(item.tts ? item.tts.volume : parent.tts.volume, 1);

    if (emitData.TTSService === 0) {
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
      }
      console.log('= Unblocking TTS');
      setTTSWaiting(false);
    } else if (emitData?.TTSService === 1) {
      console.log('Using Google TTS as TTS Service.');
      console.log({
        volume, pitch, rate, voice, text, key: emitData.TTSKey,
      });
      getSocket('/registries/alerts', true).emit('speak', {
        volume, pitch, rate, voice, text, key: emitData.TTSKey,
      }, (err, b64mp3) => {
        if (err) {
          console.log('= Unblocking TTS');
          setTTSWaiting(false);
          return console.error(err);
        }
        snd = new Audio(`data:audio/mp3;base64,` + b64mp3);
        snd.play();
        snd.onended = () => {
          console.log('= Unblocking TTS');
          setTTSWaiting(false);
        };
      });
    } else {
      console.log('= Unblocking TTS');
      setTTSWaiting(false);
    }
  };

  React.useEffect(() => {
    if (expectedSoundCount >= 0 && expectedSoundCount === finishedSoundCount) {
      speak();
    }
  }, [ expectedSoundCount, finishedSoundCount ]);

  React.useEffect(() => {
    setTTSWaiting(true);
    return () => {
      try {
        if (snd) {
          if (!snd.paused) {
            console.log('= Forcing TTS to stop');
            snd.pause();
          }
        } else {
          if ((window as any).responsiveVoice?.isPlaying()) {
            console.log('= Forcing TTS to stop');
            (window as any).responsiveVoice?.cancel();
          }
        }
      } catch (e) {
        return console.error(e);
      }
    };
  }, []);

  return <Box sx={{
    width:         '100%',
    height:        '100%',
    position:      'relative',
    textTransform: 'none',
    lineHeight:    'initial',
    overflow:      'visible',
  }}/>;
};
