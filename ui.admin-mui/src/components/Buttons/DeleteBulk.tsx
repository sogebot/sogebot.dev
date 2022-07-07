import {
  DeleteTwoTone,
} from '@mui/icons-material';
import { Button, Tooltip } from '@mui/material';
import * as React from 'react';

import { DialogDelete } from '~/src/components/Dialog/Delete';

export const ButtonsDeleteBulk: React.FC<{
  onDelete: () => void,
  disabled?: boolean,
}> = ({
  onDelete,
  disabled,
}) => {
  const [ open, setOpen ] = React.useState(false);

  const handleClick = () => {
    setOpen(true);
  };

  return (
    <>
      <Tooltip title="Delete">
        <span><Button onClick={handleClick} disabled={disabled} variant="contained" color="error" sx={{ minWidth: '36px', width: '36px' }}><DeleteTwoTone/></Button></span>
      </Tooltip>
      <DialogDelete open={open} setOpen={setOpen} onDelete={onDelete} isBulkOperation={true}/>
    </>
  );
};