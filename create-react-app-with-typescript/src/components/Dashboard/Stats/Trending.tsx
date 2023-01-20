import {
  AllInclusive, TrendingDown, TrendingUp,
} from '@mui/icons-material';
import {
  Box, Stack, Typography,
} from '@mui/material';
import parse from 'html-react-parser';
import React from 'react';
import { useSelector } from 'react-redux';

import theme from '../../../theme';

export const Trending: React.FC<{average: number, current: number, isStreamOnline: boolean, type?: 'bigNumber'}> = (props) => {
  const { configuration } = useSelector((state: any) => state.loader);

  const numberReducer = (out: string, item: any) => {
    if (['currency', 'compact'].includes(item.type)) {
      out += `<small style="color: ${theme.palette.primary.dark};">${Math.abs(item.value)}</small>`;
    } else {
      out += item.value;
    }
    return out;
  };

  const isTrending = React.useMemo(() => {
    return props.average < props.current;
  }, [props]);

  const htmlProps = React.useMemo(() => {
    return {
      sx: {
        fontSize: '14px',
        position: 'relative',
        top:      isTrending ? '-5px' : '5px',
      },
    };
  }, [isTrending]);

  const value = React.useMemo(() => {
    const type = props.type;

    if (type === 'bigNumber') {
      return Intl.NumberFormat(configuration.lang, {
        style:                 configuration.core.ui.percentage ? 'percent' : 'decimal',
        notation:              configuration.core.ui.shortennumbers && !configuration.core.ui.percentage ? 'compact' : 'standard',
        maximumFractionDigits: configuration.core.ui.shortennumbers && !configuration.core.ui.percentage ? 1 : 0,
      }).format(Math.abs(configuration.core.ui.percentage ? Math.abs(props.current - props.average) / props.average : props.current - props.average));
    }

    if (type === 'currency') {
      return Intl.NumberFormat(configuration.lang, {
        style:    configuration.core.ui.percentage ? 'percent' : 'currency',
        currency: configuration.currency,
      }).format(Math.abs(configuration.core.ui.percentage ? Math.abs(props.current - props.average) / (props.average || 1) : props.current - props.average));
    }

    if (type ==='hours') {
      if (configuration.core.ui.percentage) {
        return [
          ...Intl.NumberFormat(configuration.lang, { style: 'percent' }).formatToParts(props.average / props.current),
        ].reduce(numberReducer, '');
      } else {
        return [
          ...Intl.NumberFormat(configuration.lang, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).formatToParts((props.current - props.average) / 1000 / 60 / 60),
          {
            type: '', value: ' ',
          },
          {
            type: '', value: 'h',
          },
        ].reduce(numberReducer, '');
      }
    }

    return Intl.NumberFormat(configuration.lang, { style: configuration.core.ui.percentage ? 'percent' : 'decimal' }).format(Math.abs(configuration.core.ui.percentage ? Math.abs(props.current - props.average) / (props.average || 1) : props.current - props.average));
  }, [props, configuration]);

  return (
    <Box component="span" sx={{
      color:      isTrending ? 'green' : 'red',
      display:    'inline-block',
      position:   'relative',
      alignItems: 'center',
      height:     '15px',
      overflow:   'visible',
    }}>
      {props.isStreamOnline && configuration.core.ui.showdiff && props.current - props.average !== 0 && <Stack direction={'row'}>
        {props.average === 0 && configuration.core.ui.percentage && <AllInclusive {...htmlProps} /> }
        {props.average !== 0 && (isTrending ? <TrendingUp {...htmlProps} /> : <TrendingDown {...htmlProps} />)}
        <Typography component='span' {...htmlProps}>{parse(value)}</Typography>
      </Stack>}
    </Box>
  );
};