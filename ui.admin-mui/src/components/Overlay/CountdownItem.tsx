import { AbcTwoTone, HourglassBottomTwoTone } from '@mui/icons-material';
import { Box, IconButton } from '@mui/material';
import { Countdown } from '@sogebot/backend/dest/database/entity/overlay';
import { shadowGenerator, textStrokeGenerator } from '@sogebot/ui-helpers/text';
import HTMLReactParser from 'html-react-parser';
import React from 'react';
import { useIntervalWhen } from 'rooks';
import shortid from 'shortid';
import * as workerTimers from 'worker-timers';

import {
  DAY, HOUR, MINUTE, SECOND,
} from '../../constants';
import { getSocket } from '../../helpers/socket';
import { toBoolean } from '../../helpers/toBoolean';
import theme from '../../theme';
import { loadFont } from '../Accordion/Font';

type Props = {
  item: Countdown,
  id: string,
  groupId: string,
  /** Overlay is active, e.g. used in overlay */
  active?: boolean,
};

let lastTimeSync = Date.now();
let lastSave = Date.now();

export const CountdownItem: React.FC<Props> = ({ item, active, id, groupId }) => {
  const [ show, setShow ] = React.useState('time');
  const [ model, setModel ] = React.useState(item);
  const [ isReady, setReady ] = React.useState(false);
  const [ threadId ] = React.useState(shortid());

  const enabled = React.useMemo(() => {
    return isReady && (active ?? false) && model.isStartedOnSourceLoad && model.currentTime > 0;
  }, [active, model, isReady]);

  React.useEffect(() => {
    if (!active) {
      setModel(item);
    }
  }, [active, item]);

  React.useEffect(() => {
    if (model.showMessageWhenReachedZero && model.currentTime <= 0) {
      setShow('text');
    }
  }, [ model ]);

  const saveState = () => {
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
  };

  const update = () => {
    if (localStorage.getItem(`countdown-controller-${id}`) !== threadId) {
      console.debug('Secondary');
      console.debug(localStorage.getItem(`countdown-controller-${id}-enabled`));

      if (Date.now() - lastTimeSync > 1000 || !enabled) {
      // get when it was set to get offset
        const currentTimeAt = enabled
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
        isEnabled: enabled,
        time:      model.currentTime,
      }, (_err: null, data?: { isEnabled: boolean | null, time :string | null }) => {
        if (data) {
          if (data.isEnabled !== null) {
            setModel(o => ({
              ...o, isStartedOnSourceLoad: data.isEnabled!,
            }));
          }

          localStorage.setItem(`countdown-controller-${id}-currentTime`, String(model.currentTime));
          localStorage.setItem(`countdown-controller-${id}-currentTimeAt`, new Date().toISOString());
          localStorage.setItem(`countdown-controller-${id}-enabled`, String(enabled));

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

  React.useEffect(() => {
    if (isReady && active) {
      workerTimers.setInterval(() => {
        update();
      }, 100);

      workerTimers.setInterval(() => {
        saveState();
      }, 500);
    }
  }, [ isReady, active ]);

  useIntervalWhen(() => {
    if (toBoolean(localStorage.getItem(`countdown-controller-${id}-enabled`) || false)) {
      setModel(o => ({
        ...o, currentTime: o.currentTime - 10,
      }));
    }
  }, 10, enabled, true);

  const font = React.useMemo(() => {
    if (show === 'time') {
      return model.countdownFont;
    } else {
      return model.messageFont;
    }
  }, [ show, model ]);

  const time = React.useMemo(() => {
    const days = Math.floor(model.currentTime / DAY);
    const hours = Math.floor((model.currentTime - days * DAY) / HOUR);
    const minutes = Math.floor((model.currentTime - (days * DAY) - (hours * HOUR)) / MINUTE);
    const seconds = Math.floor((model.currentTime - (days * DAY) - (hours * HOUR) - (minutes * MINUTE)) / SECOND);
    let millis: number | string = Math.floor((model.currentTime - (days * DAY) - (hours * HOUR) - (minutes * MINUTE) - (seconds * SECOND)) / 10);

    if (millis < 10) {
      millis = `0${millis}`;
    }

    let output = '';
    if (days > 0) {
      output += `${days}d`;
    }

    output += `<span>`;
    output += `${hours < 10 ? '0' : ''}${hours}:${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    output += `</span>`;
    if (model.showMilliseconds) {
      output += `<small>.${millis}</small>`;
    }
    return output;
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
        { show === 'time'
          ? HTMLReactParser(time)
          : model.messageWhenReachedZero
        }
      </Box>
    </Box>

    {!active && <Box sx={{
      position: 'absolute', top: `0px`, fontSize: '10px', textAlign: 'left', left: 0,
    }}>
      <IconButton onClick={() => setShow('time')} sx={{ backgroundColor: show === 'time' ? `${theme.palette.primary.main}55` : undefined }} size='small'><HourglassBottomTwoTone/></IconButton>
      {model.showMessageWhenReachedZero && <IconButton onClick={() => setShow('text')} sx={{ backgroundColor: show === 'text' ? `${theme.palette.primary.main}55` : undefined }}  size='small'><AbcTwoTone/></IconButton>}
    </Box>}
  </>;
};