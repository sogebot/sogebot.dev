import { Checkbox, FormControlLabel, FormGroup, TextField } from '@mui/material';
import React from 'react';

import { FormNumericInput } from './Numeric';
import { FormRewardInput } from './Reward';
import { useTranslation } from '../../../hooks/useTranslation';

type Props = {
  attribute: string,
  value:     any,
  onChange:  (value: any) => void;
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
      onChange={value => props.onChange(value)}/>}

    {typeof props.value === 'string' && <TextField
      fullWidth
      label={translate(`events.definitions.${props.attribute}.label`)}
      helperText={translate(`events.definitions.${props.attribute}.placeholder`)}
      value={props.value}
      onChange={ev => props.onChange(ev.currentTarget.value)}/>}

    {typeof props.value === 'number' && <FormNumericInput
      fullWidth
      min={0}
      label={translate(`events.definitions.${props.attribute}.label`)}
      helperText={translate(`events.definitions.${props.attribute}.placeholder`)}
      value={Number(props.value)}
      onChange={value => props.onChange(value)}/>}
  </>;
};

export { EventsDefinitions };