import { InputAdornment, Stack, TextField } from '@mui/material';
import React from 'react';

import { useTranslation } from '../../../hooks/useTranslation';
import { FormNumericInput } from '../Input/Numeric';

type Props = {
  model: {
    name?:    string;
    rotation: number;
    width:    number;
    height:   number;
    alignX:   number;
    alignY:   number;
  };
  onUpdate:  (path: string, value: any) => void;
  children?: React.ReactNode
};

export const Settings: React.FC<Props> = ({ children, model, onUpdate }) => {
  const { translate } = useTranslation();

  return <>
    <Stack spacing={0.5}>
      {'name' in model && <TextField
        label={translate('name')}
        fullWidth
        variant="filled"
        value={model.name || ''}
        onChange={(ev) => onUpdate('name', ev.currentTarget.value ?? '')}
      />}
      <FormNumericInput
        label={'Rotate'}
        fullWidth
        variant="filled"
        value={model.rotation ?? 0}
        InputProps={{ endAdornment: <InputAdornment position='end'>deg</InputAdornment> }}
        onChange={(val) => {
          onUpdate('rotation',  val);
        }}
      />

      <Stack direction='row' spacing={0.5}>
        <FormNumericInput
          label={'Width'}
          fullWidth
          variant="filled"
          value={model.width ?? 0}
          InputProps={{ endAdornment: <InputAdornment position='end'>px</InputAdornment> }}
          onChange={(val) => {
            onUpdate('width',  val);
          }}
        />
        <FormNumericInput
          label={'Height'}
          fullWidth
          variant="filled"
          value={model.height ?? 0}
          InputProps={{ endAdornment: <InputAdornment position='end'>px</InputAdornment> }}
          onChange={(val) => {
            onUpdate('height',  val);
          }}
        />
      </Stack>

      <Stack direction='row' spacing={0.5}>
        <FormNumericInput
          label={'X'}
          fullWidth
          variant="filled"
          value={model.alignX ?? 0}
          InputProps={{ endAdornment: <InputAdornment position='end'>px</InputAdornment> }}
          onChange={(val) => {
            onUpdate('alignX',  val);
          }}
        />
        <FormNumericInput
          label={'Y'}
          fullWidth
          variant="filled"
          value={model.alignY ?? 0}
          InputProps={{ endAdornment: <InputAdornment position='end'>px</InputAdornment> }}
          onChange={(val) => {
            onUpdate('alignY',  val);
          }}
        />
      </Stack>
      {children}
    </Stack>
  </>;
};