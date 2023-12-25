import { TTSService } from '@sogebot/backend/dest/database/entity/overlay';
import React from 'react';

import { useAppSelector } from './useAppDispatch';
import { getSocket } from '../helpers/socket';

let snd: HTMLAudioElement | undefined;

enum ResponsiveVoiceLoadingState {
  NOT_LOADED = 'not_loaded',
  LOADING = 'loading',
  LOADED = 'loaded',
}

let isResponsiveVoiceLoadingState = ResponsiveVoiceLoadingState.NOT_LOADED;

export const useTTS = () => {
  const [ id ] = React.useState(() => Math.random().toString(36).substr(2, 9));
  const { configuration } = useAppSelector(state => state.loader);

  React.useEffect(() => {
    // initialize responsive voice
    if (configuration.core.tts.responsiveVoiceKey === '' || window.responsiveVoice !== undefined || isResponsiveVoiceLoadingState !== ResponsiveVoiceLoadingState.NOT_LOADED) {
      return;
    }

    isResponsiveVoiceLoadingState = ResponsiveVoiceLoadingState.LOADING;
    const script = document.createElement('script');
    script.src = `https://code.responsivevoice.org/responsivevoice.js?key=${configuration.core.tts.responsiveVoiceKey}`;
    script.async = true;
    script.onload = () => {
      isResponsiveVoiceLoadingState = ResponsiveVoiceLoadingState.LOADED;
      console.log('Responsive voice loaded!');
    };
    document.head.appendChild(script);
    return () => {
      isResponsiveVoiceLoadingState = ResponsiveVoiceLoadingState.NOT_LOADED;
      document.head.removeChild(script);
    };
  }, [ configuration, id ]);

  const speak = async (props: { text: string, service: TTSService, rate: number, pitch: number, volume: number, voice: string, key?: string }) => {
    const { text, service, rate, pitch, volume, voice, key } = props;

    for (const toSpeak of text.split('/ ')) {
      await new Promise<void>((resolve) => {
        if (toSpeak.trim().length === 0) {
          setTimeout(() => resolve(), 500);
        } else {
          if (service === TTSService.NONE) {
            resolve();
          } else if (service === TTSService.RESPONSIVEVOICE) {
            window.responsiveVoice.speak(toSpeak.trim(), voice, {
              rate: rate,
              pitch: pitch,
              volume: Math.min(volume, 1),
              onabort: () => resolve(),
              onend: () => setTimeout(() => resolve(), 500),
            });
            return;
          } else if (service === TTSService.GOOGLE) {
            getSocket('/core/tts').emit('speak', {
              key: key ?? '',
              service: service,
              rate: rate,
              pitch: pitch,
              volume: volume,
              voice: voice,
              text: text,
            }, (err, b64mp3) => {
              if (err) {
                console.error(err);
                return;
              }
              snd = new Audio(`data:audio/mp3;base64,` + b64mp3);
              snd.volume = volume;
              snd.play();
              snd.onended = () => setTimeout(() => resolve(), 500);
              snd.onpause = () => setTimeout(() => resolve(), 500);
            });
          } else if (service === TTSService.SPEECHSYNTHESIS) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = rate;
            utterance.pitch = pitch;
            utterance.volume = volume;
            utterance.voice = speechSynthesis.getVoices().find(o => o.name === voice)!;
            speechSynthesis.speak(utterance);

            const checkSpeaking = () => {
              if (speechSynthesis.speaking) {
                setTimeout(() => checkSpeaking(), 500);
              } else {
                resolve();
              }
            };
            checkSpeaking();
          } else {
            console.error(`TTS service ${service} not implemented yet`);
            resolve();
          }
        }
      });
    }

  };

  const stop = () => {
    window.responsiveVoice?.cancel();
    speechSynthesis.cancel();
    snd?.pause();
  };

  return { speak, stop };
};