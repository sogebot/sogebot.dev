import { ExpandMoreTwoTone } from '@mui/icons-material';
import { Accordion, AccordionDetails, AccordionProps, AccordionSummary, Box, Checkbox, Fade, FormControl, FormControlLabel, InputAdornment, InputLabel, MenuItem, Select, Typography } from '@mui/material';
import { nanoid } from 'nanoid';
import React from 'react';

import { useTranslation } from '../../../../../hooks/useTranslation';
import { FormNumericInput } from '../../../Input/Numeric';

type Props = Omit<AccordionProps, 'children' | 'onChange'> & {
  model:                   { animationOut: string, animationOutDuration: number, animationOutWindowBoundaries?: boolean },
  open:                    string,
  onOpenChange:            (value: string) => void;
  onChange:                (value: { animationOut: string, animationOutDuration: number, animationOutWindowBoundaries?: boolean }) => void;
  alwaysShowLabelDetails?: boolean;
  prependLabel?: string | React.JSX.Element | null;
  prepend?:                string | React.JSX.Element | null;
  customLabelDetails?:     string | React.JSX.Element | null;
};

const animationOutOptions = [
  'none', 'fadeOut', 'fadeOutDown', 'fadeOutLeft', 'fadeOutRight', 'fadeOutUp'
  , 'fadeOutDownBig', 'fadeOutLeftBig', 'fadeOutRightBig', 'fadeOutUpBig'
  , 'bounceOut', 'bounceOutDown', 'bounceOutLeft', 'bounceOutRight'
  , 'bounceOutUp', 'flipOutX', 'flipOutY', 'lightSpeedOut', 'rotateOut'
  , 'rotateOutDownLeft', 'rotateOutDownRight', 'rotateOutUpLeft'
  , 'rotateOutUpRight', 'slideOutDown', 'slideOutLeft', 'slideOutRight'
  , 'slideOutUp', 'zoomOut', 'zoomOutDown', 'zoomOutLeft', 'zoomOutRight'
  , 'zoomOutUp', 'rollOut',
];

export const AccordionAnimationOut: React.FC<Props> = (props) => {
  const [accordionId] = React.useState(nanoid());
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
        <Box>
          {props.prependLabel}
          {translate('page.settings.overlays.carousel.titles.animationOut')}
        </Box>
        <Fade in={open !== accordionId || props.alwaysShowLabelDetails}>
          <Typography component='span' variant='caption' sx={{ textAlign: 'right' }}>
            {props.customLabelDetails
              ? props.customLabelDetails
              : <>
                {model.animationOut}{' '}
                {model.animationOutDuration / 1000}s
              </>
            }
          </Typography>
        </Fade>
      </Typography>
    </AccordionSummary>
    <AccordionDetails>
      {props.prepend && props.prepend}

      <FormControl fullWidth variant="filled" >
        <InputLabel id="page.settings.overlays.carousel.titles.animationOut">{translate('page.settings.overlays.carousel.titles.animationOut')}</InputLabel>
        <Select
          MenuProps={{ PaperProps: { sx: { maxHeight: 200 } } }}
          label={translate('page.settings.overlays.carousel.titles.animationOut')}
          labelId="page.settings.overlays.carousel.titles.animationOut"
          value={model.animationOut}
          onChange={(ev) => {
            if (model.animationOut !== (ev.target.value ?? '')) {
              onChange({
                ...model, animationOut: ev.target.value ?? '',
              });
            }
          }}
        >
          {animationOutOptions.map(o => <MenuItem value={o} key={o}>{o}</MenuItem>)}
        </Select>
      </FormControl>

      <FormNumericInput
        fullWidth
        variant="filled"
        value={model.animationOutDuration}
        inputProps={{ min: 1000 }}
        min={1000}
        type="number"
        label={translate('page.settings.overlays.carousel.titles.animationOutDuration')}
        InputProps={{ endAdornment: <InputAdornment position='end'>ms</InputAdornment> }}
        onChange={(val) => {
          val = Number(val === '' ? 1000 : val);
          if (model.animationOutDuration !== Number(val)) {
            onChange({
              ...model, animationOutDuration: val,
            });
          }
        }}/>

      <FormControlLabel sx={{ pt: 1 }} control={
        <Checkbox defaultChecked={model.animationOutWindowBoundaries || false}
          onChange={(_, checked) => onChange({
            ...model, animationOutWindowBoundaries: checked,
          })}/>} label={'Set animation boundaries to whole canvas'} />
    </AccordionDetails>
  </Accordion>;
};