import { mdiMouseLeftClick, mdiMouseRightClick } from '@mdi/js';
import Icon from '@mdi/react';
import { DeleteTwoTone, SettingsTwoTone } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import { Box, Button, Chip, CircularProgress, circularProgressClasses, Dialog, DialogActions, DialogContent, DialogTitle, Divider, IconButton, LinearProgress, Menu, MenuItem, Stack, Tooltip, Typography } from '@mui/material';
import { AlertQueue } from '@sogebot/backend/dest/database/entity/overlay';
import axios from 'axios';
import { useSetAtom } from 'jotai';
import { isEqual } from 'lodash';
import { useConfirm } from 'material-ui-confirm';
import PopupState, { bindContextMenu, bindMenu } from 'material-ui-popup-state';
import { useSnackbar } from 'notistack';
import React from 'react';

import { alertQueueAtom } from '../../../../../atoms';
import getAccessToken from '../../../../../getAccessToken';
import theme from '../../../../../theme';
import { AccordionFilter } from '../../../../Form/Overlay/AlertSettings/Accordion/Filter';
import { rules } from '../../../../Form/Overlay/AlertSettings/src/rules';
import { events } from '../../../../Form/Overlay/AlertSettings/tester';

type Props = {
  queue: AlertQueue;
  index: number;
};

const AlertQueueController: React.FC<Props> = (props) => {
  const endpoint = `${JSON.parse(localStorage.server)}/api/registries/alerts/queue/${props.queue.id}`;
  const eventsCount = props.queue.emitData.length;
  const setQueue = useSetAtom(alertQueueAtom);

  const { enqueueSnackbar } = useSnackbar();
  const confirm = useConfirm();

  const [ open, setOpen ] = React.useState(false);
  const [ configureEvent, setConfigureEvent ] = React.useState<string | null>(null);
  const [ deleting, setDeleting ] = React.useState(false);
  const [ saving, setSaving ] = React.useState(false);

  React.useEffect(() => {
    setConfigureEvent(null);
  }, [ open ]);

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

    setSaving(true);
    axios.patch(endpoint, {
      play: model.play !== props.queue.play ? model.play : undefined,
      passthrough: model.passthrough !== props.queue.passthrough ? model.passthrough : undefined,
      filter: !isEqual(model.filter, props.queue.filter) ? model.filter : undefined,
    }, { headers: { authorization: `Bearer ${getAccessToken()}` } })
      .then(() => {
        setSaving(false);
        enqueueSnackbar('Alert queue updated.', { variant: 'success' });
      });
  }, [ model ]);

  const sendAlertToOverlay = () => {
    if (model.play) {
      console.log('Alert queue is playing, cannot send alert to overlay.');
      return;
    }
    if (model.emitData.length === 0) {
      console.log('Alert queue is empty, cannot send alert to overlay.');
      return;
    }
    axios.post(`${JSON.parse(localStorage.server)}/api/registries/alerts/queue/${props.queue.id}/trigger`, {}, { headers: { authorization: `Bearer ${getAccessToken()}` } })
      .then(() => {
        enqueueSnackbar('Alert sent to overlay from queue.', { variant: 'success' });
      });
  };

  const resetQueue = React.useCallback((popupState: any) => {
    confirm({ description: 'This action is permanent!' })
      .then(() => {
        popupState.close();
        axios.post(`${JSON.parse(localStorage.server)}/api/registries/alerts/queue/${props.queue.id}/reset`, {}, { headers: { authorization: `Bearer ${getAccessToken()}` } })
          .then(() => {
            enqueueSnackbar('Alert queue reset.', { variant: 'success' });
          });
      }).catch(() => {});
  }, [confirm]);

  return (
    <Box>
      <PopupState variant="popover">
        {(popupState) => (
          <React.Fragment>
            <Tooltip title={<>
              <Typography variant='caption'>Alert queue #{props.index + 1}</Typography>
              {(!model.play && model.emitData.length > 0) && <Typography component='div' variant='caption' sx={{
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
                '& svg': { pr: 0.5 }
              }}>
                <Icon path={mdiMouseRightClick} size={1} /> Context Menu
              </Typography>
            </>}>
              <IconButton onClick={sendAlertToOverlay} sx={{
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
                  ? <CircularProgress
                    variant="determinate"
                    value={100}
                    color='inherit' sx={{
                      position: 'absolute',
                      [`& .${circularProgressClasses.circle}`]: {
                        strokeLinecap: 'round',
                        opacity: 0.2,
                      },
                    }}/>
                  : <CircularProgress
                    variant="determinate"
                    value={100}
                    color='primary' sx={{
                      position: 'absolute',
                      [`& .${circularProgressClasses.circle}`]: {
                        strokeLinecap: 'round',
                        opacity: 0.5,
                      },
                    }}/>}
              </IconButton>
            </Tooltip>
            <Menu {...bindMenu(popupState)} sx={{ '& .MuiList-root': { minWidth: 250 } }}>
              <Typography sx={{ px: 1, mx: 1, mb: 1 }}>Alert Queue #{props.index + 1}</Typography>
              <Divider sx={{ my: 1 }}/>
              <MenuItem disabled={model.play || model.emitData.length === 0} onClick={sendAlertToOverlay}>
                <Stack>
                  <Typography variant='button'>Play one</Typography>
                  <Typography variant='caption'>Play first alert in queue</Typography>
                </Stack>
              </MenuItem>
              {!model.play && <MenuItem disabled={saving} onClick={() => setModel(AlertQueue.create({ ...model, play: true }))}>
                <Stack>
                  <Typography variant='button'>Play all</Typography>
                  <Typography variant='caption'>Alerts will be played in queue order</Typography>
                </Stack>
              </MenuItem>}
              {model.play && <MenuItem disabled={saving} onClick={() => setModel(AlertQueue.create({ ...model, play: false }))}>
                <Stack>
                  <Typography variant='button'>Pause queue</Typography>
                  <Typography variant='caption'>Pause next alert in queue.</Typography>
                </Stack>
              </MenuItem>}

              {model.passthrough
                ? <MenuItem disabled={saving} onClick={() => setModel(AlertQueue.create({ ...model, passthrough: false }))}>
                  <Stack>
                    <Typography variant='button'>Disable Passthrough</Typography>
                    <Typography variant='caption'>New alerts will be queued</Typography>
                  </Stack>
                </MenuItem>
                : <MenuItem disabled={saving} onClick={() => setModel(AlertQueue.create({ ...model, passthrough: true }))}>
                  <Stack>
                    <Typography variant='button'>Passthrough</Typography>
                    <Typography variant='caption'>New alerts will skip queue</Typography>
                  </Stack>
                </MenuItem>}
              <Divider/>
              <MenuItem disabled={saving} onClick={openDialog}>
                <Typography variant='button'>Configure</Typography>

                <Dialog open={open} fullWidth maxWidth="lg">
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
                      {events.filter(ev => ev !== 'promo').map(ev =>
                        ev in filter
                          ? <Box sx={{ position: 'relative', display: 'inline-block' }}>
                            <Chip sx={{ m: 0.2, pr: 2.5 }} label={ev} color={ev === configureEvent ? 'light' : 'primary'} onClick={() => {
                              const newFilter = filter;
                              delete newFilter[ev];
                              setFilter({ ...newFilter });
                            }}/>
                            <IconButton
                              onClick={() => setConfigureEvent(configureEvent === ev ? null : ev)}
                              color='dark'
                              sx={{
                                position: 'absolute',
                                right: 0,
                                top: '2px',
                                height: '32px',
                                width: '32px'
                              }}>
                              <SettingsTwoTone/>
                            </IconButton>
                          </Box>
                          : <Chip sx={{ m: 0.2 }} label={ev} color='dark' onClick={() => {
                            setFilter(f => ({ ...f, [ev]: null }));
                          }}/>)}
                    </Box>
                  </DialogContent>
                  {configureEvent && <DialogContent dividers key={configureEvent}>
                    <AccordionFilter
                      label={`Filter for ${configureEvent}`}
                      model={filter[configureEvent]}
                      open={true}
                      rules={rules(configureEvent)}
                      onChange={(f) => {
                        console.log('setFilter', f);
                        setFilter({ ...filter, [configureEvent]: f });
                      }}/>
                  </DialogContent>}
                  <DialogActions>
                    <Button onClick={(ev) => {
                      ev.stopPropagation();
                      setOpen(false);
                      // revert filter changes
                      setFilter(props.queue.filter);
                    }}>Close</Button>
                    <LoadingButton disabled={isEqual(model.filter, filter)} loading={saving} variant='contained' onClick={(ev) => {
                      ev.stopPropagation();
                      setModel(AlertQueue.create({ ...model, filter }));
                    }}>Save</LoadingButton>
                  </DialogActions>
                </Dialog>
              </MenuItem>
              <Divider/>
              <MenuItem disabled={saving} onClick={() => resetQueue(popupState)}>
                <Stack>
                  <Typography variant='button' color='error'>Reset</Typography>
                  <Typography variant='caption' color='error'>Remove alerts from queue (you will still see them in eventlist)</Typography>
                </Stack>
              </MenuItem>
            </Menu>
          </React.Fragment>
        )}
      </PopupState>
    </Box>
  );
};

export { AlertQueueController };