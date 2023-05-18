import {
  Box,
  Button,
  Divider,
  FormControlLabel,
  FormLabel,
  InputAdornment,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { Countdown } from '@sogebot/backend/dest/database/entity/overlay';
import { isEqual } from 'lodash';
import React from 'react';
import { usePreviousImmediate } from 'rooks';

import {
  DAY, HOUR, MINUTE, SECOND,
} from '../../../constants';
import { timestampToObject } from '../../../helpers/getTime';
import { useAppDispatch, useAppSelector } from '../../../hooks/useAppDispatch';
import { selectOverlayCountdown, setCountdownShow } from '../../../store/overlaySlice';
import theme from '../../../theme';
import { AccordionFont } from '../../Accordion/Font';

type Props = {
  id: string;
  model: Countdown;
  onUpdate: (value: Countdown) => void;
};

export const CountdownSettings: React.FC<Props> = ({ model, onUpdate, id }) => {
  const [ open, setOpen ] = React.useState('');
  const dispatch = useAppDispatch();
  const countdowns = useAppSelector(selectOverlayCountdown);

  React.useEffect(() => {
    setTime(timestampToObject(model.currentTime));
  }, []);

  const [ time, setTime ] = React.useState({
    days: 0, hours: 0, minutes: 10, seconds: 0,
  });
  const prevTime = usePreviousImmediate(time);

  React.useEffect(() => {
    if (prevTime && !isEqual(time, prevTime)) {
      onUpdate({
        ...model,
        currentTime: time.days * DAY + time.hours * HOUR + time.minutes * MINUTE + time.seconds * SECOND,
        time:        time.days * DAY + time.hours * HOUR + time.minutes * MINUTE + time.seconds * SECOND,
      });
    }
  }, [time, prevTime, model]);

  const handleTimeChange = <T extends keyof typeof time>(input: typeof time, key: T, value: string) => {
    let numberVal = Number(value);

    if (key === 'seconds' && numberVal < 0) {
      if (input.minutes > 0 || input.hours > 0 || input.days > 0) {
        const updatedInput = {
          ...input, [key]: 59,
        };
        handleTimeChange(updatedInput, 'minutes', String(input.minutes - 1));
        return;
      } else {
        numberVal = 0;
      }
    }

    if (key === 'minutes' && numberVal < 0) {
      if (input.hours > 0 || input.days > 0) {
        const updatedInput = {
          ...input, [key]: 59,
        };
        handleTimeChange(updatedInput, 'hours', String(input.hours - 1));
        return;
      } else {
        numberVal = 0;
      }
    }

    if (key === 'hours' && numberVal < 0) {
      if (input.days > 0) {
        const updatedInput = {
          ...input, [key]: 23,
        };
        handleTimeChange(updatedInput, 'days', String(input.days - 1));
        return;
      } else {
        numberVal = 0;
      }
    }

    if ((key === 'seconds' || key === 'minutes') && numberVal >= 60) {
      const updatedInput = {
        ...input, [key]: 0,
      };
      if(key === 'seconds') {
        handleTimeChange(updatedInput, 'minutes', String(input.minutes + 1));
      } else {
        handleTimeChange(updatedInput, 'hours', String(input.hours + 1));
      }
      return;
    }

    if (key === 'hours' && numberVal >= 24) {
      const updatedInput = {
        ...input, [key]: 0,
      };
      handleTimeChange(updatedInput, 'days', String(input.days + 1));
      return;

    }

    if (numberVal < 0) {
      numberVal = 0;
    }

    setTime({
      ...input, [key]: numberVal,
    });
  };

  return <>
    <Divider variant='middle'/>
    <Stack direction='row' alignItems={'baseline'}>
      <FormLabel sx={{ width: '100%' }}>Show example of</FormLabel>
      <Button
        fullWidth
        onClick={() => dispatch(setCountdownShow({ [id]: 'time' }))}
        sx={{ backgroundColor: !countdowns[id] || countdowns[id] === 'time' ? `${theme.palette.primary.main}55` : undefined }}>
        Time
      </Button>
      <Button
        disabled={!model.showMessageWhenReachedZero}
        fullWidth
        onClick={() => dispatch(setCountdownShow({ [id]: 'text' }))}
        sx={{ backgroundColor: countdowns[id] === 'text' ? `${theme.palette.primary.main}55` : undefined }}>
            Text
      </Button>
    </Stack>
    <Divider variant='middle'/>
    <Stack spacing={0.5}>
      <Stack direction='row'>
        <TextField
          fullWidth
          variant="filled"
          type="number"
          value={time.days}
          required
          label={'Days'}
          onChange={(event) => handleTimeChange(time, 'days', event.target.value)}
          sx={{
            '& .MuiInputBase-root': {
              borderRadius: 0, borderLeftRightRadius: '4px',
            },
          }}
        />
        <TextField
          fullWidth
          variant="filled"
          type="number"
          value={time.hours}
          required
          label={'Hours'}
          onChange={(event) => handleTimeChange(time, 'hours', event.target.value)}
          sx={{ '& .MuiInputBase-root': { borderRadius: 0 } }}
        />
        <TextField
          fullWidth
          variant="filled"
          type="number"
          value={time.minutes}
          required
          label={'Minutes'}
          onChange={(event) => handleTimeChange(time, 'minutes', event.target.value)}
          sx={{ '& .MuiInputBase-root': { borderRadius: 0 } }}
        />
        <TextField
          fullWidth
          variant="filled"
          type="number"
          value={time.seconds}
          required
          label={'Seconds'}
          onChange={(event) => handleTimeChange(time, 'seconds', event.target.value)}
          sx={{
            '& .MuiInputBase-root': {
              borderRadius: 0, borderTopRightRadius: '4px',
            },
          }}
        />
      </Stack>

      <TextField
        fullWidth
        variant="filled"
        value={model.messageWhenReachedZero}
        required
        label={'Message to show, when countdown reaches zero'}
        InputProps={{
          endAdornment: <InputAdornment position='end'>
            <Switch checked={model.showMessageWhenReachedZero} onChange={(_, checked) => {
              dispatch(setCountdownShow({ [id]: 'time' }));
              onUpdate({
                ...model, showMessageWhenReachedZero: checked,
              });
            }
            }/>
          </InputAdornment>,
        }}
        onChange={(event) => onUpdate({
          ...model, messageWhenReachedZero: event.target.value,
        })}
      />

      <Box sx={{
        p: 1, px: 2,
      }}>
        <FormControlLabel sx={{
          width: '100%', alignItems: 'self-start',
        }} control={<Switch checked={model.isStartedOnSourceLoad} onChange={(_, checked) => onUpdate({
          ...model, isStartedOnSourceLoad: checked,
        })} />} label={<>
          <Typography>Start automatically</Typography>
          <Typography variant='body2' sx={{ fontSize: '12px' }}>{model.isStartedOnSourceLoad
            ? 'Countdown will start automatically on browser source load.'
            : 'Countdown won\'t start on browser source load, you will need to start it by dashboard\'s action button.'
          }</Typography>
        </>}/>

        <FormControlLabel sx={{
          width: '100%', alignItems: 'self-start', pt: 1,
        }} control={<Switch checked={model.isPersistent} onChange={(_, checked) => onUpdate({
          ...model, isPersistent: checked, time: model.currentTime,
        })} />} label={<>
          <Typography>Persistent</Typography>
          <Typography variant='body2' sx={{ fontSize: '12px' }}>{model.isPersistent
            ? 'Countdown will keep value on browser source load, you will need to reset by dashboard\'s action button.'
            : 'Countdown will reset on browser source load.'
          }</Typography>
        </>}/>

        <FormControlLabel sx={{
          width: '100%', pt: 1,
        }} control={<Switch checked={model.showMilliseconds} onChange={(_, checked) => onUpdate({
          ...model, showMilliseconds: checked,
        })} />} label='Show milliseconds'/>
      </Box>
      <AccordionFont
        disableExample
        label='Countdown font'
        accordionId='countdownFont'
        model={model.countdownFont}
        open={open}
        onClick={(val) => typeof val === 'string' && setOpen(val)}
        onChange={(val) => {
          onUpdate({
            ...model, countdownFont: val,
          });
        }}/>
      <AccordionFont
        disableExample
        label='Message font'
        accordionId='messageFont'
        model={model.messageFont}
        open={open}
        onClick={(val) => typeof val === 'string' && setOpen(val)}
        onChange={(val) => {
          onUpdate({
            ...model, messageFont: val,
          });
        }}/>
    </Stack>
  </>;
};