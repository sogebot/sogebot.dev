import { ExpandMoreTwoTone, Square } from '@mui/icons-material';
import {
  Accordion, AccordionDetails, AccordionProps, AccordionSummary, FormControl, InputLabel, MenuItem, Paper, Select, Slider, Stack, Typography,
} from '@mui/material';
import React from 'react';

import { useTranslation } from '../../hooks/useTranslation';
import theme from '../../theme';

type Position = {
  x: number;
  y: number;
  anchorX: 'right' | 'left' | 'middle';
  anchorY: 'top' | 'bottom' | 'middle';
};

type Props = Omit<AccordionProps, 'children' | 'onChange'> & {
  model: Position,
  disableAnchorX?: boolean,
  disableX?: boolean,
  disableY?: boolean,
  disableAnchorY?: boolean,
  open: string,
  onClick: (value: string) => void;
  onChange: (value: Position) => void;
};

export const AccordionPosition: React.FC<Props> = (props) => {
  const accordionId = 'position';
  const { open,
    disableAnchorX,
    disableAnchorY,
    disableX,
    disableY,
    onClick,
    onChange,
    model,
    ...accordionProps } = props;
  const { translate } = useTranslation();

  const [ value, setValue ] = React.useState(model);

  const anchorRef = React.useRef<any>();
  const textRef = React.useRef<any>();
  const paperRef = React.useRef<any>();

  React.useEffect(() => {
    onChange(value);
  }, [ value ]);

  const handleClick = () => {
    onClick(open === accordionId ? '' : accordionId);
  };

  const anchorPosition = React.useMemo(() => {
    if (anchorRef.current && paperRef.current) {
      const widthPxPerCent = paperRef.current.getBoundingClientRect().width / 100;
      const heightPxPerCent = paperRef.current.getBoundingClientRect().height / 100;

      let top = 0;
      if (value.anchorY === 'middle') {
        top = anchorRef.current.getBoundingClientRect().height / 2;
      } else if (value.anchorY === 'bottom') {
        top = anchorRef.current.getBoundingClientRect().height;
      }

      let left = 0;
      if (value.anchorX === 'middle') {
        left = anchorRef.current.getBoundingClientRect().width / 2;
      } else if (value.anchorX === 'right') {
        left = anchorRef.current.getBoundingClientRect().width;
      }

      return { transform: `translate(${(value.x * widthPxPerCent) - left}px, ${(value.y * heightPxPerCent) - top}px)` };
    } else {
      return { transform: `translate(0, 0)` };
    }
  }, [ anchorRef, paperRef, value ]);

  const textPosition = React.useMemo(() => {
    if (textRef.current && paperRef.current) {
      const widthPxPerCent = paperRef.current.getBoundingClientRect().width / 100;
      const heightPxPerCent = paperRef.current.getBoundingClientRect().height / 100;

      let top = 0;
      if (value.anchorY === 'middle') {
        top = textRef.current.getBoundingClientRect().height / 2;
      } else if (value.anchorY === 'bottom') {
        top = textRef.current.getBoundingClientRect().height;
      }

      let left = 0;
      if (value.anchorX === 'middle') {
        left = textRef.current.getBoundingClientRect().width / 2;
      } else if (value.anchorX === 'right') {
        left = textRef.current.getBoundingClientRect().width;
      }

      return { transform: `translate(${(value.x * widthPxPerCent) - left}px, ${(value.y * heightPxPerCent) - top}px)` };
    } else {
      return { transform: `translate(0, 0)` };
    }
  }, [ textRef, paperRef, value ]);

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
          value={value.anchorX}
          onChange={(ev) => setValue({
            ...value, anchorX: ev.target.value as typeof model.anchorX,
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
          value={value.anchorY}
          onChange={(ev) => setValue({
            ...value, anchorY: ev.target.value as typeof model.anchorY,
          })}
        >
          <MenuItem value='top'>{translate('dialog.position.top')}</MenuItem>
          <MenuItem value='middle'>{translate('dialog.position.middle')}</MenuItem>
          <MenuItem value='bottom'>{translate('dialog.position.bottom')}</MenuItem>
        </Select>
      </FormControl>}

      <Stack direction='row' sx={{ pt: 4 }} justifyContent='center'>
        <Slider sx={{
          height: 'auto', mt: 4,
        }}
        track={false}
        step={0.01}
        min={0}
        valueLabelFormat={(val) => `${val}%`}
        valueLabelDisplay="on"
        max={100}
        orientation="vertical"
        value={100 - value.y}
        onChange={(_, newValue) => setValue({
          ...value, y: 100 - (newValue as typeof model.y),
        })}/>
        <Stack sx={{ width: '50%' }}>
          <Slider
            valueLabelFormat={(val) => `${val}%`}
            valueLabelDisplay="on"
            track={false}
            max={100}
            min={0}
            step={0.01}
            value={value.x}
            onChange={(_, newValue) => setValue({
              ...value, x: (newValue as typeof model.x),
            })}/>

          <Paper ref={paperRef} sx={{
            aspectRatio: '16/9',
            width:       '100%',
            border:      '1px solid ' + theme.palette.primary.main,
            position:    'relative',
          }}>
            <Square ref={anchorRef} sx={{
              ...anchorPosition, position: 'absolute', fontSize: '10px', color: theme.palette.primary.main,
            }}/>
            <Typography ref={textRef} sx={{
              ...textPosition, position: 'absolute', fontSize: '1rem',
            }}>
              EXAMPLE TEXT
            </Typography>

          </Paper>
        </Stack>
      </Stack>
    </AccordionDetails>
  </Accordion>;
};