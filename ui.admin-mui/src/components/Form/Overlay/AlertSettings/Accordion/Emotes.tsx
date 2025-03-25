import { AlertText } from '@backend/database/entity/overlay';
import { ExpandMoreTwoTone } from '@mui/icons-material';
import { Accordion, AccordionDetails, AccordionProps, AccordionSummary, Checkbox, Fade, FormControlLabel, FormGroup, Typography } from '@mui/material';
import { nanoid } from 'nanoid';
import React from 'react';

import { useTranslation } from '../../../../../hooks/useTranslation';

type Props = Omit<AccordionProps, 'children' | 'onChange'> & {
  model:        AlertText['allowEmotes'],
  open:         string,
  onOpenChange: (value: string) => void;
  onChange:     (value: AlertText['allowEmotes']) => void;
};

export const AccordionEmotes: React.FC<Props> = (props) => {
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
        {translate('registry.alerts.allowEmotes.name')}
        <Fade in={open !== accordionId}>
          <Typography component='span' variant='caption' sx={{ textAlign: 'right' }}>
            {model.bttv && 'BTTV '}
            {model.ffz && 'FFZ '}
            {model.twitch && 'Twitch'}
          </Typography>
        </Fade>
      </Typography>
    </AccordionSummary>
    <AccordionDetails>

      <FormGroup sx={{
        pt: 1, width: '100%',
      }}>
        {Object.keys(model).map(key =>
          <FormControlLabel
            key={key}
            control={<Checkbox checked={model[key as keyof typeof model] || false}/>}
            onChange={(_, checked) => onChange({
              ...model,
              [key]: checked,
            })}
            label={key} />,
        )}
      </FormGroup>
    </AccordionDetails>
  </Accordion>;
};