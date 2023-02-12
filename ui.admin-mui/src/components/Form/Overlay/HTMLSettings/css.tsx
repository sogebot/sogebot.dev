import Editor from '@monaco-editor/react';
import {
  Button, Dialog, DialogActions, DialogContent, DialogTitle, FormLabel, Paper, PaperProps, Stack,
} from '@mui/material';
import React from 'react';
import Draggable from 'react-draggable';

function PaperComponent(props: PaperProps) {
  return (
    <Draggable cancel={'[class*="MuiDialogContent-root"]'}>
      <Paper {...props} />
    </Draggable>
  );
}

type Props = {
  model: string,
  onChange(value: string): void,
};
export const CSSDialog: React.FC<Props> = ({ onChange, model }) => {
  const [ open, setOpen ] = React.useState(false);

  return <>
    <Stack direction='row' spacing={2} justifyContent='space-between' alignItems="center" sx={{ padding: '15px 20px 0px 0' }}>
      <FormLabel sx={{ width: '170px' }}>CSS</FormLabel>
      <Button onClick={() => setOpen(true)} variant='contained'>Edit</Button>
    </Stack>

    <Dialog
      fullWidth
      disableEnforceFocus
      style={{ pointerEvents: 'none' }}
      PaperProps={{ style: { pointerEvents: 'auto' } }}
      maxWidth='sm'
      hideBackdrop
      PaperComponent={PaperComponent}
      onClose={() => setOpen(false)}
      open={open}>
      <DialogTitle style={{ cursor: 'move' }} id="draggable-dialog-title">
        CSS
      </DialogTitle>
      <DialogContent>
        <Editor
          height="44vh"
          width="100%"
          language={'css'}
          defaultValue={model}
          theme='vs-dark'
          onChange={value => onChange(value ?? '')}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpen(false)}>Close</Button>
      </DialogActions>
    </Dialog>
  </>;
};