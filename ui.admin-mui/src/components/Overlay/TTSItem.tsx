import { TTS, TTSService } from '@sogebot/backend/dest/database/entity/overlay';
import React from 'react';

import { isAlreadyProcessed } from './_processedSocketCalls';
import type { Props } from './ChatItem';
import { getSocket } from '../../helpers/socket';
import { useTTS } from '../../hooks/useTTS';

export const TTSItem: React.FC<Props<TTS>> = ({ item }) => {
  const { speak } = useTTS();

  React.useEffect(() => {
    console.log('====== TTS ======');
    getSocket('/overlays/texttospeech', true).on('speak', async (data) => {
      if (isAlreadyProcessed(data.key)) {
        return;
      }
      if (item.selectedService === TTSService.ELEVENLABS) {
        const service = item.services[item.selectedService]!;
        speak({
          text: data.text,
          service: item.selectedService,
          stability: service.stability,
          clarity: service.clarity,
          volume: service.volume,
          voice: service.voice,
          exaggeration: service.exaggeration,
          key: data.key
        });
        return;
      } else {
        const service = item.services[item.selectedService]!;
        speak({
          text: data.text,
          service: item.selectedService,
          rate: service.rate,
          pitch: service.pitch,
          volume: service.volume,
          voice: service.voice,
          key: data.key
        });
      }
    });
  }, []);

  return <></>;
};