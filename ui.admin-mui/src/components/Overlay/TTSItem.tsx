import { TTS } from '@sogebot/backend/dest/database/entity/overlay';
import React from 'react';
import { Helmet } from 'react-helmet';

import type { Props } from './ChatItem';
import { getSocket } from '../../helpers/socket';

const ids: string[] = [];
let enabled = false;

export const TTSItem: React.FC<Props<TTS>> = ({ item }) => {
  const [responsiveVoiceKey, setResponsiveVoiceKey] = React.useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = React.useState(false);

  // initialize socket
  getSocket('/overlays/texttospeech', true);

  const isTTSPlaying = React.useMemo(() => ({
    0: () => typeof (window as any).responsiveVoice !== 'undefined' && (window as any).responsiveVoice.isPlaying(),
    1: () => isSpeaking,
  }), [ isSpeaking ]);

  const isResponsiveVoiceEnabled = () => {
    return new Promise<void>((resolve) => {
      const check = () => {
        if (typeof (window as any).responsiveVoice === 'undefined') {
          setTimeout(() => check(), 200);
        } else {
          console.debug('= ResponsiveVoice init OK');
          (window as any).responsiveVoice.init();
          enabled = true;
          resolve();
        }
      };
      check();
    });
  };

  const speak = React.useCallback((data: { text: string; highlight: boolean, key: string, service: 0 | 1 }) => {
    if (ids.includes(data.key)) {
      return;
    }
    ids.push(data.key);
    if (ids.length > 5) {
      ids.shift();
    }

    console.debug('Incoming speak', data);

    if (data.highlight && !item.triggerTTSByHighlightedMessage) {
      console.debug('This TTS is not set for higlighted messages.');
      return;
    }
    if (!enabled) {
      console.error('TTS is not properly set, skipping');
      return;
    }
    if (isTTSPlaying[data.service]()) {
    // wait and try later
      setTimeout(() => speak(data), 1000);
      return;
    }

    if (data.service === 0) {
    // RESPONSIVE VOICE
      (window as any).responsiveVoice.speak(data.text, item.voice, {
        rate: item.rate, pitch: item.pitch, volume: Math.max(item.volume, 1),
      });
    } else {
    // GOOGLE
      setIsSpeaking(true);
      getSocket('/core/tts', true).emit('speak', {
        ...item, key: data.key, text: data.text,
      }, (err, b64mp3) => {
        if (err) {
          setIsSpeaking(false);
          return console.error(err);
        }
        const snd = new Audio(`data:audio/mp3;base64,` + b64mp3);
        snd.play();
        snd.onended = () => (setIsSpeaking(false));
      });
    }
  }, [ isSpeaking, item, isTTSPlaying ]);

  React.useEffect(() => {
    console.log('====== TTS ======');
    getSocket('/overlays/texttospeech', true).on('speak', async (data) => {
      if (data.service === 0) {
        setResponsiveVoiceKey(data.key);
        await isResponsiveVoiceEnabled();
      } else {
        setResponsiveVoiceKey(null);
        enabled = true;
      }
      speak(data), 100;
    });
  }, []);

  return <>
    <Helmet>
      {responsiveVoiceKey && <script src={`https://code.responsivevoice.org/responsivevoice.js?key=${responsiveVoiceKey}`}></script>}
    </Helmet>
  </>;
};