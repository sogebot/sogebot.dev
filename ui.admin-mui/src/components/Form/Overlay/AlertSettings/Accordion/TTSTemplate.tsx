import { ExpandMoreTwoTone } from '@mui/icons-material';
import {
  Accordion, AccordionDetails, AccordionProps, AccordionSummary, Fade, TextField, Typography,
} from '@mui/material';
import React from 'react';

import { useTranslation } from '../../../../../hooks/useTranslation';

type Props = Omit<AccordionProps, 'children' | 'onChange'> & {
  model: string,
  open: string,
  label?: string,
  onOpenChange: (value: string) => void;
  onChange: (value: string) => void;
};

export const AccordionTTSTemplate: React.FC<Props> = (props) => {
  const accordionId = 'ttsTemplate';
  const { open,
    onOpenChange,
    onChange,
    model,
    label,
    ...accordionProps } = props;

  const { translate } = useTranslation();

  const handleClick = () => {
    onOpenChange(open === accordionId ? '' : accordionId);
  };

  const [ value, setValue ] = React.useState(model);
  React.useEffect(() => {
    onChange(value);
  }, [ value ]);

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
        {label ? label : translate('registry.alerts.ttsTemplate.name')}

        <Fade in={open !== accordionId}>
          <Typography component='div' variant='caption' sx={{
            textAlign:    'right',
            overflow:     'hidden',
            textOverflow: 'ellipsis',
            whiteSpace:   'nowrap',
            maxWidth:     '180px',
          }}>
            {value}
          </Typography>
        </Fade>
      </Typography>
    </AccordionSummary>
    <AccordionDetails>
      <TextField
        fullWidth
        value={value}
        multiline
        sx={{ '& .MuiFilledInput-root': { p: '10px' } }}
        placeholder={translate('registry.alerts.ttsTemplate.placeholder')}
        helperText={translate('registry.alerts.ttsTemplate.help')}
        onChange={ev => {
          setValue(ev.currentTarget.value);
        }}
      />
    </AccordionDetails>
  </Accordion>;
};