import {
  Box,
  FormControlLabel,
  FormHelperText,
  Stack,
  Switch,
} from '@mui/material';
import { DateTimeValidationError } from '@mui/x-date-pickers';
import { DateTimeField } from '@mui/x-date-pickers/DateTimeField';
import { Marathon } from '@sogebot/backend/dest/database/entity/overlay';
import React from 'react';

import { AccordionTimeAdditions } from './MarathonSettings/TimeAdditions';
import { dayjs } from '../../../helpers/dayjsHelper';
import { AccordionFont } from '../../Accordion/Font';

type Props = {
  model: Marathon;
  onUpdate: (value: Marathon) => void;
};

export const MarathonSettings: React.FC<Props> = ({ model, onUpdate }) => {
  const [ open, setOpen ] = React.useState('');

  const [ invalidDateError, setInvalidDateError ] = React.useState<DateTimeValidationError | null>(null);

  const errorMessage = React.useMemo(() => {
    switch (invalidDateError) {
      case 'invalidDate': {
        return 'Your date is not valid';
      }

      default: {
        return '';
      }
    }
  }, [invalidDateError]);

  return <>
    <Stack spacing={0.5}>
      <FormHelperText>To adjust time, use quickactions button</FormHelperText>

      <DateTimeField
        label="Maximum end time"
        defaultValue={model.maxEndTime ? dayjs(model.maxEndTime) : null}
        onChange={(newValue: any) => {
          const value = newValue?.$d?.getTime();
          onUpdate({
            ...model, maxEndTime: isNaN(value) ? null : value,
          });
          if (isNaN(value) ? null : value) {
            setInvalidDateError(null);
          }
        }}
        onError={(newError, value) => {
          setInvalidDateError(newError);
          if (value) {
            if (newError) {
              onUpdate({
                ...model, maxEndTime: null,
              });
            }
          }
        }}
        slotProps={{ textField: { helperText: errorMessage } }}
      />

      <Box sx={{
        p: 1, px: 2,
      }}>
        <FormControlLabel sx={{
          width: '100%', pt: 1,
        }} control={<Switch checked={model.disableWhenReachedZero} onChange={(_, checked) => onUpdate({
          ...model, disableWhenReachedZero: checked,
        })} />} label='Disable when reached zero'/>
        <FormControlLabel sx={{
          width: '100%', pt: 1,
        }} control={<Switch checked={model.showProgressGraph} onChange={(_, checked) => onUpdate({
          ...model, showProgressGraph: checked,
        })} />} label='Show progress graph'/>
        <FormControlLabel sx={{
          width: '100%', pt: 1,
        }} control={<Switch checked={model.showMilliseconds} onChange={(_, checked) => onUpdate({
          ...model, showMilliseconds: checked,
        })} />} label='Show milliseconds'/>
      </Box>
      <AccordionTimeAdditions
        model={model.values}
        open={open}
        onClick={(val) => typeof val === 'string' && setOpen(val)}
        onChange={(val) => {
          onUpdate({
            ...model, values: val,
          });
        }}/>
      <AccordionFont
        disableExample
        label='Marathon font'
        accordionId='marathonFont'
        model={model.marathonFont}
        open={open}
        onClick={(val) => typeof val === 'string' && setOpen(val)}
        onChange={(val) => {
          onUpdate({
            ...model, marathonFont: val,
          });
        }}/>
    </Stack>
  </>;
};