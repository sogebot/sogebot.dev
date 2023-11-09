import { Button, Dialog, DialogActions, DialogContent, DialogTitle, List, Typography } from '@mui/material';
import { isEqual } from 'lodash';
import React from 'react';

import { Item, SettingsSystemsDialogLevelsInput } from './LevelsInput';

export const SettingsSystemsDialogHeistLevels: React.FC<{
  items:         Item[],
  onChange:      (value: Item[]) => void,
  onLevelsError: (haveErrors: boolean) => void;
  title:         string,
  helperText?:   string,
}> = ({
  items,
  onChange,
  onLevelsError,
  title,
  helperText,
}) => {
  const [ model, setModel ] = React.useState(items);
  const [open, setOpen] = React.useState(false);

  const [levelErrors, setLevelErrors] = React.useState<number[]>([]);

  React.useEffect(() => {
    if (open) {
      setModel(items);
    }
  }, [open, items]);

  React.useEffect(() => {
    onLevelsError(levelErrors.length > 0);
  }, [levelErrors, onLevelsError]);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const addNewLevel = () => {
    setModel(i => [...i, {
      name:             '<changeit>',
      winPercentage:    10,
      payoutMultiplier: 1,
      maxUsers:         10,
    }]);
  };

  const deleteLevel = (idx: number) => {
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

  const handleLevelError = (idx: number, haveError: boolean) => {
    setLevelErrors(errors => {
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
          {model.map((item, idx) => <SettingsSystemsDialogLevelsInput
            item={item}
            key={idx}
            onChange={(value) => handleChange(idx, value)}
            onLevelsError={haveError => handleLevelError(idx, haveError)}
            onLevelDelete={() => deleteLevel(idx)}
          />,
          )}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={addNewLevel}>Add</Button>
        <Button onClick={handleClose}>Close</Button>
      </DialogActions>
    </Dialog>
  </>;
};