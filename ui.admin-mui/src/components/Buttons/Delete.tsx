import { Delete } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import * as React from 'react';
import { DialogDelete } from '~/src/components/Dialog/Delete';

export const DashboardWidgetActionButtonsDelete: React.FC<{
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
        <Delete color="error"/>
      </IconButton>
      <DialogDelete open={open} setOpen={setOpen} onDelete={onDelete}/>
    </>
  );
};