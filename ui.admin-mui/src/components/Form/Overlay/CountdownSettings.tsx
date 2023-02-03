import { Countdown } from '@sogebot/backend/dest/database/entity/overlay';
import React from 'react';

type Props = {
  model: Countdown;
  onUpdate: (value: Countdown) => void;
};

export const CountdownSettings: React.FC<Props> = () => {

  return <>
  Hey, its me, countdown settings!
  </>;
};