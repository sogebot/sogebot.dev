import {
  Divider,
  InputAdornment,
  Stack,
  TextField,
} from '@mui/material';
import { EmotesCombo } from '@sogebot/backend/dest/database/entity/overlay';
import React from 'react';

import { useTranslation } from '../../../hooks/useTranslation';

type Props = {
  model: EmotesCombo;
  onUpdate: (value: EmotesCombo) => void;
};

export const EmotesComboSettings: React.FC<Props> = ({ model, onUpdate }) => {
  const { translate } = useTranslation();
  return <>
    <Divider/>

    <Stack spacing={0.5} sx={{ pt: 2 }}>
      <TextField
        fullWidth
        value={model.showEmoteInOverlayThreshold}
        inputProps={{ min: 1 }}
        type="number"
        label={translate('overlays.emotes.settings.showEmoteInOverlayThreshold')}
        onChange={(ev) => {
          if (!isNaN(Number(ev.currentTarget.value))) {
            onUpdate({
              ...model, showEmoteInOverlayThreshold: Number(ev.currentTarget.value),
            });
          }
        }}
      />

      <TextField
        fullWidth
        value={model.hideEmoteInOverlayAfter}
        inputProps={{ min: 1 }}
        type="number"
        label={translate('overlays.emotes.settings.hideEmoteInOverlayAfter.title')}
        InputProps={{
          endAdornment: <>
            <InputAdornment position='end'>s</InputAdornment>
          </>,
        }}
        onChange={(ev) => {
          if (!isNaN(Number(ev.currentTarget.value))) {
            onUpdate({
              ...model, hideEmoteInOverlayAfter: Number(ev.currentTarget.value),
            });
          }
        }}
      />
    </Stack>
  </>;
};