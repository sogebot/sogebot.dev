import { Fade, FormControl, InputLabel, LinearProgress, MenuItem, Select, Stack, Typography } from '@mui/material';
import { Alert } from '@sogebot/backend/dest/database/entity/alert';
import { AlertsRegistry } from '@sogebot/backend/dest/database/entity/overlay';
import axios from 'axios';
import React from 'react';

import getAccessToken from '../../../getAccessToken';

type Props = {
  model:    AlertsRegistry;
  onUpdate: (value: AlertsRegistry) => void;
};

export const AlertsRegistrySettings: React.FC<Props> = ({ model, onUpdate }) => {
  const [ alerts, setAlerts ] = React.useState<Alert[] | null>(null);
  const [ loading, setLoading ] = React.useState(true);

  React.useEffect(() => {
    axios.get<Alert[]>(`${JSON.parse(localStorage.server)}/api/registries/alerts/`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
      .then(res => setAlerts(res.data))
      .finally(() => setLoading(false));
  }, []);

  return <>
    <Stack spacing={0.5}>
      <FormControl fullWidth variant="filled" >
        <InputLabel id="type-select-label" shrink>Alert overlay</InputLabel>
        <Select
          label="Alert overlay"
          labelId="type-select-label"
          value={model.id}
          displayEmpty
          onChange={(ev) => onUpdate({
            ...model, id: ev.target.value,
          })}
        >
          <MenuItem value=''>Please select item</MenuItem>
          {alerts?.map(alert => ([
            <MenuItem value={alert.id} key={alert.id}>{alert.name} <Typography variant='caption' component='small'>{alert.id}</Typography></MenuItem>,
          ]))}
        </Select>
        <Fade in={loading}><LinearProgress /></Fade>
      </FormControl>
    </Stack>
  </>;
};