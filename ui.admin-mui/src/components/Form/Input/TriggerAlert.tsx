import { ExpandMoreTwoTone } from '@mui/icons-material';
import {
  Collapse,
  Divider,
  Fade,
  FormControl, InputAdornment, InputLabel, LinearProgress, ListSubheader, MenuItem, Select, Switch, TextField, Typography,
} from '@mui/material';
import { Alert } from '@sogebot/backend/dest/database/entity/alert';
import axios from 'axios';
import React, { useRef } from 'react';

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
    volume?: number
  }>(parsedOptions);

  const [ expand, setExpand ] = React.useState(options !== null);
  const refVolume = useRef<HTMLInputElement>();

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

    <Collapse in={expand}>
      <TextField
        inputRef={refVolume}
        fullWidth
        variant='filled'
        label="Volume"
        onKeyDown={(ev) => {
          const i = ev.shiftKey ? 10 : 1;
          if (ev.key === 'ArrowDown') {
            ev.preventDefault(); // disable accidental shiftkey selection
            setOptions(o => {
              const volume = Math.max((o?.volume ?? Number(refVolume.current ? refVolume.current!.value : 20)) - i, 0);
              const opts: NonNullable<typeof options> = o ?? {};
              return {
                ...opts, volume,
              };
            });
          }
          if (ev.key === 'ArrowUp') {
            ev.preventDefault();  // disable accidental shiftkey selection
            setOptions(o => {
              const volume = Math.min((o?.volume ?? Number(refVolume.current ? refVolume.current!.value : 20)) + i, 100);
              const opts: NonNullable<typeof options> = o ?? {};
              return {
                ...opts, volume,
              };
            });
          }
        }}
        value={options?.volume ?? (refVolume.current ? refVolume.current!.value : 20)}
        onChange={(ev) => {
          let val = Number(ev.target.value);
          if (!isNaN(val)) {
            if (val < 0) {
              val = 0;
            }
            if (val > 100) {
              val = 100;
            }
            setOptions(o => ({
              ...o, volume: val,
            }));
          }
        }}
        InputProps={{
          startAdornment: <>
            <InputAdornment position="start">
              <Switch checked={'volume' in (options ?? {})} onChange={(_, checked) => {
                if (checked) {
                  setOptions(o => ({
                    ...(o ?? {}), volume: Number(refVolume.current!.value),
                  }));
                } else {
                  setOptions(o => {
                    const opts = o ?? {};
                    delete opts.volume;
                    if (Object.keys(opts).length === 0) {
                      return null;
                    }
                    return opts;
                  });
                }
              }}/>
            </InputAdornment>
          </>,
          endAdornment: <>
            <InputAdornment position="end">
            %
            </InputAdornment>
          </>,
        }}
      />
    </Collapse>
    <Divider onClick={() => setExpand(!expand)}>
      <ExpandMoreTwoTone sx={{
        transform: expand ? 'rotate(-180deg)' : '', position: 'relative', top: '5px', transition: 'all 250ms',
      }}/>
      <Typography variant='overline' component='span' sx={{
        display: 'inline-block', width: '200px',
      }}>
        {expand ? 'Collapse' : 'Expand'} options
      </Typography>
      <ExpandMoreTwoTone sx={{
        transform: expand ? 'rotate(180deg)' : '', position: 'relative', top: '5px', transition: 'all 250ms',
      }}/>
    </Divider>

    <AdditionalGridFormResponse disableExecution={disableExecution} disableFilter={disableFilter} disablePermission={disablePermission} value={propsValue} onChange={setPropsValue}/>
  </>;
};