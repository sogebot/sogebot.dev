import { Timer, TimerResponse } from '@entity/timer';
import {
  DragDropContext, Draggable, Droppable,
} from '@hello-pangea/dnd';
import {
  CheckCircleTwoTone, DeleteTwoTone, DragIndicatorTwoTone, RadioButtonUncheckedTwoTone,
} from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Box, Button, Checkbox, CircularProgress, Dialog, DialogContent, Divider, Fade, FormControlLabel, FormGroup, FormHelperText, Grid, IconButton, Stack, TextField,
} from '@mui/material';
import axios from 'axios';
import { validateOrReject } from 'class-validator';
import {
  capitalize,
  merge,
  orderBy,
} from 'lodash';
import { useRouter } from 'next/router';
import { useSnackbar } from 'notistack';
import {
  useCallback, useMemo, useState,
} from 'react';
import { useEffect } from 'react';
import { v4 } from 'uuid';

import { FormResponse } from '~/src/components/Form/Input/Response';
import getAccessToken from '~/src/getAccessToken';
import { useTranslation } from '~/src/hooks/useTranslation';
import { useValidator } from '~/src/hooks/useValidator';
import { StripTypeORMEntity } from '~/src/types/stripTypeORMEntity';

const newItem = new Timer();
newItem.messages = [];

export const TimerEdit: React.FC<{
  items: Timer[]
}> = (props) => {
  const router = useRouter();
  const { translate } = useTranslation();
  const [ editDialog, setEditDialog ] = useState(false);
  const [ item, setItem ] = useState<StripTypeORMEntity<Timer>>(newItem);
  const [ loading, setLoading ] = useState(true);
  const [ saving, setSaving ] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const { propsError, reset, setErrors, validate, haveErrors } = useValidator();

  const handleValueChange = useCallback(<T extends keyof Timer>(key: T, value: Timer[T]) => {
    setItem(i => ({
      ...i, [key]: value,
    }));
  }, []);

  useEffect(() => {
    setLoading(true);
    if (router.query.id) {
      const it = props.items?.find(o => o.id === router.query.id) ?? newItem;
      setItem(it);
    } else {
      setItem(newItem);
    }
    setLoading(false);
    reset();
  }, [router.query.id, props.items, editDialog, reset]);

  useEffect(() => {
    if (!loading && editDialog && item) {
      const toCheck = new Timer();
      merge(toCheck, item);
      console.log('Validating', toCheck);
      validateOrReject(toCheck)
        .then(() => setErrors(null))
        .catch(setErrors);
    }
  }, [item, loading, editDialog, setErrors]);

  useEffect(() => {
    if (router.asPath.includes('timers/edit/') || router.asPath.includes('timers/create') ) {
      setEditDialog(true);
    }
  }, [router]);

  const handleClose = () => {
    setEditDialog(false);
    setTimeout(() => {
      router.push('/manage/timers');
    }, 200);
  };

  const handleSave = () => {
    setSaving(true);
    axios.post(`${localStorage.server}/api/systems/timer`,
      item,
      { headers: { authorization: `Bearer ${getAccessToken()}` } })
      .then((response) => {
        enqueueSnackbar('Timer saved.', { variant: 'success' });
        router.push(`/manage/timers/edit/${response.data.data.id}`);
      })
      .catch(e => {
        validate(e.response.data.errors);
      })
      .finally(() => setSaving(false));
  };

  const orderedResponses = useMemo(() => {
    return orderBy(item.messages, 'timestamp', 'asc');
  }, [ item.messages ]);

  const addResponse = useCallback(() => {
    setItem((o) => {
      const response = new TimerResponse();
      response.id = v4();
      response.timestamp = new Date().toISOString();
      response.response = '';
      response.isEnabled = true;
      return {
        ...o, messages: [...o.messages, response],
      };
    });
  }, []);

  const updateResponse = useCallback((value: TimerResponse) => {
    setItem((it) => {
      const responses = it.messages;
      for (let i = 0; i < responses.length; i++) {
        if (responses[i].id === value.id) {
          responses[i] = value as TimerResponse;
        }
      }
      return {
        ...it, messages: responses,
      };
    });
  }, []);

  const toggleResponseEnabled = useCallback((responseId: string) => {
    setItem((it) => {
      const updateMessage = it.messages.find(o => o.id === responseId);
      if (updateMessage) {
        updateMessage.isEnabled = !updateMessage.isEnabled;
        const messages = it.messages.filter(o => o.id !== responseId);
        return {
          ...it, messages: [...messages, updateMessage],
        };
      }
      return it;
    });
  }, []);

  const deleteResponse = useCallback((responseId: string) => {
    setItem((it) => {
      const messages = it.messages.filter(o => o.id !== responseId).map((o, idx) => ({
        ...o, timestamp: new Date(idx).toISOString(),
      })) as TimerResponse[];
      return {
        ...it, messages: messages,
      };
    });
  }, []);

  const onDragEndHandler = useCallback((value: any) => {
    const destIdx = value.destination.index;
    const responseId = value.draggableId;

    setItem((o: any) => {
      const messages: StripTypeORMEntity<TimerResponse>[] = [];

      const orderedMessages = orderBy(o.messages, 'timestamp', 'asc');
      const fromIdx = orderedMessages.findIndex(m => m.id === responseId);

      if (fromIdx === destIdx) {
        return o;
      }

      for (let idx = 0; idx < o.messages.length; idx++) {
        const message = orderedMessages[idx];
        if (message.id === responseId) {
          continue;
        }

        if (idx === destIdx && destIdx === 0) {
          const draggedMessage = orderedMessages[fromIdx];
          draggedMessage.timestamp = new Date(messages.length).toISOString();
          messages.push(draggedMessage);
        }

        message.timestamp = new Date(messages.length).toISOString();
        messages.push(message);

        if (idx === destIdx && destIdx > 0) {
          const draggedMessage = orderedMessages[fromIdx];
          draggedMessage.timestamp = new Date(messages.length).toISOString();
          messages.push(draggedMessage);
        }

      }
      return {
        ...o, messages,
      };
    });
  }, [ ]);

  return(<Dialog
    open={editDialog}
    fullWidth
    maxWidth='md'
  >
    {loading
      && <Grid
        sx={{ pt: 10 }}
        container
        direction="column"
        justifyContent="flex-start"
        alignItems="center"
      ><CircularProgress color="inherit" /></Grid>}
    <Fade in={!loading}>
      <DialogContent>
        <Box
          component="form"
          sx={{
            '& .MuiTextField-root': {
              my: 1, width: '100%',
            },
          }}
          noValidate
          autoComplete="off"
        >
          <TextField
            {...propsError('name')}
            variant="filled"
            value={item?.name || ''}
            required
            label={capitalize(translate('name'))}
            onChange={(event) => handleValueChange('name', event.target.value)}
          />

          <TextField
            {...propsError('triggerEverySecond')}
            variant="filled"
            type='number'
            value={item?.triggerEverySecond}
            required
            label={capitalize(translate('seconds'))}
            onChange={(event) => handleValueChange('triggerEverySecond', Number(event.target.value))}
          />

          <TextField
            {...propsError('triggerEveryMessage')}
            variant="filled"
            type='number'
            value={item?.triggerEveryMessage}
            required
            label={capitalize(translate('messages'))}
            onChange={(event) => handleValueChange('triggerEveryMessage', Number(event.target.value))}
          />

          <Grid container>
            <Grid item xs={6}>
              <FormGroup>
                <FormControlLabel control={<Checkbox checked={item?.isEnabled || false} onChange={(event) => handleValueChange('isEnabled', event.target.checked)}/>} label={translate('enabled')} />
                <FormHelperText sx={{
                  position: 'relative', top: '-10px',
                }}>
                  {item?.isEnabled ? 'Timer is enabled': 'Timer is disabled'}
                </FormHelperText>
              </FormGroup>
            </Grid>
            <Grid item xs={6}>
              <FormGroup>
                <FormControlLabel control={<Checkbox checked={item?.tickOffline || false} onChange={(event) => handleValueChange('tickOffline', event.target.checked)}/>} label={capitalize(translate('timers.dialog.tickOffline'))} />
                <FormHelperText sx={{
                  position: 'relative', top: '-10px',
                }}>
                  {item?.tickOffline
                    ? 'Timers will be ticking, when stream is offline.'
                    : 'Timers will be stopped, when stream is offline.'}
                </FormHelperText>
              </FormGroup>
            </Grid>
          </Grid>

          <DragDropContext onDragEnd={onDragEndHandler}>
            <Droppable droppableId="droppable">
              {(droppableProvided) => (
                <div
                  ref={droppableProvided.innerRef}
                >
                  {orderedResponses.map((o, idx) => (
                    <Draggable key={o.id} draggableId={o.id} index={idx}>
                      {(draggableProvided) => (
                        <Grid container spacing={2}
                          ref={draggableProvided.innerRef}
                          {...draggableProvided.draggableProps}
                        >
                          <Grid item sm='auto' sx={{ placeSelf: 'center' }}
                            {...draggableProvided.dragHandleProps}
                          >
                            <DragIndicatorTwoTone/>
                          </Grid>
                          <Grid item sm>
                            <FormResponse value={o} idx={idx} onChange={updateResponse} disableExecution disableFilter disablePermission/>
                          </Grid>
                          <Grid item sm='auto' sx={{ placeSelf: 'center' }}>
                            <IconButton color={ o.isEnabled ? 'success' : 'error' }  onClick={() => toggleResponseEnabled(o.id)} sx={{ mx: 0 }}>
                              {o.isEnabled ? <CheckCircleTwoTone/> : <RadioButtonUncheckedTwoTone/>}
                            </IconButton>
                            <IconButton color="error"  onClick={() => deleteResponse(o.id)} sx={{ mx: 0 }}><DeleteTwoTone/></IconButton>
                          </Grid>
                        </Grid>
                      )}
                    </Draggable>
                  ))}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </Box>
      </DialogContent>
    </Fade>
    <Divider/>
    <Box sx={{ p: 1 }}>
      <Grid container sx={{ height: '100%' }} justifyContent={'space-between'} spacing={1}>
        <Grid item>
          <Button onClick={addResponse}  sx={{ width: 200 }}>
            { translate('systems.customcommands.addResponse') }
          </Button>
        </Grid>
        <Grid item>
          <Stack spacing={1} direction='row'>
            <Button sx={{ width: 150 }} onClick={handleClose}>Close</Button>
            <LoadingButton variant='contained' color='primary' sx={{ width: 150 }} onClick={handleSave} loading={saving} disabled={haveErrors}>Save</LoadingButton>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  </Dialog>);
};