import { Checkbox, FormControl, FormControlLabel, FormGroup, InputAdornment, InputLabel, MenuItem, Select, TextField } from '@mui/material';
import React from 'react';

import { FormInputAdornmentCustomVariable } from './Adornment/CustomVariables';
import { FormNumericInput } from './Numeric';
import { FormOBSWebsocketSelect } from './OBSWebsocketSelect';
import { FormRewardInput } from './Reward';
import { FormInputTime } from './Time';
import { useTranslation } from '../../../hooks/useTranslation';

type Props = {
  attribute:            string,
  value:                any,
  additionalVariables?: string[],
  onChange:             (value: any) => void;
};

const EventsDefinitions: React.FC<Props> = (props) => {
  const { translate } = useTranslation();

  return <>
    {typeof props.value === 'boolean' && <FormGroup sx={{
      position: 'relative', top: '-0.5rem', pl: 2
    }}>
      <FormControlLabel control={<Checkbox checked={Boolean(props.value)} onChange={(_, checked) => props.onChange(checked)}/>} label={translate(`events.definitions.${props.attribute}.label`)} />
    </FormGroup>}

    {props.attribute === 'rewardId' && <FormRewardInput
      value={String(props.value)}
      onChange={value => props.onChange(value.id)}/>
    || props.attribute === 'taskId' && <FormOBSWebsocketSelect value={String(props.value)}
      onChange={value => props.onChange(value.id)}/>
    || props.attribute === 'timeoutType' && <FormControl variant="filled" fullWidth>
      <InputLabel id="demo-simple-select-standard-label">{translate(`events.definitions.${props.attribute}.label`)}</InputLabel>
      <Select
        label={translate(`events.definitions.${props.attribute}.label`)}
        value={props.value} onChange={ev => props.onChange(ev.target.value)}>
        <MenuItem value='normal'>Trigger command after every event</MenuItem>
        <MenuItem value='add'>Add timeout to previous event</MenuItem>
        <MenuItem value='reset'>Reset timeout</MenuItem>
      </Select>
    </FormControl>
    || props.attribute === 'timeout' && <FormInputTime
      fullWidth
      value={props.value}
      label={translate(`events.definitions.${props.attribute}.label`)}
      helperText={translate(`events.definitions.${props.attribute}.placeholder`)}
      onChange={val => props.onChange(val)}/>
    || typeof props.value === 'string' && <TextField
      fullWidth
      label={translate(`events.definitions.${props.attribute}.label`)}
      helperText={translate(`events.definitions.${props.attribute}.placeholder`)}
      value={props.value}
      onChange={ev => props.onChange(ev.currentTarget.value)}
      InputProps={['commandToRun', 'messageToSend'].includes(props.attribute) && {
        endAdornment: <InputAdornment position="end">
          <FormInputAdornmentCustomVariable additionalVariables={props.additionalVariables} onSelect={filter =>
            props.onChange(props.value + filter)}/>
        </InputAdornment>,
      } || undefined}/>
    || typeof props.value === 'number' && <FormNumericInput
      fullWidth
      min={0}
      label={translate(`events.definitions.${props.attribute}.label`)}
      helperText={translate(`events.definitions.${props.attribute}.placeholder`)}
      value={Number(props.value)}
      onChange={value => props.onChange(value)}/>}
  </>;
};

export { EventsDefinitions };