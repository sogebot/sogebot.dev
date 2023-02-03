import { AbcTwoTone, HourglassBottomTwoTone } from '@mui/icons-material';
import { Box, IconButton } from '@mui/material';
import { Countdown } from '@sogebot/backend/dest/database/entity/overlay';
import { shadowGenerator, textStrokeGenerator } from '@sogebot/ui-helpers/text';
import HTMLReactParser from 'html-react-parser';
import React from 'react';

import {
  DAY, HOUR, MINUTE, SECOND,
} from '../../../constants';
import theme from '../../../theme';

type Props = {
  item: Countdown
};

export const CountdownItem: React.FC<Props> = ({ item }) => {
  const [ show, setShow ] = React.useState('time');

  const font = React.useMemo(() => {
    if (show === 'time') {
      return item.countdownFont;
    } else {
      return item.messageFont;
    }
  }, [ show, item ]);

  const time = React.useMemo(() => {
    const days = Math.floor(item.currentTime / DAY);
    const hours = Math.floor((item.currentTime - days * DAY) / HOUR);
    const minutes = Math.floor((item.currentTime - (days * DAY) - (hours * HOUR)) / MINUTE);
    const seconds = Math.floor((item.currentTime - (days * DAY) - (hours * HOUR) - (minutes * MINUTE)) / SECOND);
    let millis: number | string = Math.floor((item.currentTime - (days * DAY) - (hours * HOUR) - (minutes * MINUTE) - (seconds * SECOND)) / 10);

    if (millis < 10) {
      millis = `0${millis}`;
    }

    let output = '';
    if (days > 0) {
      output += `${days}d`;
    }

    output += `${hours < 10 ? '0' : ''}${hours}:${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    if (item.showMilliseconds) {
      output += `<small>.${millis}</small>`;
    }
    return output;
  }, [ item ]);

  return <>
    <Box sx={{
      fontSize:       `${font.size}px`,
      color:          `${font.color}`,
      fontFamily:     font.family,
      fontWeight:     font.weight,
      textShadow:     [textStrokeGenerator(font.borderPx, font.borderColor), shadowGenerator(font.shadow)].filter(Boolean).join(', '),
      width:          '100%',
      height:         '100%',
      overflow:       'hidden',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      textAlign:      'center',
      'small':        { fontSize: `${font.size * 0.65}px !important` },
    }}>
      <div>
        { show === 'time'
          ? HTMLReactParser(time)
          : item.messageWhenReachedZero
        }
      </div>
    </Box>

    <Box sx={{
      position: 'absolute', top: `0px`, fontSize: '10px', textAlign: 'left', left: 0,
    }}>
      <IconButton onClick={() => setShow('time')} sx={{ backgroundColor: show === 'time' ? `${theme.palette.primary.main}55` : undefined }} size='small'><HourglassBottomTwoTone/></IconButton>
      {item.showMessageWhenReachedZero && <IconButton onClick={() => setShow('text')} sx={{ backgroundColor: show === 'text' ? `${theme.palette.primary.main}55` : undefined }}  size='small'><AbcTwoTone/></IconButton>}
    </Box>
  </>;
};