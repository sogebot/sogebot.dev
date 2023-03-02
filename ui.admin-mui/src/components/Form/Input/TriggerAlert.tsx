import {
  Fade,
  FormControl, InputLabel, LinearProgress, ListSubheader, MenuItem, Select, Typography,
} from '@mui/material';
import { Alert } from '@sogebot/backend/dest/database/entity/alert';
import axios from 'axios';
import React from 'react';

import getAccessToken from '../../../getAccessToken';

type Props = {
  value: any,
  idx: number,
  onChange?: (value: any) => void,
};

const selectedItemRegex = /\$triggerAlert\((?<uuid>[0-9A-F]{8}(?:-[0-9A-F]{4}){3}-[0-9A-F]{12})\)/mi;

export const FormTriggerAlert: React.FC<Props> = ({ value, onChange }) => {
  const [ alerts, setAlerts ] = React.useState<Alert[] | null>(null);
  const [ loading, setLoading ] = React.useState(true);

  const parsedResponse = (value.response as string).match(selectedItemRegex);
  console.log({
    parsedResponse, response: value.response,
  });
  const [ selectedItemId, setSelectedItemId ] = React.useState<null | string>(parsedResponse?.groups ? parsedResponse.groups.uuid : null);

  React.useEffect(() => {
    axios.get<Alert[]>(`${JSON.parse(localStorage.server)}/api/registries/alerts/`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
      .then(res => setAlerts(res.data))
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    if (onChange) {
      onChange({
        ...value, response: `$triggerAlert(${selectedItemId})`,
      });
    }
  }, [ selectedItemId ]);

  return <>
    <FormControl fullWidth variant="filled" >
      <InputLabel id="type-select-label" shrink>Custom alert overlay</InputLabel>
      <Select
        label="Custom alert overlay"
        labelId="type-select-label"
        value={selectedItemId}
        displayEmpty
        onChange={(ev) => setSelectedItemId(ev.target.value)}
      >
        <MenuItem value=''>Please select item</MenuItem>
        {alerts?.filter(o => o.items.filter(b => b.type === 'custom').length > 0).map(alert => ([
          <ListSubheader>{alert.name} <Typography variant='caption' component='small'>{alert.id}</Typography></ListSubheader>,
          ...alert.items.filter(o => o.type === 'custom').map(item => <MenuItem key={item.id} value={item.id}>
            {item.title} <Typography variant='caption' component='small'>{item.id}</Typography>
          </MenuItem>),
        ]))}
      </Select>
      <Fade in={loading}><LinearProgress /></Fade>
    </FormControl>
  </>;
};