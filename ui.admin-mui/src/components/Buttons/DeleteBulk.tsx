import { DeleteTwoTone } from '@mui/icons-material';
import { Button, Tooltip } from '@mui/material';
import React from 'react';

import { DialogDelete } from '../DialogDelete';

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
      <Tooltip arrow title="Delete">
        <Button onClick={handleClick} disabled={disabled} variant="contained" color="error" sx={{
          minWidth: '36px', width: '36px',
        }}><DeleteTwoTone/></Button>
      </Tooltip>
      <DialogDelete open={open} setOpen={setOpen} onDelete={onDelete} isBulkOperation={true}/>
    </>
  );
};