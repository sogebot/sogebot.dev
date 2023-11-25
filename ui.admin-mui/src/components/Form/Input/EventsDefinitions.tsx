import { Checkbox, FormControl, FormControlLabel, FormGroup, InputAdornment, InputLabel, MenuItem, Select, TextField } from '@mui/material';
import React from 'react';

import { FormInputAdornmentCustomVariable } from './Adornment/CustomVariables';
import { FormNumericInput } from './Numeric';
import { FormOBSWebsocketSelect } from './OBSWebsocketSelect';
import { FormRewardInput } from './Reward';
import { FormInputTime } from './Time';
import { useTranslation } from '../../../hooks/useTranslation';
import { useValidator } from '../../../hooks/useValidatorZod';

type Props = {
  attribute:            string,
  value:                any,
  additionalVariables?: string[],
  onChange:             (value: any) => void;
  error:                ReturnType<typeof useValidator>['propsError'],
};

const EventsDefinitions: React.FC<Props> = (props) => {
  const { translate } = useTranslation();

  const lastAttribute = props.attribute.split('.').pop() as string;

  return <>
    {typeof props.value === 'boolean' && <FormGroup sx={{
      position: 'relative', top: '-0.5rem', pl: 2
    }}>
      <FormControlLabel control={<Checkbox checked={Boolean(props.value)} onChange={(_, checked) => props.onChange(checked)}/>} label={translate(`events.definitions.${lastAttribute}.label`)} />
    </FormGroup>}
    
    {lastAttribute === 'rewardId' && <FormRewardInput
      error={props.error(props.attribute)}
      value={String(props.value)}
      onChange={value => props.onChange(value.id)}/>
    || lastAttribute === 'taskId' && <FormOBSWebsocketSelect
      error={props.error(props.attribute)}
      value={String(props.value)}
      onChange={value => props.onChange(value.id)}/>
    || lastAttribute === 'durationOfCommercial' && <FormControl variant="filled" fullWidth>
      <InputLabel id="demo-simple-select-standard-label">{translate(`events.definitions.${lastAttribute}.label`)}</InputLabel>
      <Select
        label={translate(`events.definitions.${lastAttribute}.label`)}
        value={props.value} onChange={ev => props.onChange(Number(ev.target.value))}>
        {[30, 60, 90, 120, 150, 180].map(val => <MenuItem value={val}>{val}s</MenuItem>)}
      </Select>
    </FormControl>
    || lastAttribute === 'timeoutType' && <FormControl variant="filled" fullWidth>
      <InputLabel id="demo-simple-select-standard-label">{translate(`events.definitions.${lastAttribute}.label`)}</InputLabel>
      <Select
        label={translate(`events.definitions.${lastAttribute}.label`)}
        value={props.value} onChange={ev => props.onChange(ev.target.value)}>
        <MenuItem value='normal'>Trigger command after every event</MenuItem>
        <MenuItem value='add'>Add timeout to previous event</MenuItem>
        <MenuItem value='reset'>Reset timeout</MenuItem>
      </Select>
    </FormControl>
    || lastAttribute === 'timeout' && <FormInputTime
      fullWidth
      value={props.value}
      label={translate(`events.definitions.${lastAttribute}.label`)}
      helperText={translate(`events.definitions.${lastAttribute}.placeholder`)}
      onChange={val => props.onChange(val)}/>
    || typeof props.value === 'string' && <TextField
      {...props.error(props.attribute)}
      fullWidth
      label={translate(`events.definitions.${lastAttribute}.label`)}
      value={props.value}
      onChange={ev => props.onChange(ev.currentTarget.value)}
      helperText={props.error(props.attribute).helperText ? props.error(props.attribute).helperText : translate(`events.definitions.${lastAttribute}.placeholder`)}
      InputProps={['commandToRun', 'messageToSend'].includes(lastAttribute) && {
        endAdornment: <InputAdornment position="end">
          <FormInputAdornmentCustomVariable additionalVariables={props.additionalVariables} onSelect={filter =>
            props.onChange(props.value + filter)}/>
        </InputAdornment>,
      } || undefined}/>
    || typeof props.value === 'number' && <FormNumericInput
      {...props.error(props.attribute)}
      fullWidth
      min={0}
      label={translate(`events.definitions.${lastAttribute}.label`)}
      helperText={props.error(props.attribute).helperText ? props.error(props.attribute).helperText : translate(`events.definitions.${lastAttribute}.placeholder`)}
      value={Number(props.value)}
      onChange={value => props.onChange(value)}/>}
  </>;
};

export { EventsDefinitions };