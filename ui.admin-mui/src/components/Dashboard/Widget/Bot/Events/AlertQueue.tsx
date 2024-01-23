import { mdiMouseLeftClick, mdiMouseRightClick } from '@mdi/js';
import Icon from '@mdi/react';
import { DeleteTwoTone } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import { Box, Button, Chip, CircularProgress, circularProgressClasses, Dialog, DialogActions, DialogContent, DialogTitle, Divider, IconButton, LinearProgress, Menu, MenuItem, Stack, Tooltip, Typography } from '@mui/material';
import { AlertQueue } from '@sogebot/backend/dest/database/entity/overlay';
import axios from 'axios';
import { useSetAtom } from 'jotai';
import { isEqual, some } from 'lodash';
import PopupState, { bindContextMenu, bindMenu } from 'material-ui-popup-state';
import React from 'react';

import { alertQueueAtom } from '../../../../../atoms';
import getAccessToken from '../../../../../getAccessToken';
import theme from '../../../../../theme';
import { events } from '../../../../Form/Overlay/AlertSettings/tester';

type Props = {
  queue: AlertQueue;
  index: number;
};

const AlertQueueController: React.FC<Props> = (props) => {
  const endpoint = `${JSON.parse(localStorage.server)}/api/registries/alerts/queue/${props.queue.id}`;
  const eventsCount = props.queue.emitData.length;
  const setQueue = useSetAtom(alertQueueAtom);

  const [ open, setOpen ] = React.useState(false);
  const [ deleting, setDeleting ] = React.useState(false);
  const [ saving, setSaving ] = React.useState({
    play: false,
    filter: false,
  });

  const [ filter, setFilter ] = React.useState(props.queue.filter);
  React.useEffect(() => {
    if (isEqual(props.queue.filter, filter)) {
      return;
    }
    setFilter(props.queue.filter);
  }, [props.queue.filter]);

  const openDialog = () => {
    setOpen(true);
  };
  const deleteQueue = (popupState: any) => {
    setDeleting(true);
    axios.delete(endpoint, { headers: { authorization: `Bearer ${getAccessToken()}` } })
      .finally(() => {
        setTimeout(() => {
          setOpen(false);
          popupState.close();
          setDeleting(false);
          setQueue(q => q.filter(it => it.id !== props.queue.id));
        }, 500);
      });
  };

  const [model, setModel] = React.useState<AlertQueue>(props.queue);
  React.useEffect(() => {
    if (isEqual(props.queue, model)) {
      return;
    }
    setModel(props.queue);
  }, [props.queue]);

  React.useEffect(() => {
    if (isEqual(props.queue, model)) {
      return;
    }

    setSaving(s => ({ ...s, play: true }));

    axios.patch(endpoint, {
      play: model.play !== props.queue.play ? model.play : undefined,
      passthrough: model.passthrough !== props.queue.passthrough ? model.passthrough : undefined,
    }, { headers: { authorization: `Bearer ${getAccessToken()}` } })
      .then(() => {
        setSaving(s => ({ ...s, play: false }));
      });
  }, [ model ]);

  const sendAlertToOverlay = () => {
    axios.post(`${JSON.parse(localStorage.server)}/api/registries/alerts/queue/${props.queue.id}/trigger`, {}, { headers: { authorization: `Bearer ${getAccessToken()}` } });
  };

  return (
    <Box>
      <PopupState variant="popover">
        {(popupState) => (
          <React.Fragment>
            <Tooltip title={<>
              <Typography variant='caption'>Alert queue #{props.index + 1}</Typography>
              {!model.play && <Typography component='div' variant='caption' sx={{
                display: 'flex',
                alignItems: 'center',
                pb: '4px',
                '& svg': { pr: 0.5 }
              }}>
                <Icon path={mdiMouseLeftClick} size={1} /> Play one
              </Typography>}
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
                }}>{eventsCount}</Typography>
                {model.play && <LinearProgress sx={{ width: '100%', height: '2px' }} />}
                {!model.play && <Divider sx={{ width: '100%', borderColor: theme.palette.grey[500] }}/>}
                <Typography variant='caption' sx={{
                  position: 'absolute',
                  bottom: 0,
                }}>#{props.index + 1}</Typography>

                {model.passthrough
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
            <Menu {...bindMenu(popupState)} sx={{ '& .MuiList-root': { pb: '0px !important', minWidth: 250 } }}>
              <Typography sx={{ px: 1, mx: 1, mb: 1 }}>Alert Queue #{props.index + 1}</Typography>
              <Divider sx={{ my: 1 }}/>
              <MenuItem disabled={model.play} onClick={sendAlertToOverlay}>
                <Stack>
                  <Typography variant='button'>Play one</Typography>
                  <Typography variant='caption'>Play first alert in queue</Typography>
                </Stack>
              </MenuItem>
              {!model.play && <MenuItem disabled={some(saving)} onClick={() => setModel(AlertQueue.create({ ...model, play: true }))}>
                <Stack>
                  <Typography variant='button'>Play all</Typography>
                  <Typography variant='caption'>Alerts will be played in queue order</Typography>
                </Stack>
              </MenuItem>}
              {model.play && <MenuItem disabled={some(saving)} onClick={() => setModel(AlertQueue.create({ ...model, play: false }))}>
                <Stack>
                  <Typography variant='button'>Pause queue</Typography>
                  <Typography variant='caption'>Pause next alert in queue.</Typography>
                </Stack>
              </MenuItem>}

              {model.passthrough
                ? <MenuItem disabled={some(saving)} onClick={() => setModel(AlertQueue.create({ ...model, passthrough: false }))}>
                  <Stack>
                    <Typography variant='button'>Disable Passthrough</Typography>
                    <Typography variant='caption'>New alerts will be queued</Typography>
                  </Stack>
                </MenuItem>
                : <MenuItem disabled={some(saving)} onClick={() => setModel(AlertQueue.create({ ...model, passthrough: true }))}>
                  <Stack>
                    <Typography variant='button'>Passthrough</Typography>
                    <Typography variant='caption'>New alerts will skip queue</Typography>
                  </Stack>
                </MenuItem>}
              <Divider/>
              <MenuItem onClick={openDialog}>
                <Typography variant='button'>Configure</Typography>

                <Dialog open={open}>
                  <DialogTitle>
                    Alert Queue #{props.index + 1} settings
                    <IconButton disabled={deleting} color='error' sx={{ position: 'absolute', right: 8, top: 12 }} onClick={() => {
                      deleteQueue(popupState);
                    }}>
                      {deleting
                        ? <CircularProgress size={24}/>
                        : <DeleteTwoTone/>}
                    </IconButton>
                  </DialogTitle>
                  <DialogContent dividers>
                    <Typography>Select events to queue</Typography>
                    <Box sx={{ margin: 'auto', textAlign: 'center' }}>
                      {events.map(ev =>
                        ev in filter
                          ? <Chip sx={{ m: 0.2 }} label={ev} color='primary' onClick={() => {
                            const newFilter = filter;
                            delete newFilter[ev];
                            setFilter({ ...newFilter });
                          }}/>
                          : <Chip sx={{ m: 0.2 }} label={ev} color='dark' onClick={() => {
                            setFilter(f => ({ ...f, [ev]: null }));
                          }}/>)}
                    </Box>
                  </DialogContent>
                  <DialogActions>
                    <Button onClick={(ev) => {
                      ev.stopPropagation();
                      setOpen(false);
                      // revert filter changes
                      setFilter(props.queue.filter);
                    }}>Close</Button>
                    <LoadingButton loading={saving.filter} variant='contained' onClick={(ev) => {
                      ev.stopPropagation();
                      setSaving(s => ({ ...s, filter: true }));
                    }}>Save</LoadingButton>
                  </DialogActions>
                </Dialog>
              </MenuItem>
            </Menu>
          </React.Fragment>
        )}
      </PopupState>
    </Box>
  );
};

export { AlertQueueController };