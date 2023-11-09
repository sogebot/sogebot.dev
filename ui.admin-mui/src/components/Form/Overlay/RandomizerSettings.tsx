import { FormControl, InputLabel, MenuItem, Select, Typography } from '@mui/material';
import { Randomizer as Overlay } from '@sogebot/backend/dest/database/entity/overlay';
import { Randomizer } from '@sogebot/backend/dest/database/entity/randomizer';
import axios from 'axios';
import React from 'react';

import getAccessToken from '../../../getAccessToken';
import { useAppDispatch, useAppSelector } from '../../../hooks/useAppDispatch';
import { getRandomizerId, setRandomizerId } from '../../../store/overlaySlice';

type Props = {
  model:    Overlay;
  onUpdate: (value: Overlay) => void;
};

export const RandomizerSettings: React.FC<Props> = () => {
  const dispatch = useAppDispatch();
  const [ randomizers, setRandomizers ] = React.useState<Randomizer[]>([]);
  const randomizerId = useAppSelector(getRandomizerId);

  const refresh = React.useCallback(async () => {
    axios.get(`${JSON.parse(localStorage.server)}/api/registries/randomizer`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
      .then(({ data }) => {
        setRandomizers(data.data);
      });
  }, []);
  React.useEffect(() => {
    refresh();
  }, [refresh]);

  return <>
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
        onChange={(event) => dispatch(setRandomizerId(event.target.value as string))}
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
  </>;
};