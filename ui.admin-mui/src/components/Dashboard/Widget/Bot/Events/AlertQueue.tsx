import { mdiMouseLeftClick, mdiMouseRightClick } from '@mdi/js';
import Icon from '@mdi/react';
import { Box, CircularProgress, circularProgressClasses, Divider, IconButton, Menu, MenuItem, Tooltip, Typography } from '@mui/material';
import PopupState, { bindContextMenu, bindMenu } from 'material-ui-popup-state';
import React from 'react';

import theme from '../../../../../theme';

enum AlertQueueState {
  PAUSED,
  CONTINUOUS,
}

const AlertQueueController = () => {
  const [ state, setState ] = React.useState(AlertQueueState.PAUSED);

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
                <Divider sx={{ width: '100%', borderColor: theme.palette.grey[500] }}/>
                <Typography variant='caption' sx={{
                  position: 'absolute',
                  bottom: 0,
                }}>#1</Typography>

                {state === AlertQueueState.PAUSED && <CircularProgress
                  variant="determinate"
                  value={100}
                  color='inherit' sx={{
                    position: 'absolute',
                    [`& .${circularProgressClasses.circle}`]: {
                      strokeLinecap: 'round',
                      opacity: 0.2,
                    },
                  }}/>}

                {state === AlertQueueState.CONTINUOUS && <CircularProgress color='primary' sx={{
                  position: 'absolute',
                  [`& .${circularProgressClasses.circle}`]: {
                    strokeLinecap: 'round',
                    opacity: 0.5,
                  },
                }}/>}
              </IconButton>
            </Tooltip>
            <Menu {...bindMenu(popupState)} sx={{ '& .MuiList-root': { p: '0px !important' } }}>
              {state === AlertQueueState.CONTINUOUS && <MenuItem onClick={() => setState(AlertQueueState.PAUSED)}>
                <Typography variant='button'>Pause&nbsp;<strong>#1</strong></Typography>
              </MenuItem>}
              {state === AlertQueueState.PAUSED && <MenuItem>
                <Typography variant='button'>Play one&nbsp;<strong>#1</strong></Typography>
              </MenuItem>}
              {state === AlertQueueState.PAUSED && <MenuItem onClick={() => setState(AlertQueueState.CONTINUOUS)}>
                <Typography variant='button'>Passthrough&nbsp;<strong>#1</strong></Typography>
              </MenuItem>}
              <Divider/>
              <MenuItem><Typography variant='button'>Configure&nbsp;<strong>#1</strong></Typography></MenuItem>
            </Menu>
          </React.Fragment>
        )}
      </PopupState>
    </Box>
  );
};

export { AlertQueueController };