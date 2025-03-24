import { ExpandMoreTwoTone } from '@mui/icons-material';
import { Accordion, AccordionDetails, AccordionProps, AccordionSummary, Fade, TextField, Typography } from '@mui/material';
import { nanoid } from 'nanoid';
import React from 'react';

import { useTranslation } from '../../../../../hooks/useTranslation';

type Props = Omit<AccordionProps, 'children' | 'onChange'> & {
  model:               string,
  open:                string,
  label?:              string,
  onOpenChange:        (value: string) => void;
  onChange:            (value: string) => void;
  helperText?:         string;
  customLabelDetails?: string | React.JSX.Element | null;
  placeholder?:        string;
};

export const AccordionTTSTemplate: React.FC<Props> = (props) => {
  const [accordionId] = React.useState(nanoid());
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
            {props.customLabelDetails
              ? props.customLabelDetails
              : value
            }
          </Typography>
        </Fade>
      </Typography>
    </AccordionSummary>
    <AccordionDetails>
      <TextField
        fullWidth
        value={value}
        helperText={props.helperText ?? translate('registry.alerts.ttsTemplate.help')}
        placeholder={props.placeholder ?? translate('registry.alerts.ttsTemplate.placeholder')}
        sx={{ '& .MuiFilledInput-input': { p: '10px' } }}
        onChange={ev => {
          setValue(ev.currentTarget.value);
        }}
      />
    </AccordionDetails>
  </Accordion>;
};