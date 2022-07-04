import { Delete } from '@mui/icons-material';
import {
  Box, Button, IconButton, Popover, Stack, Typography,
} from '@mui/material';
import * as React from 'react';

export const DashboardWidgetActionButtonsDelete: React.FC<{
  onDelete: () => void,
}> = ({
  onDelete,
}) => {
  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <IconButton onClick={handleClick}>
        <Delete color="error"/>
      </IconButton>
      <Popover
        id="delete-popover"
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical:   'center',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical:   'center',
          horizontal: 'right',
        }}
      >
        <Box sx={{ p: 1 }}>
          <Typography>Do you want to delete this item?</Typography>
          <Stack spacing={2} direction='row' sx={{ pt: 2 }}>
            <Button fullWidth color="error" variant="contained" onClick={() => {
              setAnchorEl(null); onDelete();
            }}>Delete</Button>
            <Button fullWidth onClick={() => setAnchorEl(null)}>Cancel</Button>
          </Stack>
        </Box>
      </Popover>
    </>
  );
};