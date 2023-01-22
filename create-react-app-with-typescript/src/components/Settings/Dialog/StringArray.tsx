import { DeleteTwoTone } from '@mui/icons-material';
import {
  Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, List, ListItem, Stack, TextField, Typography,
} from '@mui/material';
import { isEqual } from 'lodash';
import React from 'react';

export const SettingsSystemsDialogStringArray: React.FC<{
  items: string[],
  onChange: (value: string[]) => void,
  title: string,
  helperText?: string,
}> = ({
  items,
  onChange,
  title,
  helperText,
}) => {
  const [ model, setModel ] = React.useState<string[]>(items);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setModel(items);
    }
  }, [open, items]);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const addNewMessage = () => {
    setModel(i => [...i, '']);
  };

  const deleteMessage = (idx: number) => {
    setModel(i => [...i.filter((_, index) => index !== idx)]);
  };

  const handleChange = (idx: number, value: string) => {
    setModel(i => {
      i[idx] = value;
      return [...i];
    });
  };

  const handleClose = () => {
    setOpen(false);
  };

  React.useEffect(() => {
    if (open && !isEqual(items, model)) {
      // update on model change
      onChange(model);
    }
  }, [model, onChange, open, items]);

  return <>
    <Button variant='outlined' onClick={handleClickOpen}>Edit</Button>
    <Dialog onClose={handleClose} open={open} scroll='paper' fullWidth maxWidth='xl'>
      <DialogTitle>{ title } <Typography variant='caption'>{ helperText }</Typography></DialogTitle>
      <DialogContent dividers>
        <List dense>
          {model.map((item: string, idx: number) => <ListItem key={idx}>
            <Stack direction='row' width='100%' alignItems={'center'}>
              <TextField id="outlined-basic" variant="outlined" value={item} fullWidth multiline onChange={(event) => handleChange(idx, event.currentTarget.value)}/>
              <IconButton onClick={() => deleteMessage(idx)} sx={{ height: 'fit-content' }}color='error'><DeleteTwoTone/></IconButton>
            </Stack>
          </ListItem>,
          )}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={addNewMessage}>Add</Button>
        <Button onClick={handleClose}>Close</Button>
      </DialogActions>
    </Dialog>
  </>;
};