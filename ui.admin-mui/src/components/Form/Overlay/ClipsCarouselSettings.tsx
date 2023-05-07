import {
  Box,
  Divider,
  FormControl,
  FormLabel,
  InputLabel,
  MenuItem,
  Select,
  Slider,
  Stack,
  TextField,
} from '@mui/material';
import { ClipsCarousel } from '@sogebot/backend/dest/database/entity/overlay';
import React from 'react';

import { useTranslation } from '../../../hooks/useTranslation';

type Props = {
  model: ClipsCarousel;
  onUpdate: (value: ClipsCarousel) => void;
};

export const ClipsCarouselSettings: React.FC<Props> = ({ model, onUpdate }) => {
  const { translate } = useTranslation();

  return <>
    <Divider/>

    <Stack spacing={0.5}>
      <FormLabel sx={{ marginTop: '30px' }}>{translate('systems.songs.settings.volume')}</FormLabel>
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

      <TextField
        label={translate('overlays.clipscarousel.settings.cClipsCustomPeriodInDays')}
        fullWidth
        variant="filled"
        value={model.customPeriod}
        inputProps={{ min: 1 }}
        type="number"
        onChange={(ev) => {
          if (!isNaN(Number(ev.currentTarget.value))) {
            onUpdate({
              ...model, customPeriod: Number(ev.currentTarget.value),
            });
          }
        }}
      />

      <TextField
        label={translate('overlays.clipscarousel.settings.cClipsNumOfClips')}
        fullWidth
        variant="filled"
        value={model.numOfClips}
        inputProps={{ min: 1 }}
        type="number"
        onChange={(ev) => {
          if (!isNaN(Number(ev.currentTarget.value))) {
            onUpdate({
              ...model, numOfClips: Number(ev.currentTarget.value),
            });
          }
        }}
      />

      <FormControl fullWidth variant="filled" >
        <InputLabel id="type-select-label">{translate('overlays.emotes.settings.cEmotesAnimation')}</InputLabel>
        <Select
          MenuProps={{ PaperProps: { sx: { maxHeight: 200 } } }}
          label={translate('overlays.emotes.settings.cEmotesAnimation')}
          labelId="type-select-label"
          value={model.animation}
          onChange={(ev) => onUpdate({
            ...model, animation: ev.target.value ?? 'slide',
          })}
        >
          <MenuItem value="fade" key="fade">fade</MenuItem>
          <MenuItem value="slide" key="slide">slide</MenuItem>
        </Select>
      </FormControl>

      {model.animation === 'slide' && <TextField
        label={'Space between slides'}
        fullWidth
        variant="filled"
        value={model.spaceBetween}
        inputProps={{ min: 1 }}
        type="number"
        onChange={(ev) => {
          if (!isNaN(Number(ev.currentTarget.value))) {
            onUpdate({
              ...model, spaceBetween: Number(ev.currentTarget.value),
            });
          }
        }}
      />}
    </Stack>
  </>;
};