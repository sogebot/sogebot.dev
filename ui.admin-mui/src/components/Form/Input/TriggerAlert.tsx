import {
  Fade,
  FormControl, InputLabel, LinearProgress, ListSubheader, MenuItem, Select, TextField, Typography,
} from '@mui/material';
import { Alert } from '@sogebot/backend/dest/database/entity/alert';
import axios from 'axios';
import React, {  } from 'react';

import { AdditionalGridFormResponse } from './Response';
import getAccessToken from '../../../getAccessToken';

type Props = {
  value: any,
  idx: number,
  onChange?: (value: any) => void,
  disablePermission?: boolean,
  disableFilter?: boolean,
  disableExecution?: boolean,
};

const selectedItemRegex = /\$triggerAlert\((?<uuid>[0-9A-F]{8}(?:-[0-9A-F]{4}){3}-[0-9A-F]{12}),? ?(?<options>.*)?\)/mi;

export const FormTriggerAlert: React.FC<Props> = ({ value, onChange,
  disablePermission,
  disableFilter,
  disableExecution }) => {
  const [ alerts, setAlerts ] = React.useState<Alert[] | null>(null);
  const [ loading, setLoading ] = React.useState(true);
  const [ propsValue, setPropsValue ] = React.useState(value);

  const parsedResponse = (value.response as string).match(selectedItemRegex);
  const parsedOptions = parsedResponse?.groups && parsedResponse?.groups.options
    ? JSON.parse(Buffer.from(parsedResponse?.groups.options, 'base64').toString())
    : null;

  const [ selectedItemId, setSelectedItemId ] = React.useState<null | string>(parsedResponse?.groups ? parsedResponse.groups.uuid : null);
  const [ options, setOptions ] = React.useState<null | {
    volume: number
  }>(parsedOptions);

  React.useEffect(() => {
    axios.get<Alert[]>(`${JSON.parse(localStorage.server)}/api/registries/alerts/`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
      .then(res => setAlerts(res.data))
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    if (onChange) {
      onChange({
        ...propsValue,
        response: options
          ? `$triggerAlert(${selectedItemId}, ${Buffer.from(JSON.stringify(options)).toString('base64')})`
          : `$triggerAlert(${selectedItemId})`,
      });
    }
  }, [ selectedItemId, options, propsValue ]);

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

    <TextField
      fullWidth
      variant='filled'
      label="Volume"
      value={options?.volume ?? 20}
      onChange={(ev) => setOptions(o => ({
        ...o, volume: Number(ev.target.value),
      }))}
    />

    <AdditionalGridFormResponse disableExecution={disableExecution} disableFilter={disableFilter} disablePermission={disablePermission} value={propsValue} onChange={setPropsValue}/>
  </>;
};