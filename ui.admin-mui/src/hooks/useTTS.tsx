import { TTSService } from '@sogebot/backend/dest/database/entity/overlay';
import axios from 'axios';

import { useAppSelector } from './useAppDispatch';
import getAccessToken from '../getAccessToken';

let snd: HTMLAudioElement | undefined;
speechSynthesis.getVoices(); // force loading of voices

enum ResponsiveVoiceLoadingState {
  NOT_LOADED = 'not_loaded',
  LOADING = 'loading',
  LOADED = 'loaded',
}

const log = console[(new URLSearchParams(window.location.search)).get('debug') ? 'error' : 'log'];
let isResponsiveVoiceLoadingState = ResponsiveVoiceLoadingState.NOT_LOADED;

type ElevenLabsSpeakProps = {
  text: string,
  service: TTSService.ELEVENLABS,
  stability: number,
  clarity: number,
  volume: number,
  voice: string,
  exaggeration: number,
  key?: string,
};

export const useTTS = () => {
  const { configuration } = useAppSelector(state => state.loader);

  const loadResponsiveVoice = async (): Promise<boolean> => {
    log(new Date().toISOString(), '= initializing responsive voice with key', configuration.core.tts.responsiveVoiceKey);
    // initialize responsive voice
    if (configuration.core.tts.responsiveVoiceKey === '' || window.responsiveVoice !== undefined || isResponsiveVoiceLoadingState !== ResponsiveVoiceLoadingState.NOT_LOADED) {
      return false;
    }

    isResponsiveVoiceLoadingState = ResponsiveVoiceLoadingState.LOADING;
    return new Promise<boolean>(resolve => {
      const script = document.createElement('script');
      script.src = `https://code.responsivevoice.org/responsivevoice.js?key=${configuration.core.tts.responsiveVoiceKey}`;
      script.async = true;
      script.onload = () => {
        isResponsiveVoiceLoadingState = ResponsiveVoiceLoadingState.LOADED;
        log(new Date().toISOString(), '= responsive voice loaded!');
        try {
          window.responsiveVoice.init();
          setTimeout(() => resolve(true), 1000);
        } catch (e) {
          log(new Date().toISOString(), e);
          resolve(false);
        }
      };
      document.head.appendChild(script);
    });
  };

  const speak = async (props:
  { text: string, service: TTSService, rate: number, pitch: number, volume: number, voice: string, key?: string }
  | ElevenLabsSpeakProps) => {
    const { text, service, volume, voice } = props;

    if (window.responsiveVoice === undefined && service === TTSService.RESPONSIVEVOICE) {
      await loadResponsiveVoice();
    }

    for (const toSpeak of text.split('/ ')) {
      await new Promise<void>((resolve) => {
        if (toSpeak.trim().length === 0) {
          setTimeout(() => resolve(), 500);
        } else {
          if (service === TTSService.NONE) {
            resolve();
          } else if (service === TTSService.ELEVENLABS) {
            const { clarity, stability, exaggeration } = props as ElevenLabsSpeakProps;
            axios.post('/api/core/tts/speak', {
              key: props.key ?? '',
              service: service,
              clarity,
              stability,
              exaggeration,
              volume: volume,
              voice: voice,
              text: text,
            }, {
              headers: {
                Authorization: `Bearer ${getAccessToken()}`,
              }
            }).then(({ data }) => {
              snd = new Audio(`data:audio/mp3;base64,` + data.data);
              snd.volume = volume;
              snd.play();
              snd.onended = () => setTimeout(() => resolve(), 500);
              snd.onpause = () => setTimeout(() => resolve(), 500);
            }).catch((err) => {
              log(new Date().toISOString(), err);
            });
            return;
          } else if (service === TTSService.RESPONSIVEVOICE) {
            window.responsiveVoice.speak(toSpeak.trim(), voice, {
              rate: props.rate,
              pitch: props.pitch,
              volume: Math.min(volume, 1),
              onabort: () => resolve(),
              onend: () => setTimeout(() => resolve(), 500),
            });
            return;
          } else if (service === TTSService.GOOGLE) {
            axios.post('/api/core/tts/speak', {
              key: props.key ?? '',
              service: service,
              rate: props.rate,
              pitch: props.pitch,
              volume: volume,
              voice: voice,
              text: text,
            }, {
              headers: {
                Authorization: `Bearer ${getAccessToken()}`,
              }
            }).then(({ data }) => {
              snd = new Audio(`data:audio/mp3;base64,` + data.data);
              snd.volume = volume;
              snd.play();
              snd.onended = () => setTimeout(() => resolve(), 500);
              snd.onpause = () => setTimeout(() => resolve(), 500);
            }).catch((err) => {
              log(new Date().toISOString(), err);
            });
          } else if (service === TTSService.SPEECHSYNTHESIS) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = props.rate;
            utterance.pitch = props.pitch;
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
            setTimeout(() => {
              checkSpeaking();
            }, 500);
          } else {
            log(new Date().toISOString(), `TTS service ${service} not implemented yet`);
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

  return { speak, stop, loadResponsiveVoice };
};