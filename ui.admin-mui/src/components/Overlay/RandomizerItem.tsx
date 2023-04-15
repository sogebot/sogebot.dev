import {
  Box, Fade, FormControl, Grow, InputLabel, MenuItem, Select, Typography,
} from '@mui/material';
import { Randomizer as Overlay } from '@sogebot/backend/dest/database/entity/overlay';
import { Randomizer } from '@sogebot/backend/dest/database/entity/randomizer';
import axios from 'axios';
import React from 'react';
import { useIntervalWhen } from 'rooks';
import shortid from 'shortid';

import type { Props } from './ChatItem';
import getAccessToken from '../../getAccessToken';
import { loadFont } from '../Accordion/Font';

export const RandomizerItem: React.FC<Props<Overlay>> = ({ active, selected }) => {
  const [ randomizerId, setRandomizerId ] = React.useState('');
  const [ randomizers, setRandomizers ] = React.useState<Randomizer[]>([]);
  const [ threadId ] = React.useState(shortid());

  React.useEffect(() => {
    console.log(`====== Randomizer (${threadId}) ======`);
  }, []);

  const currentRandomizer = React.useMemo(() => {
    const randomizer = randomizers.find(o => o.id === randomizerId);
    if (randomizer) {
      loadFont(randomizer.customizationFont.family);
    }
    return randomizer;
  }, [randomizers, randomizerId]);

  const refresh = React.useCallback(async () => {
    axios.get(`${JSON.parse(localStorage.server)}/api/registries/randomizer`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
      .then(({ data }) => {
        setRandomizers(data.data);
      });
  }, []);

  useIntervalWhen(async () => {
    if (!active) {
      refresh();
    } else {
      const response = await axios.get(`${JSON.parse(localStorage.server)}/api/registries/randomizer/visible`, { headers: { authorization: `Bearer ${getAccessToken()}` } });
      const randomizer = response.data.data;
      if (!randomizer) {
        setRandomizers([]);
        return;
      }
      setRandomizers([randomizer as Randomizer]);
      setRandomizerId(randomizer.id);

      if (randomizer.items.length === 0) {
        console.error('No items detected in your randomizer');
        return;
      }
    }
  }, 1000, true, true);

  return <>
    <Box sx={{
      width: '100%', height: '100%', overflow: 'hidden', position: 'relative', p: 0.5, textTransform: 'none !important',
    }}>
      <Fade in={(currentRandomizer?.isShown ?? false) || (currentRandomizer !== undefined && !active)} unmountOnExit mountOnEnter>
        <Box>
          {JSON.stringify({ currentRandomizer })}
        </Box>
      </Fade>
    </Box>

    <Grow in={selected} unmountOnExit mountOnEnter>
      <Box sx={{
        position: 'absolute', top: `-50px`, fontSize: '10px', textAlign: 'left', left: 0, textTransform: 'none !important',
      }}>
        <FormControl variant="filled" sx={{ width: '100%' }}>
          <InputLabel id="demo-simple-select-standard-label" shrink>Randomizer to test</InputLabel>
          <Select
            fullWidth
            sx={{ minWidth: '250px' }}
            size='small'
            displayEmpty
            labelId="demo-simple-select-standard-label"
            id="demo-simple-select-standard"
            value={randomizerId}
            label="Countdown"
            onChange={(event) => setRandomizerId(event.target.value)}
          >
            <MenuItem value='' key='' sx={{ fontSize: '14px' }}><em>None</em></MenuItem>
            {randomizers.map(val => <MenuItem value={val.id} key={val.id}>
              <Typography variant='body2'>
                {val.name}
                <Typography component='span' sx={{
                  px: 0.5, fontWeight: 'bold',
                }}>{val.command}</Typography>
                <small>{val.id}</small>
              </Typography>
            </MenuItem>)}
          </Select>
        </FormControl>
      </Box>
    </Grow>
  </>;
};