import { Box } from '@mui/material';
import { generateUsername } from '@sogebot/backend/dest/helpers/generateUsername';
import { Alerts, AlertTTS } from '@sogebot/backend/src/database/entity/overlay';
import { useAtomValue, useSetAtom } from 'jotai';
import React from 'react';

import { anEmitData, anExpectedSoundCount, anFinishedSoundCount, anWaitingForTTS } from './AlertItem/atom';
import type { Props } from './ChatItem';
import { useTTS } from '../../hooks/useTTS';

export const AlertItemTTS: React.FC<Props<AlertTTS> & { test?: boolean; parent: Alerts }>
= ({ item, parent, groupId, active, test }) => {
  const emitData = useAtomValue(anEmitData);
  const expectedSoundCount = useAtomValue(anExpectedSoundCount);
  const finishedSoundCount = useAtomValue(anFinishedSoundCount);
  const setTTSWaiting = useSetAtom(anWaitingForTTS);
  const { speak: ttsSpeak, stop } = useTTS();

  const speak = async () => {
    console.log('Speaking TTS');
    if (!emitData) {
      // no data
      setTTSWaiting(false);
      return;
    }

    let text = item.ttsTemplate;
    if (active) {
      console.log(`alert-${groupId}-AlertItemTTS`, '= Replacing values');
      if (test) {
        text = item.ttsTemplate
          .replace(/\{name\}/g, generateUsername())
          .replace(/\{game\}/g, generateUsername())
          .replace(/\{recipient\}/g, generateUsername())
          .replace(/\{amount\}/g, '100')
          .replace(/\{monthsName\}/g, 'months')
          .replace(/\{currency\}/g, 'USD')
          .replace(/\{message\}/g, 'Lorem Ipsum Dolor Sit Amet');
      } else {
        const data = emitData[groupId];
        text = item.ttsTemplate
          .replace(/\{name\}/g, data?.name || '')
          .replace(/\{game\}/g, data?.game || '')
          .replace(/\{recipient\}/g, data?.recipient || '')
          .replace(/\{amount\}/g, String(data?.amount))
          .replace(/\{monthsName\}/g, String(data?.monthsName))
          .replace(/\{currency\}/g, String(data?.currency))
          .replace(/\{message\}/g, String(data?.message));
      }
    }

    if (item.speakDelay) {
      console.log(`alert-${groupId}-AlertItemTTS`, '= Delaying TTS for', item.speakDelay, 'ms');
      await new Promise((resolve) => setTimeout(resolve, item.speakDelay ?? 0));
    }

    const service = item.tts?.services[item.tts?.selectedService] ?? parent.tts.services[parent.tts.selectedService];
    if (!service) {
      console.log(`alert-${groupId}-AlertItemTTS`, '= Unblocking TTS');
      setTTSWaiting(false);
      return;
    }

    const volume = Math.min(service.volume, 1);
    console.log('= Speaking', text);
    await ttsSpeak({
      text,
      voice: service.voice,
      rate: service.rate,
      pitch: service.pitch,
      volume,
      key: emitData[groupId]?.TTSKey,
      service: item.tts?.selectedService ?? parent.tts.selectedService,
    });

    console.log(`alert-${groupId}-AlertItemTTS`, '= Unblocking TTS');
    setTTSWaiting(false);
  };

  React.useEffect(() => {
    if (expectedSoundCount >= 0 && expectedSoundCount === finishedSoundCount) {
      speak();
    }
  }, [ expectedSoundCount, finishedSoundCount ]);

  React.useEffect(() => {
    setTTSWaiting(true);
    return () => {
      console.log('= Forcing TTS to stop');
      setTTSWaiting(false);
      stop();
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
