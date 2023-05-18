import {
  Box,
  Button,
  capitalize,
  FormControl,
  FormControlLabel,
  FormLabel,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Slider,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { Clips } from '@sogebot/backend/dest/database/entity/overlay';
import React from 'react';

import { getSocket } from '../../../helpers/socket';
import { useTranslation } from '../../../hooks/useTranslation';

type Props = {
  model: Clips;
  onUpdate: (value: Clips) => void;
};

export const ClipsSettings: React.FC<Props> = ({ model, onUpdate }) => {
  const { translate } = useTranslation();

  const testURLRef = React.useRef<HTMLInputElement>();

  const onSubmit = () => {
    if (!testURLRef.current) {
      return;
    }
    getSocket('/overlays/clips').emit('test', testURLRef.current.value);
  };

  return <>
    <Stack spacing={0.5} >
      <FormLabel sx={{ marginTop: '15px' }}>{translate('systems.songs.settings.volume')}</FormLabel>
      <Box sx={{
        px: 2,
        pt: 1,
      }}>
        <Slider
          value={model.volume}
          max={100}
          valueLabelDisplay="on"
          valueLabelFormat={(value) => `${value}%`}
          size='small'
          onChange={(event, newValue) => onUpdate({
            ...model, volume: Number(newValue),
          })}
        />
      </Box>

      <FormControl fullWidth variant="filled" >
        <InputLabel id="type-select-label">{translate('overlays.clips.settings.cClipsFilter')}</InputLabel>
        <Select
          MenuProps={{ PaperProps: { sx: { maxHeight: 200 } } }}
          label={translate('overlays.clips.settings.cClipsFilter')}
          labelId="type-select-label"
          value={model.filter}
          onChange={(ev) => onUpdate({
            ...model, filter: (ev.target.value ?? 'none') as any,
          })}
        >
          {['none', 'grayscale', 'sepia', 'tint', 'washed'].map(filter => <MenuItem value={filter} key={filter}>{capitalize(filter)}</MenuItem>)}
        </Select>
      </FormControl>

      <Box sx={{
        p: 1, px: 2,
      }}>
        <FormControlLabel sx={{ width: '100%' }} control={<Switch checked={model.showLabel} onChange={(_, checked) => onUpdate({
          ...model, showLabel: checked,
        })} />} label={<>
          <Typography>{translate('overlays.clips.settings.cClipsLabel')}</Typography>
        </>}/>
      </Box>
    </Stack>

    <TextField
      label="Test clip URL"
      inputRef={testURLRef}
      defaultValue={'TrustworthyGlutenFreeWheelStinkyCheese-S8hBzfqZDZG6A_lE'}
      fullWidth
      variant="filled"
      InputProps={{ startAdornment: <InputAdornment position="start">https://clips.twitch.tv/</InputAdornment> }}
    />
    <Button sx={{ py: 1.5 }} fullWidth variant='contained' onClick={onSubmit}>Test</Button>
  </>;
};