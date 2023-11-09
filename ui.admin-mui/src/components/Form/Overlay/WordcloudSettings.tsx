import { InputAdornment, MenuItem, Select, Stack, TextField } from '@mui/material';
import { Wordcloud } from '@sogebot/backend/dest/database/entity/overlay';
import React from 'react';

import { AccordionFont } from '../../Accordion/Font';

type Props = {
  model:    Wordcloud;
  onUpdate: (value: Wordcloud) => void;
};

export const WordcloudSettings: React.FC<Props> = ({ model, onUpdate }) => {
  const [ open, setOpen ] = React.useState('');

  return <>
    <Stack spacing={0.5}>
      <TextField
        label={'Fade out interval'}
        fullWidth
        variant="filled"
        value={model.fadeOutInterval}
        inputProps={{ min: 1 }}
        type="number"
        InputProps={{
          endAdornment: <InputAdornment position='end'>
            <Select variant='filled' value={model.fadeOutIntervalType} sx={{ '&.MuiInputBase-root': { backgroundColor: 'transparent !important' } }}
              onChange={(ev) => onUpdate({
                ...model, fadeOutIntervalType: ev.target.value as 'seconds',
              })}>
              <MenuItem value='seconds'>seconds</MenuItem>
              <MenuItem value='minutes'>minutes</MenuItem>
              <MenuItem value='hours'>hours</MenuItem>
            </Select>
          </InputAdornment>,
        }}
        onChange={(ev) => {
          if (!isNaN(Number(ev.currentTarget.value))) {
            onUpdate({
              ...model, fadeOutInterval: Number(ev.currentTarget.value),
            });
          }
        }}
      />
    </Stack>

    <AccordionFont
      disableExample
      label='Word Font'
      accordionId='wordFont'
      model={model.wordFont}
      open={open}
      onOpenChange={(val) => setOpen(val)}
      onChange={(val) => {
        onUpdate({
          ...model, wordFont: val,
        });
      }}/>
  </>;
};