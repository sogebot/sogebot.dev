import { Alerts } from '@backend/database/entity/overlay';
import { ExpandMoreTwoTone } from '@mui/icons-material';
import { Accordion, AccordionDetails, AccordionProps, AccordionSummary, Box, Checkbox, Fade, FormControlLabel, FormGroup, FormLabel, Slider, Typography } from '@mui/material';
import { nanoid } from 'nanoid';
import React from 'react';

import { useTranslation } from '../../../../../hooks/useTranslation';

type Props = Omit<AccordionProps, 'children' | 'onChange'> & {
  model:        Alerts['parry'],
  open:         string,
  onOpenChange: (value: string) => void;
  onChange:     (value: Alerts['parry']) => void;
};

export const AccordionParry: React.FC<Props> = (props) => {
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
      aria-controls="panel1a-content"
      id="panel1a-header"
    >
      <Typography sx={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', width: '100%',
      }}>
        {translate('registry.alerts.parryEnabled.name')}
        <Fade in={open !== accordionId}>
          <Typography component='span' variant='caption' sx={{ textAlign: 'right' }}>
            <Checkbox size='small' readOnly disabled checked={model.enabled || false} sx={{
              p: 0, pr: 0.5, position: 'relative', top: '-1px',
            }}/>
            {model.delay / 1000}s
          </Typography>
        </Fade>
      </Typography>
    </AccordionSummary>
    <AccordionDetails>
      <FormGroup sx={{ width: '100%' }}>
        <FormControlLabel
          control={<Checkbox checked={model.enabled || false}/>}
          onChange={(_, checked) => onChange({
            enabled: checked, delay: model.delay ?? 0,
          })}
          label={translate('registry.alerts.parryEnabled.name')} />
      </FormGroup>

      <FormLabel sx={{ marginTop: '15px' }}>{translate('registry.alerts.parryDelay.name')}</FormLabel>
      <Box sx={{
        px: 2,
        pt: 1,
      }}>
        <Slider
          value={model.delay}
          max={60000}
          step={500}
          valueLabelDisplay="on"
          valueLabelFormat={(value) => `${value/1000}s`}
          size='small'
          onChange={(event, newValue) => onChange({
            enabled: model.enabled ?? false, delay: Number(newValue),
          })}
        />
      </Box>
    </AccordionDetails>
  </Accordion>;
};