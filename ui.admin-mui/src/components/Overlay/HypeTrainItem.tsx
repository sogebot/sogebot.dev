import {
  Box, Grow, Slider, Stack,
} from '@mui/material';
import { HypeTrain } from '@sogebot/backend/dest/database/entity/overlay';
import React, { useRef } from 'react';

import hypeTrain from './assets/hypeTrain.png';
import hypeWagon from './assets/hypeWagon.png';
import type { Props } from './ChatItem';

export const HypeTrainItem: React.FC<Props<HypeTrain>> = ({ selected }) => {
  const [ progress, setProgress ] = React.useState(100);

  const boxRef = useRef<Element>();

  return <>
    <Box ref={boxRef} sx={{
      width: '100%', height: '100%', display: 'flex', overflow: 'hidden',
    }}>
      <Stack direction='row' sx={{
        width: 'fit-content', transform: `translateX(${boxRef.current!.clientWidth * (progress / 100)}px)`,
      }}>
        <img src={hypeTrain}/>
        <img src={hypeWagon}/>
        <img src={hypeWagon}/>
        <img src={hypeWagon}/>
        <img src={hypeWagon}/>
        <img src={hypeWagon}/>
      </Stack>
    </Box>
    <Grow in={selected} unmountOnExit mountOnEnter>
      <Box sx={{
        position: 'absolute', top: `-35px`, fontSize: '10px', textAlign: 'left', left: 0, width: '100%', zIndex: 9999999999999,
      }} onDrag={ev => console.log({ ev })}>
        <Slider value={progress} onChange={((_, val) => setProgress(val as number))} track="inverted" />
      </Box>
    </Grow>
  </>;
};