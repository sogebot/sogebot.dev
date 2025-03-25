import { Alerts } from '@backend/database/entity/overlay';
import { ExpandMoreTwoTone } from '@mui/icons-material';
import { Accordion, AccordionDetails, AccordionProps, AccordionSummary, Box, Fade, Slider, Typography } from '@mui/material';
import { nanoid } from 'nanoid';
import React from 'react';

import { useTranslation } from '../../../../../hooks/useTranslation';

type Props = Omit<AccordionProps, 'children' | 'onChange'> & {
  model:        Alerts['alertDelayInMs'],
  open:         string,
  label?:       string,
  max?:         number,
  onOpenChange: (value: string) => void;
  onChange:     (value: Alerts['alertDelayInMs']) => void;
};

export const AccordionDelay: React.FC<Props> = (props) => {
  const [accordionId] = React.useState(nanoid());
  const { open,
    onOpenChange,
    onChange,
    model,
    label,
    max,
    ...accordionProps } = props;
  const { translate } = useTranslation();

  const handleClick = () => {
    onOpenChange(open === accordionId ? '' : accordionId);
  };

  return <Accordion {...accordionProps} expanded={open === accordionId && !props.disabled}>
    <AccordionSummary
      expandIcon={<ExpandMoreTwoTone />}
      onClick={() => handleClick()}
      aria-controls="panel1a-content"
      id="panel1a-header"
    >
      <Typography sx={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', width: '100%',
      }}>
        {label ? label : translate('registry.alerts.alertDelayInMs.name')}
        <Fade in={open !== accordionId}>
          <Typography component='span' variant='caption' sx={{ textAlign: 'right' }}>
            {model / 1000}s
          </Typography>
        </Fade>
      </Typography>
    </AccordionSummary>
    <AccordionDetails>
      <Box sx={{ px: 2 }}>
        <Slider
          value={model}
          max={max ? max * 1000 : 30000}
          step={500}
          valueLabelDisplay="on"
          valueLabelFormat={(value) => `${value/1000}s`}
          size='small'
          onChange={(event, newValue) => onChange(Number(newValue))}
        />
      </Box>
    </AccordionDetails>
  </Accordion>;
};