import { ExpandMoreTwoTone } from '@mui/icons-material';
import {
  Accordion, AccordionDetails, AccordionProps, AccordionSummary,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  InputAdornment,
  Stack,
  Switch,
  Typography,
} from '@mui/material';
import { Marathon } from '@sogebot/backend/dest/database/entity/overlay';
import { isEqual } from 'lodash';
import React from 'react';

import { useAppSelector } from '../../../../hooks/useAppDispatch';
import { FormNumericInput } from '../../Input/Numeric';

type Props<T> = Omit<AccordionProps, 'children' | 'onChange'> & {
  model: T,
  open: string,
  onClick: (value: string) => void;
  onChange: (value: T) => void;
};
export const AccordionTimeAdditions = <T extends Marathon['values']>(props: Props<T>) => {
  const accordionId = 'timeaddition';
  const { open,
    onClick,
    onChange,
    model,
    ...accordionProps } = props;

  const handleChange = (val: T) => {
    if (!isEqual(model, val)) {
      onChange(val);
    }
  };

  const { configuration } = useAppSelector(state => state.loader);

  const handleClick = () => {
    onClick(open === accordionId ? '' : accordionId);
  };

  return <Accordion {...accordionProps} disabled={props.disabled} expanded={open === accordionId && !props.disabled}>
    <AccordionSummary
      expandIcon={<ExpandMoreTwoTone />}
      onClick={() => handleClick()}
      aria-controls="panel1a-content"
      id="panel1a-header"
    >
      <Typography>Time addition settings for subs, resubs, bits and tips</Typography>
    </AccordionSummary>
    <AccordionDetails>
      <Stack spacing={0.5}>
        <FormLabel>Subscriptions</FormLabel>
        <FormNumericInput
          min={0}
          variant="filled"
          value={model.sub.tier1}
          label={'Prime / Tier 1'}
          InputProps={{ endAdornment: <InputAdornment position='end'>seconds</InputAdornment> }}
          onChange={(val) => handleChange({
            ...model,
            sub: {
              ...model.sub, tier1: val,
            },
          })}
        />
        <FormNumericInput
          min={0}
          variant="filled"
          value={model.sub.tier2}
          label={'Prime / Tier 2'}
          InputProps={{ endAdornment: <InputAdornment position='end'>seconds</InputAdornment> }}
          onChange={(val) => handleChange({
            ...model,
            sub: {
              ...model.sub, tier2: val,
            },
          })}
        />
        <FormNumericInput
          min={0}
          variant="filled"
          value={model.sub.tier3}
          label={'Prime / Tier 3'}
          InputProps={{ endAdornment: <InputAdornment position='end'>seconds</InputAdornment> }}
          onChange={(val) => handleChange({
            ...model,
            sub: {
              ...model.sub, tier3: val,
            },
          })}
        />
      </Stack>
      <Stack spacing={0.5} pt={2}>
        <FormLabel>Resubscriptions</FormLabel>
        <FormNumericInput
          min={0}
          variant="filled"
          value={model.resub.tier1}
          label={'Prime / Tier 1'}
          InputProps={{ endAdornment: <InputAdornment position='end'>seconds</InputAdornment> }}
          onChange={(val) => handleChange({
            ...model,
            resub: {
              ...model.resub, tier1: val,
            },
          })}
        />
        <FormNumericInput
          min={0}
          variant="filled"
          value={model.resub.tier2}
          label={'Prime / Tier 2'}
          InputProps={{ endAdornment: <InputAdornment position='end'>seconds</InputAdornment> }}
          onChange={(val) => handleChange({
            ...model,
            resub: {
              ...model.resub, tier2: val,
            },
          })}
        />
        <FormNumericInput
          min={0}
          variant="filled"
          value={model.resub.tier3}
          label={'Prime / Tier 3'}
          InputProps={{ endAdornment: <InputAdornment position='end'>seconds</InputAdornment> }}
          onChange={(val) => handleChange({
            ...model,
            resub: {
              ...model.resub, tier3: val,
            },
          })}
        />
      </Stack>
      <Stack spacing={0.5} pt={2}>
        <FormLabel>Tips</FormLabel>
        <FormNumericInput
          min={0}
          variant="filled"
          value={model.tips.tips}
          label={'Amount of donation'}
          InputProps={{ endAdornment: <InputAdornment position='end'>{configuration.currency}</InputAdornment> }}
          onChange={(val) => handleChange({
            ...model,
            tips: {
              ...model.tips, tips: val,
            },
          })}
        />
        <FormNumericInput
          min={0}
          variant="filled"
          value={model.tips.time}
          label={'Time'}
          InputProps={{ endAdornment: <InputAdornment position='end'>seconds</InputAdornment> }}
          onChange={(val) => handleChange({
            ...model,
            tips: {
              ...model.tips, time: val,
            },
          })}
        />
        <FormControlLabel sx={{
          width: '100%', pt: 1,
        }} control={<Switch checked={model.tips.addFraction} onChange={(_, checked) => onChange({
          ...model,
          tips: {
            ...model.tips, addFraction: checked,
          },
        })} />} label={<>
          <Typography>Add fraction of tip</Typography>
          <FormHelperText>{(model.tips.addFraction ? 'Will add even fractions of amount. E.g. if amount is set to 100 and you got 150, it will add 1.5x of time.' : 'Won\'t add fractions of amount. E.g. if amount is set to 100 and you got 150, it will add 1.0x of time.')}</FormHelperText>
        </>}/>
      </Stack>
      <Stack spacing={0.5} pt={2}>
        <FormLabel>Bits</FormLabel>
        <FormNumericInput
          min={0}
          variant="filled"
          value={model.bits.bits}
          label={'Bits amount'}
          InputProps={{ endAdornment: <InputAdornment position='end'>bits</InputAdornment> }}
          onChange={(val) => handleChange({
            ...model,
            bits: {
              ...model.bits, bits: val,
            },
          })}
        />
        <FormNumericInput
          min={0}
          variant="filled"
          value={model.bits.time}
          label={'Time'}
          InputProps={{ endAdornment: <InputAdornment position='end'>seconds</InputAdornment> }}
          onChange={(val) => handleChange({
            ...model,
            bits: {
              ...model.bits, time: val,
            },
          })}
        />
        <FormControlLabel sx={{
          width: '100%', pt: 1,
        }} control={<Switch checked={model.bits.addFraction} onChange={(_, checked) => onChange({
          ...model,
          bits: {
            ...model.bits, addFraction: checked,
          },
        })} />} label={<>
          <Typography>Add fraction of bits</Typography>
          <FormHelperText>{(model.bits.addFraction ? 'Will add even fractions of amount. E.g. if amount is set to 100 and you got 150, it will add 1.5x of time.' : 'Won\'t add fractions of amount. E.g. if amount is set to 100 and you got 150, it will add 1.0x of time.')}</FormHelperText>
        </>}/>
      </Stack>
    </AccordionDetails>
  </Accordion>;
};