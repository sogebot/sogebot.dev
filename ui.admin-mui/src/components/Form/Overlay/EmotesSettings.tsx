import { Button, Divider, FormControl, InputAdornment, InputLabel, MenuItem, Select, Stack, TextField } from '@mui/material';
import { Emotes } from '@sogebot/backend/dest/database/entity/overlay';
import axios from 'axios';
import React from 'react';

import { useTranslation } from '../../../hooks/useTranslation';

type Props = {
  model:    Emotes;
  onUpdate: (value: Emotes) => void;
};

export const EmotesSettings: React.FC<Props> = ({ model, onUpdate }) => {
  const { translate } = useTranslation();

  const test = () => {
    axios.post('/api/core/emotes?_action=test');
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

      <FormControl fullWidth>
        <InputLabel id="type-select-label">{ translate('overlays.emotes.settings.cEmotesAnimation') }</InputLabel>
        <Select
          MenuProps={{ PaperProps: { sx: { maxHeight: 200 } } }}
          label={ translate('overlays.emotes.settings.cEmotesAnimation') }
          labelId="type-select-label"
          value={model.animation}
          onChange={(ev) => onUpdate({
            ...model, animation: ev.target.value as 'fadeup',
          })}
        >
          <MenuItem value="fadeup" key="fadeup">fadeup</MenuItem>
          <MenuItem value="fadezoom" key="fadezoom">fadezoom</MenuItem>
          <MenuItem value="facebook" key="facebook">facebook</MenuItem>
          <MenuItem value="fall" key="fall">fall</MenuItem>
        </Select>
      </FormControl>

      <TextField
        fullWidth
        value={model.maxEmotesPerMessage}
        inputProps={{ min: 1 }}
        type="number"
        label={translate('overlays.emotes.settings.cEmotesMaxEmotesPerMessage')}
        onChange={(ev) => {
          if (!isNaN(Number(ev.currentTarget.value))) {
            onUpdate({
              ...model, maxEmotesPerMessage: Number(ev.currentTarget.value),
            });
          }
        }}
      />

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
    </Stack>
  </>;
};