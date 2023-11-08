import { Functions } from '@mui/icons-material';
import {
  Autocomplete,
  IconButton,
  Popover,
  TextField,
} from '@mui/material';
import {
  bindPopover,
  bindTrigger,
  usePopupState,
} from 'material-ui-popup-state/hooks';
import React, { useCallback, useMemo } from 'react';

import { useTranslation } from '../../../../hooks/useTranslation';

export const FormInputAdornmentCustomVariable: React.FC<{
  onSelect: (value: string) => void,
  additionalVariables?: string[]
}> = ({
  onSelect, additionalVariables,
}) => {
  const popupState = usePopupState({
    variant: 'popover',
    popupId: 'demoPopover',
  });

  const { translate } = useTranslation();

  const options = useMemo(() => {
    const globalFilters = [
      'title', 'game', 'viewers', 'followers',
      'subscribers', 'spotifySong', 'ytSong', 'latestFollower',
      'latestSubscriber', 'latestSubscriberMonths', 'latestSubscriberStreak',
      'latestTipAmount', 'latestTipCurrency', 'latestTipMessage', 'latestTip',
      'toptip.overall.username', 'toptip.overall.amount', 'toptip.overall.currency',
      'toptip.overall.message', 'toptip.stream.username', 'toptip.stream.amount',
      'toptip.stream.currency', 'toptip.stream.message', 'latestCheerAmount', 'latestCheerMessage',
      'latestCheer', 'isBotSubscriber', 'isStreamOnline', 'uptime',
    ];
    return [...globalFilters, ...(additionalVariables ?? [])].map(o => ({
      label: translate('responses.variable.' + o), id: `$${o}`,
    }));
  }, [translate, additionalVariables]);

  const onChangeHandle = useCallback((value: {
    label: string;
    id: string;
  } | null) => {
    if (value) {
      onSelect(value.id);
      popupState.close();
    }
  }, [ popupState, onSelect ]);

  return (
    <>
      <IconButton {...bindTrigger(popupState)}><Functions/></IconButton>
      <Popover
        {...bindPopover(popupState)}
      >
        <Autocomplete
          sx={{ width: '350px' }}
          options={options}
          onChange={(event, value) => onChangeHandle(value)}
          renderInput={(params) => <TextField {...params} label="Select variable" variant='filled' />}
        />
      </Popover>
    </>
  );
};