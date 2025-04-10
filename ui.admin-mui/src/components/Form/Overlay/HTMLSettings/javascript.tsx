import Editor from '@monaco-editor/react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, FormLabel, Paper, PaperProps, Stack } from '@mui/material';
import React from 'react';

type Props = {
  model: string,
  onChange(value: string): void,
};
export const JavascriptDialog: React.FC<Props> = ({ onChange, model }) => {
  const [ open, setOpen ] = React.useState(false);

  return <>
    <Stack direction='row' spacing={2} justifyContent='space-between' alignItems="center" sx={{ padding: '15px 20px 0px 0' }}>
      <FormLabel sx={{ width: '170px' }}>Javascript</FormLabel>
      <Button onClick={() => setOpen(true)} variant='contained'>Edit</Button>
    </Stack>

    <Dialog
      fullWidth
      disableEnforceFocus
      style={{ pointerEvents: 'none' }}
      PaperProps={{ style: { pointerEvents: 'auto' } }}
      maxWidth='md'
      hideBackdrop
      onClose={() => setOpen(false)}
      open={open}>
      <DialogTitle id="draggable-dialog-title">
        Javascript
      </DialogTitle>
      <DialogContent sx={{ p: 0 }} dividers>
        <Editor
          height="44vh"
          width="100%"
          language={'javascript'}
          defaultValue={model}
          theme='vs-dark'
          onChange={value => onChange(value ?? '')}
          options={{ wordWrap: 'on' }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpen(false)}>Close</Button>
      </DialogActions>
    </Dialog>
  </>;
};