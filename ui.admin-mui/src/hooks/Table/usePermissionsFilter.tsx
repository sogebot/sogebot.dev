import {
  MenuItem, Select, TableCell, Typography,
} from '@mui/material';
import { grey } from '@mui/material/colors';
import { useCallback } from 'react';

import { usePermissions } from '~/src/hooks/usePermissions';

export const usePermissionsFilter = (props?: { showDisabled: boolean }) => {
  const { permissions } = usePermissions();

  const Cell = useCallback(({ filter, onFilter }: { filter: any, onFilter: any }) => (
    <TableCell sx={{ width: '100%', p: 1 }}>
      <Select
        variant='standard'
        fullWidth
        multiple
        displayEmpty
        value={filter ? filter.value : []}
        onChange={e => onFilter(e.target.value ? { value: e.target.value } : null)}
        renderValue={(selected: string[]) => {
          if (selected.length === 0) {
            return <Typography sx={{
              color: grey[600], fontSize: '14px', fontWeight: 'bold', position: 'relative', top: '2px',
            }}>Filter...</Typography>;
          }

          return selected.map(o => permissions.find(p => o === p.id)?.name || 'Disabled').join(', ');
        }}
      >
        {props?.showDisabled && <MenuItem value="">Disabled</MenuItem>}
        {permissions?.map(o => (<MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>))}
      </Select>
    </TableCell>
  ), [ permissions, props?.showDisabled ]);
  return { Cell };
};