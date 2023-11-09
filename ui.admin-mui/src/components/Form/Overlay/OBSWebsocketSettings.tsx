import { KeyboardReturnTwoTone } from '@mui/icons-material';
import { Box, FormLabel, InputAdornment, Stack, TextField } from '@mui/material';
import { OBSWebsocket } from '@sogebot/backend/dest/database/entity/overlay';
import { isEqual } from 'lodash';
import React from 'react';
import { IMaskInput } from 'react-imask';

import { useTranslation } from '../../../hooks/useTranslation';

type Props = {
  model:    OBSWebsocket;
  onUpdate: (value: OBSWebsocket) => void;
};

interface CustomProps {
  onChange: (event: { currentTarget: { value: string } }) => void;
  name:     string;
}
const IPFormatCustom = React.forwardRef<HTMLElement, CustomProps>(
  function IPFormatCustom(props, ref) {
    const { onChange, ...other } = props;
    return (
      <IMaskInput
        {...other}
        mask="0[00].0[00].0[00].0[00]"
        inputRef={ref as any}
        onAccept={(value: any) => onChange({ currentTarget: { value } })}
        overwrite
      />
    );
  },
);

export const OBSWebsocketSettings: React.FC<Props> = ({ model, onUpdate }) => {
  const { translate } = useTranslation();

  const [ IPToAdd, setIPToAdd ] = React.useState('');

  const modelRef = React.useRef(model);
  React.useEffect(() => {
    modelRef.current = model;
    if (!isEqual(model.allowedIPs, model.allowedIPs.filter(Boolean))) {
      onUpdate({
        ...model,
        allowedIPs: model.allowedIPs.filter(Boolean),
      });
    }
  }, [ model ]);

  const addNewIP = (newItem: typeof IPToAdd) => {
    const allowedIPs = [...modelRef.current.allowedIPs, newItem];
    onUpdate({
      ...modelRef.current,
      allowedIPs,
    });

    setIPToAdd('');
  };

  return <>
    <Stack spacing={0.5}>
      <TextField
        label={'Port'}
        fullWidth
        variant="filled"
        value={model.port}
        onChange={(ev) => {
          onUpdate({
            ...model, port: ev.currentTarget.value,
          });
        }}
      />
      <TextField
        label={translate('integrations.obswebsocket.settings.password')}
        fullWidth
        variant="filled"
        type='password'
        value={model.password}
        helperText="Authentication won't be used if password is empty"
        onChange={(ev) => {
          onUpdate({
            ...model, password: ev.currentTarget.value,
          });
        }}
      />

      <Box>
        <FormLabel>{translate('registry.overlays.allowedIPs.name')}</FormLabel>
        {model.allowedIPs.map((val, idx) => <TextField
          key={`item-${idx}`}
          id={`item-${idx}`}
          fullWidth
          hiddenLabel
          value={val}
          InputProps={{ inputComponent: IPFormatCustom as any }}
          variant="filled"
          onChange={(ev) => {
            const allowedIPs = [...model.allowedIPs];
            allowedIPs[idx] = ev.currentTarget.value;
            onUpdate({
              ...model, allowedIPs,
            });
          }
          }
        />)}
        <TextField
          fullWidth
          hiddenLabel
          value={IPToAdd}
          placeholder='192.168.0.1'
          variant="filled"
          onKeyDown={(ev) => {
            if (ev.key === 'Enter') {
              addNewIP(IPToAdd);
            }
          }}
          InputProps={{
            endAdornment:   <InputAdornment position='end'>Press <KeyboardReturnTwoTone sx={{ mx: 0.5 }}/> to add</InputAdornment>,
            inputComponent: IPFormatCustom as any,
          }}
          onChange={(ev) => setIPToAdd(ev.currentTarget.value)}
        />
      </Box>
    </Stack>
  </>;
};