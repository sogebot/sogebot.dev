import { Countdown } from '@sogebot/backend/dest/database/entity/overlay';
import React from 'react';

import { AccordionFont } from '../../Accordion/Font';

type Props = {
  model: Countdown;
  onUpdate: (value: Countdown) => void;
};

export const CountdownSettings: React.FC<Props> = ({ model, onUpdate }) => {
  const [ open, setOpen ] = React.useState('');
  return <>
    <AccordionFont
      disableExample
      label='Countdown font'
      accordionId='countdownFont'
      model={model.countdownFont}
      open={open}
      onClick={(val) => typeof val === 'string' && setOpen(val)}
      onChange={(val) => {
        onUpdate({
          ...model, countdownFont: val,
        });
      }}/>
    <AccordionFont
      disableExample
      label='Message font'
      accordionId='messageFont'
      model={model.messageFont}
      open={open}
      onClick={(val) => typeof val === 'string' && setOpen(val)}
      onChange={(val) => {
        onUpdate({
          ...model, messageFont: val,
        });
      }}/>
  </>;
};