import {
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
} from '@mui/material';
import { Polls } from '@sogebot/backend/dest/database/entity/overlay';
import React from 'react';

import { useTranslation } from '../../../hooks/useTranslation';

type Props = {
  model: Polls;
  onUpdate: (value: Polls) => void;
};

export const PollsSettings: React.FC<Props> = ({ model, onUpdate }) => {
  const { translate } = useTranslation();
  return <>
    <Stack spacing={0.5}>
      <FormControl fullWidth>
        <InputLabel id="type-select-label">{ translate('overlays.polls.settings.cDisplayTheme') }</InputLabel>
        <Select
          MenuProps={{ PaperProps: { sx: { maxHeight: 200 } } }}
          label={ translate('overlays.polls.settings.cDisplayTheme') }
          value={model.theme}
          onChange={(ev) => onUpdate({
            ...model, theme: ev.target.value as typeof model.theme,
          })}
        >
          <MenuItem value="light" key="light">light</MenuItem>
          <MenuItem value="dark" key="dark">dark</MenuItem>
          <MenuItem value="Soge's green" key="Soge\'s green">Soge's green</MenuItem>
        </Select>
      </FormControl>

      <FormControl fullWidth>
        <InputLabel id="type-select-label">{ translate('overlays.polls.settings.cDisplayAlign') }</InputLabel>
        <Select
          MenuProps={{ PaperProps: { sx: { maxHeight: 200 } } }}
          label={ translate('overlays.polls.settings.cDisplayAlign') }
          value={model.align}
          onChange={(ev) => onUpdate({
            ...model, align: ev.target.value as typeof model.align,
          })}
        >
          <MenuItem value="top" key="top">top</MenuItem>
          <MenuItem value="bottom" key="bottom">bottom</MenuItem>
        </Select>
      </FormControl>

      <TextField
        fullWidth
        variant="filled"
        value={model.inactivityTime / 1000}
        inputProps={{ min: 0 }}
        type="number"
        label={translate('overlays.polls.settings.cDisplayHideAfterInactivity')}
        InputProps={{
          endAdornment: <>
            <InputAdornment position='end'>s</InputAdornment>
            <InputAdornment position='end'>
              <Switch checked={model.hideAfterInactivity} onChange={(_, checked) => onUpdate({
                ...model, hideAfterInactivity: checked,
              })}/>
            </InputAdornment>
          </>,
        }}
        onChange={(ev) => {
          if (!isNaN(Number(ev.currentTarget.value))) {
            onUpdate({
              ...model, inactivityTime: Number(ev.currentTarget.value) * 1000,
            });
          }
        }}
      />

    </Stack>
  </>;
};