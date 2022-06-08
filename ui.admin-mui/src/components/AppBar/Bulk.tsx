import DeleteIcon from '@mui/icons-material/Delete';
import {
  Button, Fade, FormControl, Stack,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';

import { toggleBulkDialog } from '../../store/appbarSlice';

export const Bulk: React.FC = () => {
  const { haveBulk, bulkCount } = useSelector((state: any) => state.appbar);
  const dispatch = useDispatch();

  return (
    <Fade in={haveBulk && bulkCount > 0}>
      <FormControl sx={{ pr: 4 }}>
        <Stack direction='row' alignItems='center' spacing={1}>
          <div>{bulkCount} items selected</div>
          <Button variant="contained" color="secondary" onClick={() => dispatch(toggleBulkDialog())}>Bulk Update</Button>
          <Button variant="contained" color="error" startIcon={<DeleteIcon/>}>Delete</Button>
        </Stack>
      </FormControl>
    </Fade>
  );
};