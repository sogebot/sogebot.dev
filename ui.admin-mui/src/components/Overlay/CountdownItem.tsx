import { Box } from '@mui/material';
import { Countdown } from '@sogebot/backend/dest/database/entity/overlay';
import HTMLReactParser from 'html-react-parser';
import { nanoid } from 'nanoid';
import React from 'react';
import { useIntervalWhen } from 'rooks';
import * as workerTimers from 'worker-timers';

import type { Props } from './ChatItem';
import { getSocket } from '../../helpers/socket';
import { shadowGenerator, textStrokeGenerator } from '../../helpers/text';
import { toBoolean } from '../../helpers/toBoolean';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { selectOverlayCountdown, setCountdownShow } from '../../store/overlaySlice';
import { loadFont } from '../Accordion/Font';
import { GenerateTime } from '../Dashboard/Widget/Action/GenerateTime';

let lastTimeSync = Date.now();
let lastSave = Date.now();

export const CountdownItem: React.FC<Props<Countdown>> = ({ item, active, id, groupId }) => {
  const countdowns = useAppSelector(selectOverlayCountdown);
  const dispatch = useAppDispatch();
  const show = React.useMemo(() => {
    return countdowns[id] ?? 'time';
  }, [id, countdowns]);

  const [ model, setModel ] = React.useState(item);
  const [ isReady, setReady ] = React.useState(false);
  const [ threadId ] = React.useState(nanoid());

  const enabled = React.useMemo(() => {
    return isReady && (active ?? false) && model.isStartedOnSourceLoad && model.currentTime > 0;
  }, [active, model, isReady]);

  React.useEffect(() => {
    if (!active) {
      setModel(item);
    }
  }, [active, item]);

  React.useEffect(() => {
    if (active) {
      if (model.showMessageWhenReachedZero && model.currentTime <= 0) {
        dispatch(setCountdownShow({ [id]: 'text' }));
      } else {
        dispatch(setCountdownShow({ [id]: 'time' }));
      }
    }
  }, [ model, dispatch, id, active ]);

  React.useEffect(() => {
    if (localStorage.getItem(`countdown-controller-${id}`) === threadId) {
      localStorage.setItem(`countdown-controller-${id}-currentTime`, String(model.currentTime));
      localStorage.setItem(`countdown-controller-${id}-currentTimeAt`, new Date().toISOString());
      localStorage.setItem(`countdown-controller-${id}-enabled`, String(enabled));
      if (model.isPersistent && Date.now() - lastSave > 10) {
        lastSave = Date.now();
        getSocket('/registries/overlays', true).emit('overlays::tick', {
          id,
          groupId,
          millis: Number(model.currentTime),
        });
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
    if (localStorage.getItem(`countdown-controller-${id}`) !== threadId) {
      console.debug('Secondary');
      console.debug(localStorage.getItem(`countdown-controller-${id}-enabled`));

      if (Date.now() - lastTimeSync > 1000 || !latestEnabled.current) {
      // get when it was set to get offset
        const currentTimeAt = latestEnabled.current
          ? new Date(localStorage.getItem(`countdown-controller-${id}-currentTimeAt`) || Date.now()).getTime()
          : Date.now();
        if (lastTimeSync === currentTimeAt) {
          console.debug('No update, setting as controller');
          localStorage.setItem(`countdown-controller-${id}`, threadId);
        }
        lastTimeSync = currentTimeAt;

        setModel(o => ({
          ...o, currentTime: Date.now() - currentTimeAt + Number(localStorage.getItem(`countdown-controller-${id}-currentTime`)),
        }));
      }

      return;
    }
    console.debug('Primary');
    getSocket('/overlays/countdown', true)
      .emit('countdown::update', {
        id:        id,
        isEnabled: latestEnabled.current,
        time:      latestModel.current.currentTime,
      }, (_err: null, data?: { isEnabled: boolean | null, time: string | null }) => {
        if (data) {
          if (data.isEnabled !== null) {
            setModel(o => ({
              ...o, isStartedOnSourceLoad: data.isEnabled!,
            }));
          }

          localStorage.setItem(`countdown-controller-${id}-currentTime`, String(latestModel.current.currentTime));
          localStorage.setItem(`countdown-controller-${id}-currentTimeAt`, new Date().toISOString());
          localStorage.setItem(`countdown-controller-${id}-enabled`, String(latestEnabled.current));

          if (data.time !== null) {
            setModel(o => ({
              ...o, currentTime: Number(data.time!),
            }));
          }
        }
      });
  };

  React.useEffect(() => {
    loadFont(model.countdownFont.family);
    loadFont(model.messageFont.family);

    if (active) {
      console.log(`====== COUNTDOWN (${threadId}) ======`);

      // setting as controller (we don't care which one will control, it will be last one to load)
      localStorage.setItem(`countdown-controller-${id}`, threadId);

      if (!item.isPersistent) {
        setModel(o => ({
          ...o, currentTime: item.time,
        }));
      }
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
      if (toBoolean(localStorage.getItem(`countdown-controller-${id}-enabled`) || false)) {
        setModel(o => ({
          ...o, currentTime: o.currentTime - 10,
        }));
      }
    }
  }, 10, true, true);

  const font = React.useMemo(() => {
    if (show === 'time') {
      return model.countdownFont;
    } else {
      return model.messageFont;
    }
  }, [ show, model ]);

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
        { show === 'time'
          ? HTMLReactParser(GenerateTime(model.currentTime, model.showMilliseconds))
          : model.messageWhenReachedZero
        }
      </Box>
    </Box>
  </>;
};