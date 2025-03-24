import { Marathon } from '@entity/overlay';
import { Sparklines, SparklinesCurve } from '@jrwats/react-sparklines';
import { Box, Stack } from '@mui/material';
import axios from 'axios';
import HTMLReactParser from 'html-react-parser';
import { nanoid } from 'nanoid';
import React from 'react';
import { useIntervalWhen } from 'rooks';
import * as workerTimers from 'worker-timers';

import type { Props } from './ChatItem';
import { shadowGenerator, textStrokeGenerator } from '../../helpers/text';
import { loadFont } from '../Accordion/Font';
import { GenerateTime } from '../Dashboard/Widget/Action/GenerateTime';

export const MarathonItem: React.FC<Props<Marathon>> = ({ item, id }) => {
  const [ model, setModel ] = React.useState(item);
  const [ isReady, setReady ] = React.useState(false);
  const [ threadId ] = React.useState(nanoid());
  const [ timestamp, setTimestamp ] = React.useState(Date.now());
  const [ times, setTimes ] = React.useState<number[]>([]);

  React.useEffect(() => {
    if (times.length > 50) {
      const newTimes = [...times];
      newTimes.splice(0,1);
      setTimes(newTimes);
    }
  }, [ times ]);

  const min = React.useMemo(() => {
    let val = Number.MAX_SAFE_INTEGER;
    times.forEach(time => {
      if (time < val) {
        val = time;
      }
    });
    return val - 60000;
  }, [times]);

  const max = React.useMemo(() => {
    let val = 0;
    times.forEach(time => {
      if (time > val) {
        val = time;
      }
    });
    return val + 60000;
  }, [times]);

  const update = () => {
    axios.get(`/api/overlays/marathon/${id}`).then(({ data }) => {
      if (data.data) {
        setTimes(val => [...val, data.endTime - Date.now()]);
        setModel(o => ({
          ...o, endTime: data.endTime,
        }));
      }
    });
  };

  React.useEffect(() => {
    loadFont(model.marathonFont.family);

    console.log(`====== Marathon (${threadId}) ======`);
    setReady(true);
  }, [item]);

  const intervalRef = React.useRef<number | null>(null);
  React.useEffect(() => {
    intervalRef.current = workerTimers.setInterval(() => {
      if (isReady) {
        update();
      }
    }, 1000);
    return () => workerTimers.clearInterval(intervalRef.current!);
  }, [ isReady ]);

  useIntervalWhen(() => {
    setTimestamp(Date.now());
  }, 10, true, true);

  const font = React.useMemo(() => {
    return model.marathonFont;
  }, [ model ]);

  return <>
    <Box sx={{
      fontSize:              `${font.size}px`,
      lineHeight:            `${font.size}px`,
      color:                 `${font.color}`,
      fontFamily:            font.family,
      fontWeight:            font.weight,
      textShadow:            [textStrokeGenerator(font.borderPx, font.borderColor), shadowGenerator(font.shadow)].filter(Boolean).join(', '),
      width:                 '100%',
      height:                '100%',
      overflow:              'hidden',
      display:               'flex',
      justifyContent:        'center',
      textAlign:             'center',
      textTransform:         'none',
      'div':                 { display: 'inline-flex' },
      'small:first-of-type': { textAlign: 'left' },
      'small':               {
        fontSize:  `${font.size * 0.65}px !important`,
        textAlign: 'right',
      },
    }}>
      <Box sx={{
        height:         'fit-content',
        width:          '100%',
        alignItems:     'baseline',
        textAlign:      'center',
        justifyContent: 'center',
      }}>
        <Stack sx={{
          width: '100%', alignItems: 'center',
        }}>
          <Box sx={{ alignItems: 'baseline' }}>{HTMLReactParser(GenerateTime(model.endTime - timestamp, model.showMilliseconds))}</Box>
          {model.showProgressGraph && <Box sx={{ width: '50%' }}>
            <Sparklines data={times} min={min} max={max} limit={50} width={400} height={100} margin={5}>
              <SparklinesCurve style={{
                fill: 'none', strokeWidth: 3,
              }} color="orange"/>
            </Sparklines>
          </Box>}
        </Stack>
      </Box>
    </Box>
  </>;
};