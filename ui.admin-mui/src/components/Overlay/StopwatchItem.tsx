import { Stopwatch } from '@entity/overlay';
import { Box } from '@mui/material';
import axios from 'axios';
import HTMLReactParser from 'html-react-parser';
import { nanoid } from 'nanoid';
import React from 'react';
import { useIntervalWhen } from 'rooks';
import * as workerTimers from 'worker-timers';

import type { Props } from './ChatItem';
import { shadowGenerator, textStrokeGenerator } from '../../helpers/text';
import { toBoolean } from '../../helpers/toBoolean';
import { loadFont } from '../Accordion/Font';
import { GenerateTime } from '../Dashboard/Widget/Action/GenerateTime';

let lastTimeSync = Date.now();
let lastSave = Date.now();

export const StopwatchItem: React.FC<Props<Stopwatch>> = ({ item, active, id, groupId }) => {
  const [ model, setModel ] = React.useState(item);
  const [ isReady, setReady ] = React.useState(false);
  const [ threadId ] = React.useState(nanoid());

  const enabled = React.useMemo(() => {
    return isReady && (active ?? false) && model.isStartedOnSourceLoad;
  }, [active, model, isReady]);

  React.useEffect(() => {
    if (!active) {
      setModel(item);
    }
  }, [active, item]);

  React.useEffect(() => {
    if (localStorage.getItem(`stopwatch-controller-${id}`) === threadId) {
      localStorage.setItem(`stopwatch-controller-${id}-currentTime`, String(model.currentTime));
      localStorage.setItem(`stopwatch-controller-${id}-currentTimeAt`, new Date().toISOString());
      localStorage.setItem(`stopwatch-controller-${id}-enabled`, String(enabled));
      if (model.isPersistent && Date.now() - lastSave > 1000) {
        lastSave = Date.now();
        axios.post(`/api/registries/overlays/tick/${groupId}/${id}/${Number(model.currentTime)}`);
      }
    }
  }, [ enabled, threadId, model ]);

  const latestEnabled = React.useRef(enabled);
  const latestModel = React.useRef(model);
  React.useEffect(() => {
    latestEnabled.current = enabled;
    latestModel.current = model;
  }, [enabled, model]);
  const update = () => {
    if (localStorage.getItem(`stopwatch-controller-${id}`) !== threadId) {
      // console.debug('Secondary');
      // console.debug(localStorage.getItem(`stopwatch-controller-${id}-enabled`));

      if (Date.now() - lastTimeSync > 1000 || !latestEnabled.current) {
      // get when it was set to get offset
        const currentTimeAt = latestEnabled.current
          ? new Date(localStorage.getItem(`stopwatch-controller-${id}-currentTimeAt`) || Date.now()).getTime()
          : Date.now();
        if (lastTimeSync === currentTimeAt) {
          // console.debug('No update, setting as controller');
          localStorage.setItem(`stopwatch-controller-${id}`, threadId);
        }
        lastTimeSync = currentTimeAt;

        setModel(o => ({
          ...o, currentTime: Date.now() - currentTimeAt + Number(localStorage.getItem(`stopwatch-controller-${id}-currentTime`)),
        }));
      }

      return;
    }
    // console.debug('Primary');
    axios.post(`/api/registries/overlays/tick/${groupId}/${id}`, {
      isEnabled: latestEnabled.current,
      time:      latestModel.current.currentTime,
    }).then(({ data }) =>  {
      if (data.data) {
        if (data.data.isEnabled !== null) {
          setModel(o => ({
            ...o, isStartedOnSourceLoad: data.data.isEnabled!,
          }));
        }

        localStorage.setItem(`stopwatch-controller-${id}-currentTime`, String(latestModel.current.currentTime));
        localStorage.setItem(`stopwatch-controller-${id}-currentTimeAt`, new Date().toISOString());
        localStorage.setItem(`stopwatch-controller-${id}-enabled`, String(latestEnabled.current));

        if (data.data.time !== null) {
          setModel(o => ({
            ...o, currentTime: Number(data.data.time!),
          }));
        }
      }
    });
  };

  React.useEffect(() => {
    loadFont(model.stopwatchFont.family);

    if (active) {
      console.log(`====== Stopwatch (${threadId}) ======`);

      // setting as controller (we don't care which one will control, it will be last one to load)
      localStorage.setItem(`stopwatch-controller-${id}`, threadId);
    }
    setReady(true);
  }, [item]);

  const intervalRef = React.useRef<number | null>(null);
  React.useEffect(() => {
    intervalRef.current = workerTimers.setInterval(() => {
      if (isReady && active) {
        update();
      }
    }, 100);
    return () => workerTimers.clearInterval(intervalRef.current!);
  }, [ isReady, active ]);

  useIntervalWhen(() => {
    if (enabled) {
      if (toBoolean(localStorage.getItem(`stopwatch-controller-${id}-enabled`) || false)) {
        setModel(o => ({
          ...o, currentTime: o.currentTime + 10,
        }));
      }
    }
  }, 10, true, true);

  const font = React.useMemo(() => {
    return model.stopwatchFont;
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
        {HTMLReactParser(GenerateTime(model.currentTime, model.showMilliseconds))}
      </Box>
    </Box>
  </>;
};