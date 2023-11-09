import { ExpandMoreTwoTone } from '@mui/icons-material';
import { Accordion, AccordionDetails, AccordionProps, AccordionSummary, Fade, Typography } from '@mui/material';
import { useAtomValue } from 'jotai';
import { nanoid } from 'nanoid';
import React from 'react';

import { rewardsAtom } from '../../../../../atoms';
import { FormRewardInput } from '../../../Input/Reward';

type Props = Omit<AccordionProps, 'children' | 'onChange'> & {
  model:               string,
  open:                string,
  label?:              string,
  onOpenChange:        (value: string) => void;
  onChange:            (value: string) => void;
  customLabelDetails?: React.ReactNode;
};

export const AccordionReward: React.FC<Props> = (props) => {
  const [ accordionId ] = React.useState(nanoid());
  const { open,
    onOpenChange,
    onChange,
    model,
    label,
    ...accordionProps } = props;

  const handleClick = () => {
    onOpenChange(open === accordionId ? '' : accordionId);
  };

  const rewards = useAtomValue(rewardsAtom);

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
        {label ? label : 'Reward'}
        <Fade in={open !== accordionId}>
          <Typography component='span' variant='caption' sx={{ textAlign: 'right' }}>
            {props.customLabelDetails
              ? props.customLabelDetails
              : <>{rewards.find(r => r.id === model)?.name
                ?? `${model === '' ? 'No' : 'Unknown'} reward selected` }</>
            }
          </Typography>
        </Fade>
      </Typography>
    </AccordionSummary>
    <AccordionDetails>
      <FormRewardInput onChange={(r) => onChange(r.id)} value={model}/>
    </AccordionDetails>
  </Accordion>;
};