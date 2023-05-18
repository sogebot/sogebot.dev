import { TextField } from '@mui/material';
import { URL } from '@sogebot/backend/dest/database/entity/overlay';
import React from 'react';

type Props = {
  model: URL;
  onUpdate: (value: URL) => void;
};

export const UrlSettings: React.FC<Props> = ({ model, onUpdate }) => {
  return <>
    <TextField
      label={'URL'}
      fullWidth
      variant="filled"
      value={model.url}
      onChange={(ev) => {
        onUpdate({
          ...model, url: ev.currentTarget.value,
        });
      }}
    />
  </>;
};