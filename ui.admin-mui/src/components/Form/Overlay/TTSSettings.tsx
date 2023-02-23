import {
  Divider,
  Stack,
} from '@mui/material';
import { TTS } from '@sogebot/backend/dest/database/entity/overlay';
import React from 'react';

import { AccordionTTS } from '../../Accordion/TTS';

type Props = {
  model: TTS;
  onUpdate: (value: TTS) => void;
};

export const TTSSettings: React.FC<Props> = ({ model, onUpdate }) => {
  const [ open, setOpen ] = React.useState('');

  return <>
    <Divider/>

    <Stack spacing={0.5} sx={{ pt: 2 }}>
      <AccordionTTS
        model={model}
        open={open}
        onClick={(val) => typeof val === 'string' && setOpen(val)}
        onChange={(val) => {
          onUpdate({
            ...model, ...val,
          });
        }}/>
    </Stack>
  </>;
};