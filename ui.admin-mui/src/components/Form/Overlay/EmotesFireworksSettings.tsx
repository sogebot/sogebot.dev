import { Button, Divider, FormControl, InputAdornment, InputLabel, MenuItem, Select, Stack, TextField } from '@mui/material';
import { EmotesFireworks } from '@sogebot/backend/dest/database/entity/overlay';
import axios from 'axios';
import React from 'react';

import getAccessToken from '../../../getAccessToken';
import { useTranslation } from '../../../hooks/useTranslation';

type Props = {
  model:    EmotesFireworks;
  onUpdate: (value: EmotesFireworks) => void;
};

export const EmotesFireworksSettings: React.FC<Props> = ({ model, onUpdate }) => {
  const { translate } = useTranslation();

  const test = () => {
    axios.post('/api/core/emotes?_action=testFireworks', undefined, {
      headers: {
        Authorization: `Bearer ${getAccessToken()}`
      }
    });
  };
  return <>
    <Button sx={{ py: 1.5 }} fullWidth onClick={test} variant='contained'>Test</Button>
    <Divider variant='middle'/>
    <Stack spacing={0.5}>
      <FormControl fullWidth>
        <InputLabel id="type-select-label">{ translate('overlays.emotes.settings.cEmotesSize') }</InputLabel>
        <Select
          MenuProps={{ PaperProps: { sx: { maxHeight: 200 } } }}
          label={ translate('overlays.emotes.settings.cEmotesSize') }
          labelId="type-select-label"
          value={model.emotesSize}
          onChange={(ev) => onUpdate({
            ...model, emotesSize: Number(ev.target.value) as 1 | 2 | 3,
          })}
        >
          <MenuItem value="1" key="1">1</MenuItem>
          <MenuItem value="2" key="2">2</MenuItem>
          <MenuItem value="3" key="3">3</MenuItem>
        </Select>
      </FormControl>

      <TextField
        fullWidth
        value={model.animationTime}
        inputProps={{ min: 200 }}
        type="number"
        label={translate('overlays.emotes.settings.cEmotesAnimationTime')}
        InputProps={{
          endAdornment: <>
            <InputAdornment position='end'>ms</InputAdornment>
          </>,
        }}
        onChange={(ev) => {
          if (!isNaN(Number(ev.currentTarget.value))) {
            onUpdate({
              ...model, animationTime: Number(ev.currentTarget.value),
            });
          }
        }}
      />

      <TextField
        fullWidth
        value={model.numOfExplosions}
        inputProps={{ min: 1 }}
        type="number"
        label={translate('overlays.emotes.settings.cExplosionNumOfExplosions')}
        InputProps={{
          endAdornment: <>
            <InputAdornment position='end'>ms</InputAdornment>
          </>,
        }}
        onChange={(ev) => {
          if (!isNaN(Number(ev.currentTarget.value))) {
            onUpdate({
              ...model, numOfExplosions: Number(ev.currentTarget.value),
            });
          }
        }}
      />

      <TextField
        fullWidth
        value={model.numOfEmotesPerExplosion}
        inputProps={{ min: 1 }}
        type="number"
        label={translate('overlays.emotes.settings.cExplosionNumOfEmotesPerExplosion')}
        InputProps={{
          endAdornment: <>
            <InputAdornment position='end'>ms</InputAdornment>
          </>,
        }}
        onChange={(ev) => {
          if (!isNaN(Number(ev.currentTarget.value))) {
            onUpdate({
              ...model, numOfEmotesPerExplosion: Number(ev.currentTarget.value),
            });
          }
        }}
      />
    </Stack>
  </>;
};