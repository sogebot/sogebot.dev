import {
  Button, Dialog, DialogActions, DialogContent, DialogTitle, List, Typography,
} from '@mui/material';
import { isEqual } from 'lodash';
import React from 'react';

import { Item, SettingsSystemsDialogResultsInput } from '~/src/components/Settings/Dialog/ResultsInput';

export const SettingsSystemsDialogHeistResults: React.FC<{
  items: Item[],
  onChange: (value: Item[]) => void,
  onError: (haveErrors: boolean) => void;
  title: string,
  helperText?: string,
}> = ({
  items,
  onChange,
  onError,
  title,
  helperText,
}) => {
  const [ model, setModel ] = React.useState(items);
  const [open, setOpen] = React.useState(false);

  const [levelErrors, setErrors] = React.useState<number[]>([]);

  React.useEffect(() => {
    if (open) {
      setModel(items);
    }
  }, [open, items]);

  React.useEffect(() => {
    onError(levelErrors.length > 0);
  }, [levelErrors, onError]);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const addNewResult = () => {
    setModel(i => [...i, {
      message:    '<changeit>',
      percentage: 10,
    }]);
  };

  const deleteResult = (idx: number) => {
    setModel(i => [...i.filter((_, index) => index !== idx)]);
  };

  const handleChange = (idx: number, value: Item) => {
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

  const handleError = (idx: number, haveError: boolean) => {
    setErrors(errors => {
      errors = [...errors.filter(o => o !== idx)];
      if (haveError) {
        errors.push(idx);
      }
      return [...errors];
    });
  };

  return <>
    <Button variant='outlined' onClick={handleClickOpen} color={levelErrors.length > 0 ? 'error' : 'primary'}>Edit</Button>
    <Dialog onClose={handleClose} open={open} scroll='paper' fullWidth maxWidth='xl'>
      <DialogTitle>{ title } <Typography variant='caption'>{ helperText }</Typography></DialogTitle>
      <DialogContent dividers>
        <List dense>
          {model.map((item, idx) => <SettingsSystemsDialogResultsInput
            item={item}
            key={idx}
            onChange={(value) => handleChange(idx, value)}
            onError={haveError => handleError(idx, haveError)}
            onDelete={() => deleteResult(idx)}
          />
          )}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={addNewResult}>Add</Button>
        <Button onClick={handleClose}>Close</Button>
      </DialogActions>
    </Dialog>
  </>;
};