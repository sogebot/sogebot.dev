import {
  Box, Button, Grow,
} from '@mui/material';
import { Emotes } from '@sogebot/backend/dest/database/entity/overlay';
import gsap from 'gsap';
import { cloneDeep, random } from 'lodash';
import React from 'react';
import { useIntervalWhen } from 'rooks';
import shortid from 'shortid';

import type { Props } from './ChatItem';
import { getSocket } from '../../helpers/socket';

let model: Emotes;
const maxEmoteGuard = new Map<string, number>();

export const EmotesItem: React.FC<Props<Emotes>> = ({ item, selected }) => {
  const [ containerId ] = React.useState(`emotes-` + shortid());
  const [ emotes, setEmotes ] = React.useState<any[]>([]);

  const getContainerDimensions = () => {
    const container = document.getElementById(containerId);
    if (container) {
      return {
        height: container.offsetHeight, width: container.offsetWidth,
      };
    } else {
      return null;
    }
  };

  // initialize sockets
  getSocket('/services/twitch', true);
  getSocket('/core/emotes');

  React.useEffect(() => {
    model = item; // workaround for not picking up changes on active
  }, [ item ]);

  const setLeft = (type: string) => {
    const dimensions = getContainerDimensions();
    if (!dimensions) {
      return 0;
    }
    if (type === 'fadeup' || type === 'fadezoom' || type === 'fall') {
      return 25 + random(dimensions.width - 50); // add some offset to show whole emote
    } else if (type === 'facebook') {
      return random(dimensions.width / 4) + (dimensions.width / 2);
    } else {
      return dimensions.width / 2;
    }
  };

  const setTop = (type: string) => {
    const dimensions = getContainerDimensions();
    if (!dimensions) {
      return 0;
    }
    if (type === 'fadeup') {
      return 150 + random(dimensions.height - 175);
    } else if (type === 'fadezoom') {
      return 25 + random(dimensions.height - 50);
    } else if (type === 'facebook') {
      return dimensions.height;
    } else if (type === 'fall') {
      return 0;
    } else {
      return dimensions.height / 2;
    }
  };

  const prepareEmote = React.useCallback((opts: any) => {
    const guard = maxEmoteGuard.get(opts.id) ?? 0;
    if (guard === -1 || guard >= model.maxEmotesPerMessage) {
      if (guard !== -1) {
        maxEmoteGuard.set(opts.id, -1);
        setTimeout(() => {
          // cleanup id after while
          maxEmoteGuard.delete(opts.id);
        }, 5000);
      }
      return;
    }
    maxEmoteGuard.set(opts.id, guard + 1);

    setEmotes(o => [...o, {
      id:        Math.random().toString(36).substr(2, 9) + '-' + Math.random().toString(36).substr(2, 9),
      trigger:   Date.now() + random(500),
      show:      false,
      animation: {
        type:     model.animation,
        time:     model.animationTime,
        running:  false,
        finished: false,
      },
      position: {
        left: setLeft(model.animation),
        top:  setTop(model.animation),
      },
      url: opts.url[model.emotesSize],
    }]);
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

          const trigger = () => {
            const el = document.getElementById(`emote-${_emotes[i].id}`);
            const dimensions = getContainerDimensions();
            if (!el || !dimensions) {
              setTimeout(() => trigger(), 10);
              return;
            }

            if (_emotes[i].animation.type === 'fadeup') {
              gsap.to(el, {
                top:      _emotes[i].position.top - 150,
                opacity:  0,
                duration: _emotes[i].animation.time / 1000,
              });
            } else if (_emotes[i].animation.type === 'facebook') {
              gsap.to(el, {
                top:      _emotes[i].position.top - random(dimensions.height / 4, dimensions.height / 1.2),
                left:     random(_emotes[i].position.left - 100, Math.min(_emotes[i].position.left + 100, dimensions.width - 100)),
                opacity:  0,
                duration: _emotes[i].animation.time / 1000,
              });
            } else if (_emotes[i].animation.type === 'fadezoom') {
              gsap.to(el, {
                scale:    2,
                opacity:  0,
                duration: _emotes[i].animation.time / 1000,
              });
            } else if (_emotes[i].animation.type === 'fall') {
              el.style.opacity = '0';
              const rotate = Math.random() * model.maxRotation;
              gsap.to(el, {
                top:      dimensions.height - (el.offsetHeight / 1.4), // we are dipping emote little bit as they are not always 100% height
                ease:     'bounce',
                duration: _emotes[i].animation.time / 1000,
              });
              gsap.to(el, {
                opacity:  1,
                duration: 1,
              });
              gsap.to(el, {
                rotate:   `${Math.random() <= 0.5 ? -rotate : rotate}deg`,
                duration: _emotes[i].animation.time / 1000,
              });
              const left = model.offsetX - Math.random() * (model.offsetX * 2);
              gsap.to(el, {
                left:     `${_emotes[i].position.left + left}`,
                ease:     'power3',
                duration: _emotes[i].animation.time / 1000,
              });
            } else {
              gsap.to(el, {
                opacity:  0,
                duration: _emotes[i].animation.time / 1000,
              });
            }
            gsap.to(el, {
              opacity:    0,
              duration:   1,
              delay:      _emotes[i].animation.time / 1000 - 1,
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
    console.log(`====== EMOTES ${containerId} ======`);
    listener();
  }, []);

  const listener = React.useCallback(() => {
    getSocket('/services/twitch', true).on('emote', (opts: any) => prepareEmote(opts));
  }, []);

  const test = () => {
    getSocket('/core/emotes').emit('test', () => {
      return true;
    });
  };

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

    <Grow in={selected} unmountOnExit mountOnEnter>
      <Box sx={{
        position: 'absolute', top: `-35px`, fontSize: '10px', textAlign: 'left', left: 0,
      }}>
        <Button size='small' onClick={test} variant='contained'>Test</Button>
      </Box>
    </Grow>
  </Box>;
};