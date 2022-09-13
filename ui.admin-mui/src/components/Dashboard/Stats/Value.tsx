import { Typography } from '@mui/material';
import parse from 'html-react-parser';
import * as React from 'react';
import { useSelector } from 'react-redux';

import theme from '~/src/theme';

export const Value: React.FC<{current: number, isStreamOnline: boolean, showValueIfOffline?: boolean, type?: 'bigNumber' | 'hours' | 'currency'}> = (props) => {
  const { configuration } = useSelector((state: any) => state.loader);

  const value = React.useMemo(() => {
    const numberReducer = (out: string, item: any) => {
      if (['currency', 'compact'].includes(item.type)) {
        out += `<small style="color: ${theme.palette.primary.dark};">${item.value}</small>`;
      } else {
        out += item.value;
      }
      return out;
    };

    const type = props.type;

    if (type === 'bigNumber') {
      return Intl.NumberFormat(configuration.lang, {
        notation:              configuration.core.ui.shortennumbers ? 'compact' : 'standard',
        maximumFractionDigits: configuration.core.ui.shortennumbers ? 1 : 0,
      }).formatToParts((props.isStreamOnline || props.showValueIfOffline) ? props.current || 0 : 0).reduce(numberReducer, '');
    }

    if (type === 'currency') {
      return Intl.NumberFormat(configuration.lang, {
        style:    'currency',
        currency: configuration.currency,
      }).formatToParts((props.isStreamOnline || props.showValueIfOffline) ? props.current || 0 : 0).reduce(numberReducer, '');
    }

    if (type ==='hours') {
      return [
        ...Intl.NumberFormat(configuration.lang, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).formatToParts(((props.isStreamOnline || props.showValueIfOffline) ? props.current || 0 : 0) / 1000 / 60 / 60),
        {
          type: '', value: ' ', 
        },
        {
          type: 'currency', value: 'h', 
        },
      ].reduce(numberReducer, '');
    }

    return Intl.NumberFormat(configuration.lang).format(
      (props.isStreamOnline || props.showValueIfOffline)
        ? props.current
        : 0
    );
  }, [props, configuration]);

  return (
    <Typography component='span'>{parse(value)}</Typography>
  );
};