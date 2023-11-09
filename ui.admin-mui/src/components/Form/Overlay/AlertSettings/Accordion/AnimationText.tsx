import { ExpandMoreTwoTone } from '@mui/icons-material';
import { Accordion, AccordionDetails, AccordionProps, AccordionSummary, Box, Fade, FormControl, InputAdornment, InputLabel, MenuItem, Select, TextField, Typography } from '@mui/material';
import { Alerts } from '@sogebot/backend/src/database/entity/overlay';
import baffle from 'baffle';
import { nanoid } from 'nanoid';
import React from 'react';
import { Typewriter } from 'react-simple-typewriter';

import { useTranslation } from '../../../../../hooks/useTranslation';
import { FormNumericInput } from '../../../Input/Numeric';

require('animate.css');

type Props = Omit<AccordionProps, 'children' | 'onChange'> & {
  model:                   { animationText: typeof options[number], animationTextOptions: Alerts['items'][number]['animationTextOptions'] },
  open:                    string,
  onOpenChange:            (value: string) => void;
  onChange:                (value: Props['model']) => void;
  alwaysShowLabelDetails?: boolean;
  prepend?:                React.ReactNode;
  customLabelDetails?:     React.ReactNode;
};

const options = [
  'none', 'baffle', 'bounce', 'bounce2', 'flip', 'flash', 'pulse2', 'rubberBand'
  , 'shake2', 'swing', 'tada', 'wave', 'wobble', 'wiggle', 'wiggle2', 'jello', 'typewriter',
] as const;

export const speedOptions = [
  'slower', 'slow', 'normal',  'fast', 'faster',
] as const ;

export const AccordionAnimationText: React.FC<Props> = (props) => {
  const [accordionId] = React.useState(nanoid());
  const { open,
    onOpenChange,
    onChange: onChangeProps,
    model,
    ...accordionProps } = props;
  const { translate } = useTranslation();
  const [ baffleId, setBaffleId ] = React.useState(nanoid());

  const handleClick = () => {
    onOpenChange(open === accordionId ? '' : accordionId);
  };

  const onChange = (value: Props['model']) => {
    if (value.animationText === 'baffle') {
      const newId = nanoid();
      setBaffleId(newId);
      setTimeout(() => {
        baffle('.obfuscate-' + newId, {
          characters: value.animationTextOptions.characters,
          speed:      ((speedOptions.length - speedOptions.findIndex(v => v === value.animationTextOptions.speed)) * 50),
        }).start().reveal(value.animationTextOptions.maxTimeToDecrypt, value.animationTextOptions.maxTimeToDecrypt);
      }, 200);
    }
    onChangeProps(value);
  };

  return <Accordion {...accordionProps} expanded={open === accordionId && !props.disabled}>
    <AccordionSummary
      expandIcon={<ExpandMoreTwoTone />}
      onClick={() => handleClick()}
      aria-controls={`accordion-${accordionId}-header`}
      id={`accordion-${accordionId}-header`}
    >
      <Typography sx={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', width: '100%',
      }}>
        {translate('registry.alerts.animationText.name')}
        <Fade in={open !== accordionId || props.alwaysShowLabelDetails}>
          <Typography component='span' variant='caption' sx={{ textAlign: 'right' }}>
            {props.customLabelDetails
              ? props.customLabelDetails
              : <>
                {model.animationText}
              </>
            }
          </Typography>
        </Fade>
      </Typography>
    </AccordionSummary>
    <AccordionDetails>
      {props.prepend && props.prepend}

      <FormControl fullWidth variant="filled" >
        <InputLabel id="registry.alerts.animationText.name">{translate('registry.alerts.animationText.name')}</InputLabel>
        <Select
          MenuProps={{ PaperProps: { sx: { maxHeight: 200 } } }}
          label={translate('registry.alerts.animationText.name')}
          labelId="registry.alerts.animationText.name"
          value={model.animationText}
          onChange={(ev) => {
            if (model.animationText !== ev.target.value ?? 'none') {
              onChange({
                ...model, animationText: (ev.target.value ?? 'none') as any,
              });
            }
          }}
        >
          {options.map(o => <MenuItem value={o} key={o}>{o}</MenuItem>)}
        </Select>
      </FormControl>

      <FormControl fullWidth variant="filled" >
        <InputLabel id="registry.alerts.speed.name">{translate('registry.alerts.speed.name')}</InputLabel>
        <Select
          MenuProps={{ PaperProps: { sx: { maxHeight: 200 } } }}
          label={translate('registry.alerts.speed.name')}
          labelId="registry.alerts.speed.name"
          value={model.animationTextOptions.speed}
          onChange={(ev) => {
            if (model.animationTextOptions.speed !== ev.target.value ?? 'normal') {
              onChange({
                ...model,
                animationTextOptions: {
                  ...model.animationTextOptions, speed: (ev.target.value ?? 'normal') as any,
                },
              });
            }
          }}
        >
          {speedOptions.map(o => <MenuItem value={o} key={o}>{o}</MenuItem>)}
        </Select>
      </FormControl>

      {model.animationText === 'baffle' && <TextField
        fullWidth
        variant="filled"
        value={model.animationTextOptions.characters}
        label={translate('registry.alerts.characters.name')}
        onChange={(ev) => {
          if (model.animationTextOptions.characters !== ev.target.value ?? '123456789qwrtyuiopasdfghjklzxcvbnm,.?!') {
            onChange({
              ...model,
              animationTextOptions: {
                ...model.animationTextOptions, characters: (ev.target.value ?? '123456789qwrtyuiopasdfghjklzxcvbnm,.?!') as any,
              },
            });
          }
        }}
      />}

      {model.animationText === 'baffle' && <FormNumericInput
        fullWidth
        variant="filled"
        value={model.animationTextOptions.maxTimeToDecrypt}
        inputProps={{ min: 1000 }}
        min={1000}
        type="number"
        label={translate('registry.alerts.maxTimeToDecrypt.name')}
        InputProps={{ endAdornment: <InputAdornment position='end'>ms</InputAdornment> }}
        onChange={(val) => {
          val = Number(val === '' ? 1000 : val);
          if (model.animationTextOptions.maxTimeToDecrypt !== Number(val)) {
            onChange({
              ...model,
              animationTextOptions: {
                ...model.animationTextOptions, maxTimeToDecrypt: Number(val),
              },
            });
          }
        }}/>}

      <Box sx={{
        fontSize: '2rem', width: '100%', textAlign: 'center', pt: 2,
      }}>
        {model.animationText === 'baffle' && <span className={`obfuscate-${baffleId}`}>example</span>}
        {model.animationText === 'typewriter' && <Typewriter
          key={JSON.stringify(model)}
          words={['example']}
          loop={1}
          cursor
          cursorStyle='_'
          typeSpeed={(speedOptions.length - speedOptions.findIndex(v => v === model.animationTextOptions.speed)) * 50}
        />}
        {/* default animate.css */}
        {(model.animationText !== 'baffle' && model.animationText !== 'typewriter') && 'example'.split('').map((char, index) => <div
          key={`${char}-${index}`}
          className={`animate__animated animate__infinite animate__${model.animationText}  animate__${model.animationTextOptions.speed}`}
          style={{
            animationDelay: (index * 50) + 'ms',
            display:        'inline-block',
          }}
        >
          { char === ' ' ? '&nbsp;' : char }
        </div>)}
      </Box>
    </AccordionDetails>
  </Accordion>;
};