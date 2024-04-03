import { LinearProgress, SxProps, Theme } from '@mui/material';
import React, { useEffect } from 'react';
import { useIntervalWhen } from 'rooks';

type Props = {
  timeout: number;
  onClose: () => void;
  sx?: SxProps<Theme> | undefined
};

export const LinearProgressTimeout: React.FC<Props> = ({ timeout, sx, onClose }) => {
  const [countdown, setCoundown] = React.useState<number>(0);

  useIntervalWhen(() => {
    if (countdown < 100) {
      setCoundown(countdown + 1);
    }
  }, timeout / 100, true, true);

  useEffect(() => {
    if (countdown === 100) {
      onClose();
    }
  }, [ countdown ]);

  return <LinearProgress sx={sx} variant="determinate" value={countdown} />;
};