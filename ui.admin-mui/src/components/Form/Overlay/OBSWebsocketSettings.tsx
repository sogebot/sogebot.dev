import { KeyboardReturnTwoTone } from '@mui/icons-material';
import { Box, FormLabel, InputAdornment, Link, Stack, TextField } from '@mui/material';
import { OBSWebsocket } from '@sogebot/backend/dest/database/entity/overlay';
import { isEqual } from 'lodash';
import React from 'react';

import { useTranslation } from '../../../hooks/useTranslation';

type Props = {
  model:    OBSWebsocket;
  onUpdate: (value: OBSWebsocket) => void;
};

export const OBSWebsocketSettings: React.FC<Props> = ({ model, onUpdate }) => {
  const { translate } = useTranslation();

  const [ IPToAdd, setIPToAdd ] = React.useState('');

  const [tracedIP, setTracedIP ] = React.useState('');
  React.useEffect(() => {
    fetch('https://api64.ipify.org?format=json')
      .then((res) => res.json())
      .then((json) => setTracedIP(json.ip));
  }, []);

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
          helperText={tracedIP.length > 0 && <Link onClick={() => addNewIP(tracedIP)}>Click to add current IP {tracedIP}</Link>}
          variant="filled"
          onKeyDown={(ev) => {
            if (ev.key === 'Enter') {
              addNewIP(IPToAdd);
            }
          }}
          InputProps={{
            endAdornment:   <InputAdornment position='end'>Press <KeyboardReturnTwoTone sx={{ mx: 0.5 }}/> to add</InputAdornment>,
          }}
          onChange={(ev) => setIPToAdd(ev.currentTarget.value)}
        />
      </Box>
    </Stack>
  </>;
};