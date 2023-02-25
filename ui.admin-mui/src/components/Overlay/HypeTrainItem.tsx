import {
  Box, keyframes, Stack, Typography,
} from '@mui/material';
import { HypeTrain } from '@sogebot/backend/dest/database/entity/overlay';
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

export const HypeTrainItem: React.FC<Props<HypeTrain>> = ({ active, selected }) => {
  getSocket('/services/twitch', true);

  const boxRef = useRef<Element>();
  const [id] = React.useState(v4());
  const [ posX, setPosX ] = React.useState(!active ? 0 : 999999999);
  const [ running, setRunning ] = React.useState(false);
  const [ events, setEvents ] = React.useState<{ level: number, goal: number, total: number}[]>([]);
  const [ subs, setSubs ] = React.useState<{username: string; thumbnailUrl: string}[]>(!active ? [
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

  const runTrain = React.useCallback((data: { level: number, goal: number, total: number}, path?: number) => {
    if (!path) {
      path = ((boxRef.current!.clientWidth + 100) / data.goal) * data.total;
    }
    return new Promise((resolve) => {
      setTimeout(() => {
        gsap.to(document.getElementById(`train-${id}`),
          {
            duration:   2,
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

    if (data.level === level || data.level === 1) {
      await runTrain(data);
    } else {
      // move train outside and spawn new
      // get width of train 210px * number of elements
      const width = document.getElementById(`train-${id}`)?.getBoundingClientRect().width ?? 0;
      const path = (boxRef.current!.clientWidth - (boxRef.current!.clientWidth / data.goal) * data.total) - (width * 1.5);
      await runTrain(data, path + 300);
      // reset left
      setPosX(!active ? 0 : boxRef.current!.clientWidth + 100);
      // continue as usual
      await runTrain(data);
    }
    setLevel(data.level);
    setRunning(false);

  };

  React.useEffect(() => {
    console.log('=========== HYPETRAIN ==========');

    getSocket('/services/twitch', true).on('hypetrain-end', () => {
      setSubs([]);
    });

    getSocket('/services/twitch', true).on('hypetrain-update', (data) => {
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
  }, []);

  useIntervalWhen(() => {
    if (running && events.length > 0) {
      setEvents((ev) => {
        process((ev.shift()) as typeof events[number]);
        return ev;
      });
    }
  }, 1000, true, true);

  return <>
    <Box ref={boxRef} sx={{
      width: '100%', height: '100%', display: 'flex', overflow: 'hidden',
    }}>
      <Stack direction='row'
        id={`train-${id}`}
        key={String(running)}
        sx={{
          width:     'fit-content',
          position:  'relative',
          transform: `translateX(${posX}px)`,
          my:        0.5,
          mt:        4,
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