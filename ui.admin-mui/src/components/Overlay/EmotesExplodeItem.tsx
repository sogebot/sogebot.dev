import { Box } from '@mui/material';
import { EmotesExplode } from '@sogebot/backend/dest/database/entity/overlay';
import gsap from 'gsap';
import {
  cloneDeep, random, sample,
} from 'lodash';
import React from 'react';
import { useIntervalWhen } from 'rooks';
import shortid from 'shortid';
import { v4 } from 'uuid';

import type { Props } from './ChatItem';
import { getSocket } from '../../helpers/socket';

let model: EmotesExplode;
const ids: string[] = [];

export const EmotesExplodeItem: React.FC<Props<EmotesExplode>> = ({ item  }) => {
  const [ containerId ] = React.useState(`emotes-explode-` + shortid());
  const [ emotes, setEmotes ] = React.useState<any[]>([]);

  // initialize sockets
  getSocket('/services/twitch', true);
  getSocket('/core/emotes', true);

  React.useEffect(() => {
    model = item; // workaround for explode not picking up changes on active
  }, [ item ]);

  const explode = React.useCallback((opts: any) => {
    opts.id ??= v4();
    if (ids.includes(opts.id)) {
      return;
    }
    ids.push(opts.id);
    if (ids.length > 5) {
      ids.shift();
    }

    const container = document.getElementById(containerId);
    for (let j = 0; j < model.numOfEmotes; j++) {
      setEmotes(e => [...e, {
        id:        Math.random().toString(36).substr(2, 9) + '-' + Math.random().toString(36).substr(2, 9),
        trigger:   Date.now() + random(3000),
        show:      false,
        animation: {
          type:     'explosion',
          time:     model.animationTime,
          running:  false,
          finished: false,
        },
        position: {
          top:  random(10, container!.offsetHeight - 10),
          left: random(10, container!.offsetWidth - 10),
        },
        url: sample(opts.emotes)[model.emotesSize],
      }]);
    }
  }, []);

  const cleanEmotes = () => {
    setEmotes(e => [...e.filter(o => !o.animation.finished)]);
  };

  const triggerAnimation = React.useCallback(() => {
    setEmotes((e) => {
      const _emotes = cloneDeep(e);
      for (let i = 0, length = _emotes.length; i < length; i++) {
        if (!_emotes[i].animation.running && Date.now() - _emotes[i].trigger > 0) {
          // show and after next tick hide -> trigger animation
          _emotes[i].show = true;
          _emotes[i].animation.running = true;

          // trigger gsap
          const animation = {
            top:     random(_emotes[i].position.top - 100, _emotes[i].position.top + 100),
            left:    random(_emotes[i].position.left - 100, _emotes[i].position.left + 100),
            opacity: 0,
          };

          const trigger = () => {
            const el = document.getElementById(`emote-${_emotes[i].id}`);
            if (!el) {
              setTimeout(() => trigger(), 10);
              return;
            }
            gsap.to(document.getElementById(`emote-${_emotes[i].id}`), {
              duration:   _emotes[i].animation.time / 1000,
              ...animation,
              onComplete: () => {
                setEmotes((_e) => {
                  const _emotes2 = cloneDeep(_e);
                  const idx = _emotes2.findIndex(o => o.id === _emotes[i].id);
                  if (idx > -1) {
                    _emotes2[idx].animation.finished = true;
                  }
                  return _emotes2;
                });
              },
            });
          };
          trigger();
        }
      }
      return _emotes;
    });
  }, [ emotes ]);

  useIntervalWhen(() => {
    triggerAnimation();
    cleanEmotes();
  }, 100, true, true);

  React.useEffect(() => {
    console.log(`====== EMOTES EXPLODE ${containerId} ======`);
    listener();
  }, []);

  const listener = React.useCallback(() => {
    getSocket('/services/twitch', true).on('emote.explode', (opts: any) => explode(opts));
  }, []);

  return <Box
    id={containerId}
    sx={{
      width:  '100%',
      height: '100%',
    }}>
    <Box
      sx={{
        width:    '100%',
        height:   '100%',
        position: 'relative',
        overflow: 'hidden',
      }}>
      { emotes
        .filter(emote => emote.show)
        .map(emote => <img
          id={`emote-${emote.id}`}
          alt=''
          key={emote.id}
          src={emote.url}
          style={{
            position: 'absolute',
            left:     `${emote.position.left}px`,
            top:      `${emote.position.top}px`,
          }}
        />)}
    </Box>
  </Box>;
};