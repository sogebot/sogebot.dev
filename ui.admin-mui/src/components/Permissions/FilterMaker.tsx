import { DeleteTwoTone } from '@mui/icons-material';
import {
  Box,
  Button,
  Divider,
  FormControl,
  FormLabel,
  IconButton,
  MenuItem,
  Select,
  TextField,
} from '@mui/material';
import { Stack } from '@mui/system';
import { isEqual } from 'lodash';
import {
  useEffect, useMemo, useState,
} from 'react';
import { Permissions } from '~/../backend/dest/database/entity/permissions';

import { useTranslation } from '~/src/hooks/useTranslation';

export const FilterMaker: React.FC<{
  model: Permissions['filters'],
  onChange: (filter: Permissions['filters']) => void
}> = ({
  onChange, model,
}) => {
  const { translate } = useTranslation();
  const [ items, setItems ] = useState(model);

  const addNewFilter = () => {
    setItems(o => [...o, {
      comparator: '>=',
      type:       'watched',
      value:      '0',
    }]);
  };

  useEffect(() => {
    if (!isEqual(items, model)) {
      onChange(items);
    }
  }, [ items, onChange, model ]);

  const comparatorOptions = useMemo(() => [{
    value: '<', text: translate('core.permissions.isLowerThan'),
  }, {
    value: '<=', text: translate('core.permissions.isLowerThanOrEquals'),
  }, {
    value: '==', text: translate('core.permissions.equals'),
  }, {
    value: '>', text: translate('core.permissions.isHigherThan'),
  }, {
    value: '>=', text: translate('core.permissions.isHigherThanOrEquals'),
  }], [translate]);

  const updateFilter = <T extends keyof K, K extends Permissions['filters'][number]>(idx: number, attribute: T, value: K[T]) => {
    setItems((i) => {
      const _i = [...i] as K[];
      _i[idx][attribute] = value;
      return _i;
    });
  };

  const removeFilter = (idx: number) => {
    setItems(i => [...i.filter((_, idx2) => idx !== idx2)]);
  };

  return  <>
    <Divider sx={{ m: 1.5 }}>
      <FormLabel>{ translate('core.permissions.filters') }</FormLabel>
    </Divider>
    {items.map((o, idx) => <Stack direction='row' spacing={2} key={idx}>
      <FormControl fullWidth variant='filled' hiddenLabel>
        <Select
          value={o.type}
          onChange={(event) => updateFilter(idx, 'type', event.target.value as any)}
        >
          {['level', 'ranks', 'points', 'watched', 'tips', 'bits', 'messages', 'subtier', 'subcumulativemonths', 'substreakmonths']
            .map((item, idx2) => <MenuItem key={`MenuItem${idx2}`} value={item}>{translate('core.permissions.' + item)}</MenuItem>)}
        </Select>
      </FormControl>
      <FormControl fullWidth variant='filled' hiddenLabel>
        <Select
          value={o.comparator}
          onChange={(event) => updateFilter(idx, 'comparator', event.target.value as any)}
        >
          {comparatorOptions.map((item, idx2) => <MenuItem key={`MenuItem${idx2}`} value={item.value}>{item.text}</MenuItem>)}
        </Select>
      </FormControl>

      <TextField
        hiddenLabel
        variant='filled'
        fullWidth
        value={o.value}
        type='number'
        onChange={event => updateFilter(idx, 'value', String(Number(event.target.value.length === 0 ? '0' : event.target.value)))}
      />

      <IconButton color='error' sx={{
        height: 'fit-content', alignSelf: 'center',
      }} onClick={() => removeFilter(idx)}>
        <DeleteTwoTone/>
      </IconButton>
    </Stack>)}
    <Box sx={{ textAlign: 'center' }}>
      <Button sx={{ width: 200 }} onClick={addNewFilter}>{ translate('core.permissions.addFilter') }</Button>
    </Box>
  </>;
};