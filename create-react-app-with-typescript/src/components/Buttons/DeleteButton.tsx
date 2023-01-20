import { DeleteTwoTone } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import React from 'react';

import { DialogDelete } from '../DialogDelete';

export const DeleteButton: React.FC<{
  onDelete: () => void,
}> = ({
  onDelete,
}) => {
  const [ open, setOpen ] = React.useState(false);

  const handleClick = () => {
    setOpen(true);
  };

  return (
    <>
      <IconButton onClick={handleClick}>
        <DeleteTwoTone color="error"/>
      </IconButton>
      <DialogDelete open={open} setOpen={setOpen} onDelete={onDelete}/>
    </>
  );
};