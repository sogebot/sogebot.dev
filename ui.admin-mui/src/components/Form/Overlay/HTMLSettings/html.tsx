import Editor from '@monaco-editor/react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormLabel, Paper, PaperProps, Stack } from '@mui/material';
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
export const HTMLDialog: React.FC<Props> = ({ onChange, model }) => {
  const [ open, setOpen ] = React.useState(false);

  return <>
    <Stack direction='row' spacing={2} justifyContent='space-between' alignItems="center" sx={{ padding: '15px 20px 0px 0' }}>
      <FormLabel sx={{ width: '170px' }}>HTML</FormLabel>
      <Button onClick={() => setOpen(true)} variant='contained'>Edit</Button>
    </Stack>

    <Dialog
      fullWidth
      disableEnforceFocus
      style={{ pointerEvents: 'none' }}
      PaperProps={{ style: { pointerEvents: 'auto' } }}
      maxWidth='md'
      hideBackdrop
      PaperComponent={PaperComponent}
      onClose={() => setOpen(false)}
      open={open}>
      <DialogTitle style={{ cursor: 'move' }} id="draggable-dialog-title">
        HTML
      </DialogTitle>
      <DialogContent sx={{ p: 0 }} dividers>
        <Box className="monaco-editor no-user-select  showUnused showDeprecated vs-dark"
          sx={{
            background: 'repeating-linear-gradient( -45deg, #000000, #392222 0px)',
            cursor:     'not-allowed',
            userSelect: 'none',
          }}>
          <div className="margin" role="presentation" aria-hidden="true" style={{
            position:  'absolute',
            transform: 'translate3d(0px, 0px, 0px)',
            contain:   'strict',
            top:       '0px',
            width:     '64px',
            height:    '38px',
          }}>
            <div className="margin-view-zones" role="presentation" aria-hidden="true" style={{ position: 'absolute' }}></div>
            <div className="margin-view-overlays" role="presentation" aria-hidden="true" style={{
              position:      'absolute',
              fontFamily:    'Consolas, "Courier New", monospace',
              fontWeight:    'normal',
              fontSize:      '14px',
              lineHeight:    '19px',
              letterSpacing: '0px',
              width:         '64px',
              height:        '540px',
            }}>
              <div style={{
                position: 'absolute',top: '0px',width: '100%',height: '19px',
              }}>
                <div className="line-numbers" style={{
                  left: '0px',width: '38px', color: 'red !important',
                }}>1</div>
                <div className="line-numbers" style={{
                  left: '0px',width: '38px', top: '20px',
                }}>2</div>
              </div>
            </div>
          </div>
          <Box className="vs-dark" sx={{
            width:         '100%',
            pl:            8,
            height:        '19px',
            fontFamily:    'Consolas, "Courier New", monospace',
            fontWeight:    'normal',
            fontSize:      '14px',
            lineHeight:    '19px',
            letterSpacing: '0px',
          }}>
            <span style={{ color: '#808073' }}>&lt;</span>
            <span style={{ color: '#5199b8' }}>html</span>
            <span style={{ color: '#808073' }}>&gt;</span>
          </Box>
          <Box sx={{
            width:         '100%',
            pl:            10,
            height:        '19px',
            fontFamily:    'Consolas, "Courier New", monospace',
            fontWeight:    'normal',
            fontSize:      '14px',
            lineHeight:    '19px',
            letterSpacing: '0px',
          }}>
            <span style={{ color: '#808073' }}>&lt;</span>
            <span style={{ color: '#5199b8' }}>body{' '}
              <span style={{ color: '#88dad8' }}>id</span>
              <span style={{ color: '#808073' }}>=</span>
              <span style={{ color: '#d38e6e' }}>"wrapper"</span>
            </span>
            <span style={{ color: '#808073' }}>&gt;</span>
          </Box>
        </Box>

        <Editor
          height="44vh"
          width="100%"
          language={'html'}
          defaultValue={model}
          theme='vs-dark'
          onChange={value => onChange(value ?? '')}
          options={{
            lineNumbers: num => String(num + 2),
            wordWrap:    'on',
          }}
        />
        <Box className="monaco-editor no-user-select  showUnused showDeprecated vs-dark"
          sx={{
            background: 'repeating-linear-gradient( -45deg, #000000, #392222 0px)',
            cursor:     'not-allowed',
            userSelect: 'none',
          }}>
          <div className="margin" role="presentation" aria-hidden="true" style={{
            position:  'absolute',
            transform: 'translate3d(0px, 0px, 0px)',
            contain:   'strict',
            top:       '0px',
            width:     '64px',
            height:    '38px',
          }}>
            <div className="margin-view-zones" role="presentation" aria-hidden="true" style={{ position: 'absolute' }}></div>
            <div className="margin-view-overlays" role="presentation" aria-hidden="true" style={{
              position:      'absolute',
              fontFamily:    'Consolas, "Courier New", monospace',
              fontWeight:    'normal',
              fontSize:      '14px',
              lineHeight:    '19px',
              letterSpacing: '0px',
              width:         '64px',
              height:        '540px',
            }}>
              <div style={{
                position: 'absolute',top: '0px',width: '100%',height: '19px',
              }}>
                <div className="line-numbers" style={{
                  left: '0px',width: '38px', color: 'red !important',
                }}>{model.split('\n').length + 3}</div>
                <div className="line-numbers" style={{
                  left: '0px',width: '38px', top: '20px',
                }}>{model.split('\n').length + 4}</div>
              </div>
            </div>
          </div>
          <Box sx={{
            width:         '100%',
            pl:            10,
            height:        '19px',
            fontFamily:    'Consolas, "Courier New", monospace',
            fontWeight:    'normal',
            fontSize:      '14px',
            lineHeight:    '19px',
            letterSpacing: '0px',
          }}>
            <span style={{ color: '#808073' }}>&lt;/</span>
            <span style={{ color: '#5199b8' }}>body</span>
            <span style={{ color: '#808073' }}>&gt;</span>
          </Box>
          <Box className="vs-dark" sx={{
            width:         '100%',
            pl:            8,
            height:        '19px',
            fontFamily:    'Consolas, "Courier New", monospace',
            fontWeight:    'normal',
            fontSize:      '14px',
            lineHeight:    '19px',
            letterSpacing: '0px',
          }}>
            <span style={{ color: '#808073' }}>&lt;/</span>
            <span style={{ color: '#5199b8' }}>html</span>
            <span style={{ color: '#808073' }}>&gt;</span>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpen(false)}>Close</Button>
      </DialogActions>
    </Dialog>
  </>;
};