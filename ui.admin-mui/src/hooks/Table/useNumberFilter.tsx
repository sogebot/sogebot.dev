import {
  Button, Input, TableCell,
} from '@mui/material';
import { useCallback } from 'react';

const types = ['=', '>', '<'];

export const useNumberFilter = () => {
  const handleChange = (value: any, filter: any, onFilter: (arg0: any) => void) => {
    onFilter({ ...filter, value });
  };

  const handleFilterType = useCallback((filter: any, onFilter: any) => {
    const idx = types.indexOf(filter.type);
    if (types[idx + 1]) {
      onFilter({
        ...filter,
        type: types[idx + 1],
      });
    } else {
      onFilter({
        ...filter,
        type: types[0],
      });
    }
  }, []);

  const Icon = useCallback(({ filter, onFilter }: { filter: any, onFilter: any }) => {
    if (!filter) {
      onFilter({ type: '=', value: '' });
      return <Button onClick={() => handleFilterType(filter, onFilter)}>=</Button>;
    }
    return <Button onClick={() => handleFilterType(filter, onFilter)}>{filter.type}</Button>;
  }, [handleFilterType]);

  const Cell = useCallback(({ filter, onFilter }: { filter: any, onFilter: any }) => (
    <TableCell sx={{
      width: '100%', p: 1, textAlign: 'center',
    }}>
      <Input
        fullWidth
        placeholder='Filter...'
        value={filter?.value ?? ''}
        type='number'
        onChange={(ev) => handleChange(ev.currentTarget.value, filter, onFilter)}
        startAdornment={<Icon filter={filter} onFilter={onFilter}/>}
      />
    </TableCell>
  ), [Icon]);
  return { Cell };
};