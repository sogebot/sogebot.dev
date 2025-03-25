import { ExpandMoreTwoTone, Square } from '@mui/icons-material';
import { Accordion, AccordionDetails, AccordionProps, AccordionSummary, FormControl, InputLabel, MenuItem, Paper, Select, Slider, Stack, Typography } from '@mui/material';
import React from 'react';

import { useTranslation } from '../../hooks/useTranslation';
import theme from '../../theme';

type Position = {
  x:       number;
  y:       number;
  anchorX: 'right' | 'left' | 'middle';
  anchorY: 'top' | 'bottom' | 'middle';
};

type Props = Omit<AccordionProps, 'children' | 'onChange'> & {
  model:           Position,
  disableAnchorX?: boolean,
  disableX?:       boolean,
  disableY?:       boolean,
  disableAnchorY?: boolean,
  open:            string,
  onOpenChange:    (value: string) => void;
  onChange:        (value: Position) => void;
};

export const AccordionPosition: React.FC<Props> = (props) => {
  const accordionId = 'position';
  const { open,
    disableAnchorX,
    disableAnchorY,
    disableX,
    disableY,
    onOpenChange,
    onChange,
    model,
    ...accordionProps } = props;
  const { translate } = useTranslation();

  const anchorRef = React.useRef<any>(null);
  const textRef = React.useRef<any>(null);
  const paperRef = React.useRef<any>(null);

  const handleClick = () => {
    onOpenChange(open === accordionId ? '' : accordionId);
  };

  const position = (value: typeof model, papRef: typeof paperRef, posRef: typeof anchorRef) => {
    if (posRef.current && papRef.current) {
      const widthPxPerCent = papRef.current.getBoundingClientRect().width / 100;
      const heightPxPerCent = papRef.current.getBoundingClientRect().height / 100;

      let top = 0;
      if (value.anchorY === 'middle') {
        top = posRef.current.getBoundingClientRect().height / 2;
      } else if (value.anchorY === 'bottom') {
        top = posRef.current.getBoundingClientRect().height;
      }

      let left = 0;
      if (value.anchorX === 'middle') {
        left = posRef.current.getBoundingClientRect().width / 2;
      } else if (value.anchorX === 'right') {
        left = posRef.current.getBoundingClientRect().width;
      }

      return { transform: `translate(${(value.x * widthPxPerCent) - left}px, ${(value.y * heightPxPerCent) - top}px)` };
    } else {
      return { transform: `translate(0, 0)` };
    }
  };

  return <Accordion {...accordionProps} expanded={open === accordionId && !props.disabled}>
    <AccordionSummary
      expandIcon={<ExpandMoreTwoTone />}
      onClick={() => handleClick()}
      aria-controls="panel1a-content"
      id="panel1a-header"
    >
      <Typography>{ translate('dialog.position.settings') }</Typography>
    </AccordionSummary>
    <AccordionDetails>
      {!disableAnchorX && <FormControl fullWidth variant="filled" >
        <InputLabel id="type-select-label">{translate('dialog.position.anchorX')}</InputLabel>
        <Select
          label={translate('dialog.position.anchorX')}
          labelId="type-select-label"
          value={model.anchorX}
          onChange={(ev) => onChange({
            ...model, anchorX: ev.target.value as typeof model.anchorX,
          })}
        >
          <MenuItem value='left'>{translate('dialog.position.left')}</MenuItem>
          <MenuItem value='middle'>{translate('dialog.position.middle')}</MenuItem>
          <MenuItem value='right'>{translate('dialog.position.right')}</MenuItem>
        </Select>
      </FormControl>}

      {!disableAnchorY && <FormControl fullWidth variant="filled" >
        <InputLabel id="type-select-label">{translate('dialog.position.anchorY')}</InputLabel>
        <Select
          label={translate('dialog.position.anchorY')}
          labelId="type-select-label"
          value={model.anchorY}
          onChange={(ev) => onChange({
            ...model, anchorY: ev.target.value as typeof model.anchorY,
          })}
        >
          <MenuItem value='top'>{translate('dialog.position.top')}</MenuItem>
          <MenuItem value='middle'>{translate('dialog.position.middle')}</MenuItem>
          <MenuItem value='bottom'>{translate('dialog.position.bottom')}</MenuItem>
        </Select>
      </FormControl>}

      <Stack direction='row' sx={{ pt: 4 }} justifyContent='center'>
        <Slider sx={{
          height:                           'auto',
          mt:                               4,
          '& .MuiSlider-valueLabel:before': { display: 'none' },
        }}
        track={false}
        step={0.01}
        min={0}
        valueLabelFormat={(val) => `${val}%`}
        valueLabelDisplay="on"
        max={100}
        orientation="vertical"
        value={Math.round((100 - model.y) * 1000) / 1000}
        onChange={(_, newValue) => onChange({
          ...model, y: 100 - (newValue as typeof model.y),
        })}/>
        <Stack sx={{ width: '50%' }}>
          <Slider
            sx={{ '& .MuiSlider-valueLabel:before': { display: 'none' } }}
            valueLabelFormat={(val) => `${val}%`}
            valueLabelDisplay="on"
            track={false}
            max={100}
            min={0}
            step={0.01}
            value={model.x}
            onChange={(_, newValue) => onChange({
              ...model, x: newValue as typeof model.x,
            })}/>

          <Paper ref={paperRef} sx={{
            aspectRatio: '16/9',
            width:       '100%',
            border:      '1px solid ' + theme.palette.primary.main,
            position:    'relative',
          }}>
            <Square ref={anchorRef} sx={{
              ...position(model, paperRef, anchorRef), position: 'absolute', fontSize: '10px', color: theme.palette.primary.main,
            }}/>
            <Typography ref={textRef} sx={{
              ...position(model, paperRef, textRef), position: 'absolute', fontSize: '1rem',
            }}>
              EXAMPLE TEXT
            </Typography>

          </Paper>
        </Stack>
      </Stack>
    </AccordionDetails>
  </Accordion>;
};