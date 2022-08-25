import { Checkbox, TableCell } from '@mui/material';
import { useCallback } from 'react';

export const useBoolFilter = () => {
  const handleChange = useCallback((filter: { value: boolean; } | null, onFilter: (arg0: { value: boolean; } | null) => void) => {
    if (filter === null) {
      onFilter({ value: false });
    } else if (filter.value === false) {
      onFilter({ value: true });
    } else {
      onFilter(null);
    }
  }, [ ]);

  const Cell = useCallback(({ filter, onFilter }: { filter: any, onFilter: any }) => (
    <TableCell sx={{
      width: '100%', p: 1, textAlign: 'center',
    }}>
      <Checkbox
        checked={filter === null ? false : filter.value}
        indeterminate={filter === null}
        onChange={() => handleChange(filter, onFilter)}
      />
    </TableCell>
  ), [handleChange]);
  return { Cell };
};