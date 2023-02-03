import { ExpandMoreTwoTone } from '@mui/icons-material';
import {
  Accordion, AccordionDetails, AccordionSummary, Stack, TextField, Typography,
} from '@mui/material';
import { Overlay } from '@sogebot/backend/dest/database/entity/overlay';
import React from 'react';

import { useTranslation } from '../../../hooks/useTranslation';

type Props = {
  model: Overlay['items'][number];
  onUpdate: (path: string, value: any) => void;
  children: React.ReactNode
};

export const Settings: React.FC<Props> = ({ children, model, onUpdate }) => {
  const [ open, setOpen ] = React.useState(false);
  const { translate } = useTranslation();

  return <Accordion expanded={open}>
    <AccordionSummary
      expandIcon={<ExpandMoreTwoTone />}
      onClick={() => setOpen(o => !o)}
      aria-controls="panel1a-content"
      id="panel1a-header"
    >
      <Typography>Settings</Typography>
    </AccordionSummary>
    <AccordionDetails>
      <Stack spacing={0.5}>
        <TextField
          label={translate('name')}
          fullWidth
          variant="filled"
          value={model.name || ''}
          onChange={(ev) => onUpdate('name', ev.currentTarget.value ?? '')}
        />
        <Stack direction='row' spacing={0.5}>
          <TextField
            label={'Width'}
            fullWidth
            variant="filled"
            value={model.width}
            InputProps={{ endAdornment: 'px' }}
            type="number"
            onChange={(ev) => {
              if (!isNaN(Number(ev.currentTarget.value))) {
                onUpdate('width',  Number(ev.currentTarget.value));
              }
            }}
          />
          <TextField
            label={'Height'}
            fullWidth
            variant="filled"
            value={model.height}
            InputProps={{ endAdornment: 'px' }}
            type="number"
            onChange={(ev) => {
              if (!isNaN(Number(ev.currentTarget.value))) {
                onUpdate('height',  Number(ev.currentTarget.value));
              }
            }}
          />
        </Stack>

        <Stack direction='row' spacing={0.5}>
          <TextField
            label={'X'}
            fullWidth
            variant="filled"
            value={model.alignX}
            InputProps={{ endAdornment: 'px' }}
            type="number"
            onChange={(ev) => {
              if (!isNaN(Number(ev.currentTarget.value))) {
                onUpdate('alignX',  Number(ev.currentTarget.value));
              }
            }}
          />
          <TextField
            label={'Y'}
            fullWidth
            type="number"
            variant="filled"
            value={model.alignY}
            InputProps={{ endAdornment: 'px' }}
            onChange={(ev) => {
              if (!isNaN(Number(ev.currentTarget.value))) {
                onUpdate('alignY',  Number(ev.currentTarget.value));
              }
            }}
          />
        </Stack>
      </Stack>

      {children}
    </AccordionDetails>
  </Accordion>;
};