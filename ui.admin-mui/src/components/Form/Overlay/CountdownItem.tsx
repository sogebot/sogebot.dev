import { AbcTwoTone, HourglassBottomTwoTone } from '@mui/icons-material';
import { Box, IconButton } from '@mui/material';
import { Countdown } from '@sogebot/backend/dest/database/entity/overlay';
import { shadowGenerator, textStrokeGenerator } from '@sogebot/ui-helpers/text';
import React from 'react';

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
    }}>
      <div>
        { show === 'time'
          ? <>
              00:00:00
            { item.showMilliseconds && <small>.000</small>}
          </>
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