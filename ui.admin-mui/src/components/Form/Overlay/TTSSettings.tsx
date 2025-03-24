import { TTS } from '@entity/overlay';
import { Checkbox, FormControlLabel, FormGroup, Stack } from '@mui/material';
import React from 'react';

import { useTranslation } from '../../../hooks/useTranslation';
import { AccordionTTS } from '../../Accordion/TTS';

type Props = {
  model:    TTS;
  onUpdate: (value: TTS) => void;
};

export const TTSSettings: React.FC<Props> = ({ model, onUpdate }) => {
  const [ open, setOpen ] = React.useState('');
  const { translate } = useTranslation();

  return <>
    <Stack spacing={0.5}>
      <FormGroup sx={{
        pt: 1, width: '100%',
      }}>
        <FormControlLabel
          control={<Checkbox checked={model.triggerTTSByHighlightedMessage || false}/>}
          onChange={(_, checked) => onUpdate({
            ...model, triggerTTSByHighlightedMessage: checked,
          })}
          label={translate('overlays.texttospeech.settings.triggerTTSByHighlightedMessage')} />
      </FormGroup>
      <AccordionTTS
        model={model}
        open={open}
        onOpenChange={(val) => setOpen(val)}
        onChange={(val) => {
          onUpdate({
            ...model, ...val,
          });
        }}/>
    </Stack>
  </>;
};