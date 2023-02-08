import {
  Box,
  Divider,
  FormControl,
  FormControlLabel,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { Chat } from '@sogebot/backend/dest/database/entity/overlay';
import { isEqual } from 'lodash';
import React from 'react';
import { usePreviousImmediate } from 'rooks';

import {
  DAY, HOUR, MINUTE, SECOND,
} from '../../../constants';
import { timestampToObject } from '../../../helpers/getTime';
import { AccordionFont } from '../../Accordion/Font';

type Props = {
  model: Chat;
  onUpdate: (value: Chat) => void;
};

export const ChatSettings: React.FC<Props> = ({ model, onUpdate }) => {
  const [ open, setOpen ] = React.useState('');

  React.useEffect(() => {
    setTime(timestampToObject(model.hideMessageAfter));
  }, []);

  const [ time, setTime ] = React.useState({
    days: 0, hours: 0, minutes: 10, seconds: 0,
  });
  const prevTime = usePreviousImmediate(time);

  React.useEffect(() => {
    if (prevTime && !isEqual(time, prevTime)) {
      onUpdate({
        ...model,
        hideMessageAfter: time.days * DAY + time.hours * HOUR + time.minutes * MINUTE + time.seconds * SECOND,
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
    <Divider/>

    <Stack spacing={0.5} sx={{ pt: 2 }}>
      <FormControl fullWidth variant="filled" >
        <InputLabel id="type-select-label">Type</InputLabel>
        <Select
          MenuProps={{ PaperProps: { sx: { maxHeight: 200 } } }}
          label="Type"
          labelId="type-select-label"
          value={model.type}
          onChange={(ev) => onUpdate({
            ...model, type: ev.target.value as 'vertical',
          })}
        >
          <MenuItem value="vertical" key="vertical">vertical</MenuItem>
          <MenuItem value="horizontal" key="horizontal">horizontal</MenuItem>
          <MenuItem value="niconico" key="niconico">niconico</MenuItem>
        </Select>
      </FormControl>

      {model.type !== 'niconico' && <Stack direction='row'>
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
      </Stack>}

      <TextField
        fullWidth
        variant="filled"
        value={model.customEmoteSize}
        inputProps={{ min: 1 }}
        type="number"
        label={'Custom emote size'}
        InputProps={{
          endAdornment: <>
            <InputAdornment position='end'>px</InputAdornment>
            <InputAdornment position='end'>
              <Switch checked={model.useCustomEmoteSize} onChange={(_, checked) => onUpdate({
                ...model, useCustomEmoteSize: checked,
              })}/>
            </InputAdornment>
          </>,
        }}
        onChange={(ev) => {
          if (!isNaN(Number(ev.currentTarget.value))) {
            onUpdate({
              ...model, customEmoteSize: Number(ev.currentTarget.value),
            });
          }
        }}
      />

      <TextField
        fullWidth
        variant="filled"
        value={model.customBadgeSize}
        inputProps={{ min: 1 }}
        type="number"
        label={'Custom badge size'}
        InputProps={{
          endAdornment: <>
            <InputAdornment position='end'>px</InputAdornment>
            <InputAdornment position='end'>
              <Switch checked={model.useCustomBadgeSize} onChange={(_, checked) => onUpdate({
                ...model, useCustomBadgeSize: checked,
              })}/>
            </InputAdornment>
          </>,
        }}
        onChange={(ev) => {
          if (!isNaN(Number(ev.currentTarget.value))) {
            onUpdate({
              ...model, customBadgeSize: Number(ev.currentTarget.value),
            });
          }
        }}
      />

      <TextField
        fullWidth
        variant="filled"
        value={model.customLineHeight}
        inputProps={{ min: 1 }}
        type="number"
        label={'Custom line height'}
        InputProps={{
          endAdornment: <>
            <InputAdornment position='end'>px</InputAdornment>
            <InputAdornment position='end'>
              <Switch checked={model.useCustomLineHeight} onChange={(_, checked) => onUpdate({
                ...model, useCustomLineHeight: checked,
              })}/>
            </InputAdornment></>,
        }}
        onChange={(ev) => {
          if (!isNaN(Number(ev.currentTarget.value))) {
            onUpdate({
              ...model, customLineHeight: Number(ev.currentTarget.value),
            });
          }
        }}
      />

      <Box sx={{ py: 2 }}>
        <FormControlLabel sx={{
          width: '100%', alignItems: 'self-start',
        }} control={<Switch checked={model.showTimestamp} onChange={(_, checked) => onUpdate({
          ...model, showTimestamp: checked,
        })} />} label={<>
          <Typography>Show timestamps</Typography>
          <Typography variant='body2' sx={{ fontSize: '12px' }}>{model.showTimestamp
            ? 'Message will contain timestamp.'
            : 'Timestamp won\'t be visible.'
          }</Typography>
        </>}/>

        <FormControlLabel sx={{
          width: '100%', alignItems: 'self-start', pt: 1,
        }} control={<Switch checked={model.showBadges} onChange={(_, checked) => onUpdate({
          ...model, showBadges: checked,
        })} />} label={<>
          <Typography>Show badges</Typography>
          <Typography variant='body2' sx={{ fontSize: '12px' }}>{model.showBadges
            ? 'Message will contain badges.'
            : 'Badges won\'t be visible.'
          }</Typography>
        </>}/>

        {model.type !== 'niconico' && <FormControlLabel sx={{
          width: '100%', pt: 1,
        }} control={<Switch checked={model.reverseOrder} onChange={(_, checked) => onUpdate({
          ...model, reverseOrder: checked,
        })} />} label='Reverse flow of chat'/>}

      </Box>
      <AccordionFont
        disableExample
        label='Chat font'
        accordionId='Font'
        model={model.font}
        open={open}
        onClick={(val) => typeof val === 'string' && setOpen(val)}
        onChange={(val) => {
          onUpdate({
            ...model, font: val,
          });
        }}/>
    </Stack>
  </>;
};