import { ExpandMoreTwoTone } from '@mui/icons-material';
import { Accordion, AccordionDetails, AccordionSummary, InputAdornment, Stack, TextField, Typography } from '@mui/material';
import { Overlay } from '@sogebot/backend/dest/database/entity/overlay';
import React from 'react';

type Props = {
  model:    Overlay['canvas'];
  onUpdate: (value: Overlay['canvas']) => void;
};

export const Canvas: React.FC<Props> = ({ model, onUpdate }) => {
  const [ open, setOpen ] = React.useState(false);

  return <Accordion expanded={open}>
    <AccordionSummary
      expandIcon={<ExpandMoreTwoTone />}
      onClick={() => setOpen(o => !o)}
      aria-controls="panel1a-content"
      id="panel1a-header"
    >
      <Typography>Canvas</Typography>
    </AccordionSummary>
    <AccordionDetails>
      <Stack direction='row' spacing={0.5}>
        <TextField
          label={'Width'}
          fullWidth
          variant="filled"
          value={model.width}
          InputProps={{ endAdornment: <InputAdornment position='end'>px</InputAdornment> }}
          type="number"
          onChange={(ev) => {
            if (!isNaN(Number(ev.currentTarget.value))) {
              onUpdate({
                ...model, width: Number(ev.currentTarget.value),
              });
            }
          }}
        />
        <TextField
          label={'Height'}
          fullWidth
          variant="filled"
          value={model.height}
          InputProps={{ endAdornment: <InputAdornment position='end'>px</InputAdornment> }}
          type="number"
          onChange={(ev) => {
            if (!isNaN(Number(ev.currentTarget.value))) {

              onUpdate({
                ...model, height: Number(ev.currentTarget.value),
              });
            }
          }}
        />
      </Stack>
    </AccordionDetails>
  </Accordion>;
};