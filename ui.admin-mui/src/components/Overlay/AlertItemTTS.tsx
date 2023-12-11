import { Box } from '@mui/material';
import { Alerts, AlertTTS } from '@sogebot/backend/src/database/entity/overlay';
import { useAtomValue, useSetAtom } from 'jotai';
import React from 'react';

import { anEmitData, anExpectedSoundCount, anFinishedSoundCount, anWaitingForTTS } from './AlertItem/atom';
import type { Props } from './ChatItem';
import { useTTS } from '../../hooks/useTTS';

export const AlertItemTTS: React.FC<Props<AlertTTS> & { parent: Alerts }>
= ({ item, parent }) => {
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

    const service = item.tts?.services[item.tts?.selectedService] ?? parent.tts.services[parent.tts.selectedService];
    if (!service) {
      console.log('= Unblocking TTS');
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
      key: emitData.TTSKey,
      service: item.tts?.selectedService ?? parent.tts.selectedService,
    });

    console.log('= Unblocking TTS');
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
