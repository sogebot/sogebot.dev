import {
  Button,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
} from '@mui/material';
import { Credits } from '@sogebot/backend/dest/database/entity/overlay';
import React from 'react';

import { FormNumericInput } from '../Input/Numeric';

type Props = {
  model: Credits;
  onUpdate: (value: Credits) => void;
};

export const CreditsSettings: React.FC<Props> = ({ model, onUpdate }) => {

  const addNewScreen = () => {
    return;
  };

  return <>
    <Stack spacing={0.5}>
      <FormControl fullWidth>
        <InputLabel id="type-select-label">Rolling Speed</InputLabel>
        <Select
          MenuProps={{ PaperProps: { sx: { maxHeight: 200 } } }}
          label='Speed'
          value={model.speed}
          onChange={(ev) => onUpdate({
            ...model, speed: ev.target.value as typeof model.speed,
          })}
        >
          {['very slow', 'slow', 'medium', 'fast', 'very fast'].map(
            item => <MenuItem value={item} key={item}>{item}</MenuItem>,
          )}
        </Select>
      </FormControl>

      <FormNumericInput
        min={0}
        value={typeof model.spaceBetweenScreens === 'number' ? model.spaceBetweenScreens : undefined}
        label='Space between screens'
        disabled={typeof model.spaceBetweenScreens !== 'number'}
        InputProps={{
          startAdornment: <InputAdornment position='start'>
            <FormControl variant="standard" size='small' sx={{
              '*::before': { border: '0px !important' },
              position:    'relative',
              top:         '5px',
            }}>
              <Select
                MenuProps={{ PaperProps: { sx: { maxHeight: 200 } } }}
                label='Speed'
                value={model.spaceBetweenScreens}
                onChange={(ev) => {
                  let value: number | string = Number(ev.target.value);
                  if (isNaN(value)) {
                    value = ev.target.value;
                  }
                  console.log({ value });
                  console.log({
                    ...model, spaceBetweenScreens: value as typeof model.spaceBetweenScreens,
                  });
                  onUpdate({
                    ...model, spaceBetweenScreens: value as typeof model.spaceBetweenScreens,
                  });
                }}
              >
                <MenuItem selected={typeof model.spaceBetweenScreens === 'number'} value={'250'}>Pixels</MenuItem>
                <MenuItem value={'full-screen-between'}>Full screen between</MenuItem>
                <MenuItem value={'none'}>None</MenuItem>
              </Select>
            </FormControl>
          </InputAdornment>,
          endAdornment: <InputAdornment position='end'>px</InputAdornment>,
        }}
        onChange={val => {
          onUpdate({
            ...model,
            spaceBetweenScreens: val as number,
          });
        }}
      />
    </Stack>

    <Button sx={{ py: 1.5 }} fullWidth onClick={addNewScreen} variant='contained'>Add new screen</Button>
  </>;
};