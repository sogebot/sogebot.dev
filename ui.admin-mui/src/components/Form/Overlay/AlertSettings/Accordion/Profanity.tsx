import { ExpandMoreTwoTone } from '@mui/icons-material';
import {
  Accordion, AccordionDetails, AccordionProps, AccordionSummary, Checkbox, Fade, FormControlLabel, FormGroup, MenuItem, Select, TextField, Typography,
} from '@mui/material';
import { Alerts } from '@sogebot/backend/src/database/entity/overlay';
import React from 'react';
import shortid from 'shortid';

import { useTranslation } from '../../../../../hooks/useTranslation';

type Props = Omit<AccordionProps, 'children' | 'onChange'> & {
  model: Alerts['profanityFilter'],
  open: string,
  onOpenChange: (value: string) => void;
  onChange: (value: Alerts['profanityFilter']) => void;
};

export const AccordionProfanity: React.FC<Props> = (props) => {
  const [accordionId] = React.useState(shortid());
  const { open,
    onOpenChange,
    onChange,
    model,
    ...accordionProps } = props;
  const { translate } = useTranslation();

  const handleClick = () => {
    onOpenChange(open === accordionId ? '' : accordionId);
  };

  const profanityFilterTypeOptions = React.useMemo(() => {
    return [
      {
        value: 'disabled', text: translate('registry.alerts.profanityFilterType.disabled'),
      },
      {
        value: 'replace-with-asterisk', text: translate('registry.alerts.profanityFilterType.replace-with-asterisk'),
      },
      {
        value: 'replace-with-happy-words', text: translate('registry.alerts.profanityFilterType.replace-with-happy-words'),
      },
      {
        value: 'hide-messages', text: translate('registry.alerts.profanityFilterType.hide-messages'),
      },
      {
        value: 'disable-alerts', text: translate('registry.alerts.profanityFilterType.disable-alerts'),
      },
    ];
  }, [translate]);

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
        {translate('registry.alerts.profanityFilterType.name')}
        <Fade in={open !== accordionId}>
          <Typography component='span' variant='caption' sx={{ textAlign: 'right' }}>
            {profanityFilterTypeOptions.find(o => o.value === model.type)?.text ?? ''}
          </Typography>
        </Fade>
      </Typography>
    </AccordionSummary>
    <AccordionDetails>
      <Select
        variant='filled'
        value={model.type}
        sx={{ '& .MuiSelect-select': { p: '10px' } }}
        fullWidth
        onChange={(ev) => onChange({
          ...model, type: ev.target.value as any,
        })}
      >
        {profanityFilterTypeOptions.map(item => ([
          <MenuItem value={item.value} key={item.value}>{item.text}</MenuItem>,
        ]))}
      </Select>

      <TextField
        sx={{ pt: 0.5 }}
        label={translate('registry.alerts.customProfanityList.name')}
        helperText={translate('registry.alerts.customProfanityList.help')}
        placeholder={'example, kitty, zebra, horse'}
        fullWidth
        variant="filled"
        value={model.customWords}
        onChange={(ev) => {
          onChange({
            ...model,
            customWords: ev.currentTarget.value,
          });
        }}
      />

      <FormGroup sx={{
        pt: 1, width: '100%',
      }}>
        {Object.keys(model.list).map(lang =>
          <FormControlLabel
            key={lang}
            control={<Checkbox checked={model.list[lang as any] || false}/>}
            onChange={(_, checked) => onChange({
              ...model,
              list: {
                ...model.list,
                [lang]: checked,
              },
            })}
            label={lang} />,
        )}
      </FormGroup>
    </AccordionDetails>
  </Accordion>;
};