import { ExpandMoreTwoTone } from '@mui/icons-material';
import {
  Accordion, AccordionDetails, AccordionProps, AccordionSummary, Fade, FormControl, InputAdornment, InputLabel, MenuItem, Select, Typography,
} from '@mui/material';
import React from 'react';

import { useTranslation } from '../../../../../hooks/useTranslation';
import { FormNumericInput } from '../../../Input/Numeric';

type Props = Omit<AccordionProps, 'children' | 'onChange'> & {
  model: { animationIn: string, animationInDuration: number },
  open: string,
  onOpenChange: (value: string) => void;
  onChange: (value: { animationIn: string, animationInDuration: number }) => void;
  alwaysShowLabelDetails?: boolean;
  prepend?: React.ReactNode;
  customLabelDetails?: React.ReactNode;
};

const animationInOptions = [
  'none', 'fadeIn', 'fadeInDown', 'fadeInLeft', 'fadeInRight'
  , 'fadeInUp', 'fadeInDownBig', 'fadeInLeftBig', 'fadeInRightBig'
  , 'fadeInUpBig', 'bounceIn', 'bounceInDown', 'bounceInLeft'
  , 'bounceInRight', 'bounceInUp', 'flipInX', 'flipInY', 'lightSpeedIn'
  , 'rotateIn', 'rotateInDownLeft', 'rotateInDownRight', 'rotateInUpLeft'
  , 'rotateInUpRight', 'slideInDown', 'slideInLeft', 'slideInRight'
  , 'slideInUp', 'zoomIn', 'zoomInDown', 'zoomInLeft', 'zoomInRight'
  , 'zoomInUp', 'rollIn', 'jackInTheBox',
];

export const AccordionAnimationIn: React.FC<Props> = (props) => {
  const accordionId = 'animationIn';
  const { open,
    onOpenChange,
    onChange,
    model,
    ...accordionProps } = props;
  const { translate } = useTranslation();

  const handleClick = () => {
    onOpenChange(open === accordionId ? '' : accordionId);
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
        {translate('page.settings.overlays.carousel.titles.animationIn')}
        <Fade in={open !== accordionId || props.alwaysShowLabelDetails}>
          <Typography component='span' variant='caption' sx={{ textAlign: 'right' }}>
            {props.customLabelDetails
              ? props.customLabelDetails
              : <>
                {model.animationIn}{' '}
                {model.animationInDuration / 1000}s
              </>
            }
          </Typography>
        </Fade>
      </Typography>
    </AccordionSummary>
    <AccordionDetails>
      {props.prepend && props.prepend}

      <FormControl fullWidth variant="filled" >
        <InputLabel id="page.settings.overlays.carousel.titles.animationIn">{translate('page.settings.overlays.carousel.titles.animationIn')}</InputLabel>
        <Select
          MenuProps={{ PaperProps: { sx: { maxHeight: 200 } } }}
          label={translate('page.settings.overlays.carousel.titles.animationIn')}
          labelId="page.settings.overlays.carousel.titles.animationIn"
          value={model.animationIn}
          onChange={(ev) => {
            if (model.animationIn !== ev.target.value ?? '') {
              onChange({
                ...model, animationIn: ev.target.value ?? '',
              });
            }
          }}
        >
          {animationInOptions.map(o => <MenuItem value={o} key={o}>{o}</MenuItem>)}
        </Select>
      </FormControl>

      <FormNumericInput
        fullWidth
        variant="filled"
        value={model.animationInDuration}
        inputProps={{ min: 1000 }}
        min={1000}
        type="number"
        label={translate('page.settings.overlays.carousel.titles.animationInDuration')}
        InputProps={{ endAdornment: <InputAdornment position='end'>ms</InputAdornment> }}
        onChange={(val) => {
          val = Number(val === '' ? 1000 : val);
          if (model.animationInDuration !== Number(val)) {
            onChange({
              ...model, animationInDuration: val,
            });
          }
        }}/>
    </AccordionDetails>
  </Accordion>;
};