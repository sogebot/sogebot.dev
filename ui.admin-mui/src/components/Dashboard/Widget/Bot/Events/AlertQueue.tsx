import { mdiMouseLeftClick, mdiMouseRightClick } from '@mdi/js';
import Icon from '@mdi/react';
import { Box, CircularProgress, circularProgressClasses, Divider, IconButton, LinearProgress, Menu, MenuItem, Stack, Tooltip, Typography } from '@mui/material';
import PopupState, { bindContextMenu, bindMenu } from 'material-ui-popup-state';
import React from 'react';

import theme from '../../../../../theme';

enum AlertQueueState {
  PAUSED,
  PLAYING,
}

const AlertQueueController = () => {
  const [ state, setState ] = React.useState(AlertQueueState.PAUSED);
  const [ passthrough, setPassthrough ] = React.useState(false);

  return (
    <Box>
      <PopupState variant="popover">
        {(popupState) => (
          <React.Fragment>
            <Tooltip title={<>
              <Typography variant='caption'>Alert queue #1</Typography>
              <Typography component='div' variant='caption' sx={{
                display: 'flex',
                alignItems: 'center',
                pb: '4px',
                '& svg': { pr: 0.5 }
              }}>
                <Icon path={mdiMouseLeftClick} size={1} /> Play one
              </Typography>
              <Typography component='div' variant='caption' sx={{
                display: 'flex',
                alignItems: 'center',
                pb: '4px',
                '& svg': { pr: 0.5 }
              }}>
                <Icon path={mdiMouseRightClick} size={1} /> Context Menu
              </Typography>
            </>}>
              <IconButton sx={{
                width: 40, height: 40, position: 'relative',
              }} {...bindContextMenu(popupState)}>
                <Typography variant='caption' sx={{
                  position: 'absolute',
                  top: 3,
                }}>102</Typography>
                {state === AlertQueueState.PLAYING && <LinearProgress sx={{ width: '100%', height: '2px' }} />}
                {state !== AlertQueueState.PLAYING && <Divider sx={{ width: '100%', borderColor: theme.palette.grey[500] }}/>}
                <Typography variant='caption' sx={{
                  position: 'absolute',
                  bottom: 0,
                }}>#1</Typography>

                {passthrough
                  ? <CircularProgress color='primary' sx={{
                    position: 'absolute',
                    [`& .${circularProgressClasses.circle}`]: {
                      strokeLinecap: 'round',
                      opacity: 0.5,
                    },
                  }}/>
                  : <CircularProgress
                    variant="determinate"
                    value={100}
                    color='inherit' sx={{
                      position: 'absolute',
                      [`& .${circularProgressClasses.circle}`]: {
                        strokeLinecap: 'round',
                        opacity: 0.2,
                      },
                    }}/>}
              </IconButton>
            </Tooltip>
            <Menu {...bindMenu(popupState)} sx={{ '& .MuiList-root': { pb: '0px !important' } }}>
              <Typography sx={{ px: 1, mx: 1, mb: 1 }}>Alert Queue #1</Typography>
              <Divider sx={{ my: 1 }}/>
              <MenuItem disabled={state !== AlertQueueState.PAUSED}>
                <Stack>
                  <Typography variant='button'>Play one</Typography>
                  <Typography variant='caption'>Play first alert in queue</Typography>
                </Stack>
              </MenuItem>
              {state !== AlertQueueState.PLAYING && <MenuItem onClick={() => setState(AlertQueueState.PLAYING)}>
                <Stack>
                  <Typography variant='button'>Play all</Typography>
                  <Typography variant='caption'>Alerts will be played in queue order</Typography>
                </Stack>
              </MenuItem>}
              {state === AlertQueueState.PLAYING && <MenuItem onClick={() => setState(AlertQueueState.PAUSED)}>
                <Stack>
                  <Typography variant='button'>Pause queue</Typography>
                  <Typography variant='caption'>Pause next alert in queue.</Typography>
                </Stack>
              </MenuItem>}

              {passthrough
                ? <MenuItem onClick={() => setPassthrough(false)}>
                  <Stack>
                    <Typography variant='button'>Disable Passthrough</Typography>
                    <Typography variant='caption'>New alerts will be queued</Typography>
                  </Stack>
                </MenuItem>
                : <MenuItem onClick={() => setPassthrough(true)}>
                  <Stack>
                    <Typography variant='button'>Passthrough</Typography>
                    <Typography variant='caption'>New alerts will skip queue</Typography>
                  </Stack>
                </MenuItem>}
              <Divider/>
              <MenuItem><Typography variant='button'>Configure</Typography></MenuItem>
            </Menu>
          </React.Fragment>
        )}
      </PopupState>
    </Box>
  );
};

export { AlertQueueController };