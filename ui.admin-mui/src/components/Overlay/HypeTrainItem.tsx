import { HypeTrain } from '@entity/overlay';
import { Box, keyframes, Stack, Typography } from '@mui/material';
import gsap from 'gsap';
import { chunk } from 'lodash';
import React, { useRef } from 'react';
import { useIntervalWhen } from 'rooks';
import { v4 } from 'uuid';

import hypeTrain from './assets/hypeTrain.png';
import hypeWagon from './assets/hypeWagon.png';
import type { Props } from './ChatItem';
import { getSocket } from '../../helpers/socket';

const wiggle = keyframes`
0% {
  transform: rotate(-10deg);
}

100% {
  transform: rotate(10deg);
}
`;

const shake = keyframes`
0% {
  transform: translate(5px, 0);
}

100% {
  transform: translate(-5px, 0);
}
`;

const ids: string[] = [];

export const HypeTrainItem: React.FC<Props<HypeTrain>> = ({ active, selected }) => {
  getSocket('/services/twitch');

  const boxRef = useRef<Element>(null);
  const [id] = React.useState(v4());
  const [ running, setRunning ] = React.useState(false);
  const [ cooldown, setCooldown ] = React.useState(Date.now());
  const [ events, setEvents ] = React.useState<{ id: string, level: number, goal: number, total: number }[]>([]);
  const [ subs, setSubs ] = React.useState<{ username: string; thumbnailUrl: string }[]>(!active ? [
    {
      username: 'test1', thumbnailUrl: 'https://i.pravatar.cc/300',
    },
    {
      username: 'test2', thumbnailUrl: 'https://i.pravatar.cc/300',
    },
    {
      username: 'test3', thumbnailUrl: 'https://i.pravatar.cc/300',
    },
    {
      username: 'test4', thumbnailUrl: 'https://i.pravatar.cc/300',
    },
  ]: []);
  const [ level, setLevel ] = React.useState(0);

  const runTrain = React.useCallback((data: { level: number, goal: number, total: number }, path?: number, duration?: number) => {
    setCooldown(Date.now());

    const widthWithTrain = boxRef.current!.clientWidth + (document.getElementById(`train-${id}`)?.getBoundingClientRect().width ?? 0) + 30;
    if (!path) {
      path = widthWithTrain - (widthWithTrain / data.goal) * data.total;
    }
    return new Promise((resolve) => {
      setTimeout(() => {
        gsap.to(document.getElementById(`train-${id}`),
          {
            duration:   duration ?? (boxRef.current!.clientWidth + (path ?? 0)) / 700,
            x:          path,
            roundProps: 'value',
            onComplete: () => {
              setTimeout(() => {
                resolve(true);
              }, 1000);
            },
            ease: 'linear',
          });
      }, 100);
    });
  }, [id]);

  const process = async (data: typeof events[number]) => {
    setRunning(true);

    if (level === 0 || data.level < level) {
      // reset left
      document.getElementById(`train-${id}`)!.style.transform = `translateX(${(boxRef.current!.clientWidth + 50)}px)`;
    }

    if (data.level === level || data.level === 1) {
      await runTrain(data);
    } else {
      // move train outside and spawn new
      // get width of train 210px * number of elements
      const width = (document.getElementById(`train-${id}`)?.getBoundingClientRect().width ?? 0) + 50;
      await runTrain(data, -width);
      // reset left
      await runTrain(data, (boxRef.current!.clientWidth + 50),0);
      // continue as usual
      await runTrain(data);
    }
    setLevel(data.level);
    setRunning(false);
  };

  React.useEffect(() => {
    console.log('=========== HYPETRAIN ==========');

    if (active) {
      // move train outside
      document.getElementById(`train-${id}`)!.style.transform = `translateX(${(boxRef.current!.clientWidth + 50)}px)`;
    }

    getSocket('/services/twitch').on('hypetrain-end', () => {
      setSubs([]);
    });

    getSocket('/services/twitch').on('hypetrain-update', (data) => {
      if (ids.includes(data.id)) {
        return;
      }
      ids.push(data.id);
      if (ids.length > 5) {
        ids.shift();
      }

      // process subs first
      for (const username of Object.keys(data.subs)) {
        setSubs((s) => {
          if (!s.find(o => o.username === username)) {
            return [...s, {
              username, thumbnailUrl: data.subs[username],
            }];
          } else {
            return s;
          }
        });
      }
      setEvents(ev => [...ev, data]);
    });
  }, [active, id]);

  useIntervalWhen(async () => {
    if (!running && events.length > 0) {
      setEvents((ev) => {
        process((ev.shift()) as typeof events[number]);
        return ev;
      });
    }

    // force train to dissapear if no events are coming for long time
    if (Date.now() - cooldown > 30000 && level !== 0) {
      setCooldown(Date.now());
      console.debug('Cleanup train');

      // get width of train 210px * number of elements
      const width = (document.getElementById(`train-${id}`)?.getBoundingClientRect().width ?? 0) + 50;
      const data = {
        level: 0, goal: 0, total: 0,
      };
      runTrain(data, -width)
        .then(() => {
          runTrain(data, (boxRef.current!.clientWidth + 50),0);
        });
    }
  }, 1000, true, true);

  return <>
    <Box ref={boxRef} sx={{
      width: '100%', height: '100%', display: 'flex', overflow: 'hidden',
    }}>
      <Stack direction='row'
        id={`train-${id}`}
        sx={{
          width:     'fit-content',
          position:  'relative',
          my:        0.5,
          mt:        4,
          transform: 'translateX(999999px)',
          opacity:   running || active || selected ? 1 : 0.1,
        }}>
        <Box sx={{
          animationDelay: `-0.1s`,
          animation:      `${shake} ease-in-out 1s alternate infinite`,
          position:       'relative',
          display:        'flex',
        }}>
          <img src={hypeTrain} alt=''/>
        </Box>
        {
          chunk(subs, 2).map((couple, idx) => <Box key={idx} sx={{
            position:       'relative',
            display:        'flex',
            animationDelay: `${(idx + 1) * 0.1}s !important`,
            animation:      `${shake} ease-in-out 1s alternate infinite`,
          }}>
            <img src={hypeWagon} alt=''/>
            <Stack direction='row' sx={{
              position: 'absolute',
              width:    '100%',
              px:       '11.5%',
              top:      `-${(boxRef.current?.clientHeight ?? 0) * 0.18}px`,
            }} justifyContent={'space-between'} alignSelf='center'>
              {couple.map((user) => <Stack key={user.username} sx={{
                width:      '100%',
                display:    'flex',
                alignItems: 'center',
                animation:  `${wiggle} ease-in-out 1s alternate infinite`,
              }}>
                <Typography sx={{
                  overflow:      'visible',
                  textAlign:     'center',
                  width:         `${(boxRef.current?.clientHeight ?? 0) * 0.38}px`,
                  fontSize:      `${(boxRef.current?.clientHeight ?? 0) * 0.15}px`,
                  textShadow:    '2px 2px 4px #000, 0 0 3px #000',
                  textTransform: 'initial',
                }}>{user.username}</Typography>
                <img src={user.thumbnailUrl} alt={user.username} style={{
                  width:    `${(boxRef.current?.clientHeight ?? 0) * 0.3}px`,
                  height:   `${(boxRef.current?.clientHeight ?? 0) * 0.3}px`,
                  position: 'relative',
                  top:      `${(boxRef.current?.clientHeight ?? 0) * 0.13}%`,
                }}/>
              </Stack>)}
            </Stack>
          </Box>)
        }
      </Stack>
    </Box>
  </>;
};