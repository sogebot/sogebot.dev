import {
  DragDropContext, Draggable, Droppable,
} from '@hello-pangea/dnd';
import {
  CheckCircleTwoTone, DeleteTwoTone, DragIndicatorTwoTone, RadioButtonUncheckedTwoTone,
} from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Box, Button, Checkbox, Collapse, DialogContent, Divider, FormControlLabel, FormGroup, FormHelperText, Grid, IconButton, LinearProgress, Stack, TextField,
} from '@mui/material';
import { Timer, TimerResponse } from '@sogebot/backend/dest/database/entity/timer';
import axios from 'axios';
import {
  capitalize,
  cloneDeep,
  orderBy,
} from 'lodash';
import { useSnackbar } from 'notistack';
import React, {
  useCallback, useEffect,
  useState,
} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { v4 } from 'uuid';

import { FormResponse } from './Input/Response';
import getAccessToken from '../../getAccessToken';
import { useTranslation } from '../../hooks/useTranslation';
import { useValidator } from '../../hooks/useValidator';

const newItem = new Timer();
newItem.messages = [];

export const TimerEdit: React.FC<{
  items: Timer[]
}> = (props) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { translate } = useTranslation();
  const [ item, setItem ] = useState<Timer>(newItem);
  const [ loading, setLoading ] = useState(true);
  const [ saving, setSaving ] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const { propsError, reset, showErrors, validate, haveErrors } = useValidator();

  const handleValueChange = useCallback(<T extends keyof Timer>(key: T, value: Timer[T]) => {
    if (!item) {
      return;
    }
    const update = cloneDeep(item);
    update[key] = value;
    setItem(update);
  }, [ item ]);

  useEffect(() => {
    setLoading(true);
    if (id) {
      const it = props.items?.find(o => o.id === id) ?? newItem;
      setItem(it);
    } else {
      setItem(newItem);
    }
    setLoading(false);
    reset();
  }, [id, props.items, reset]);

  useEffect(() => {
    if (!loading && item) {
      validate(Timer, item);
    }
  }, [item, loading, validate]);

  const handleClose = () => {
    navigate('/manage/timers');
  };

  const handleSave = () => {
    setSaving(true);
    axios.post(`${JSON.parse(localStorage.server)}/api/systems/timer`,
      item,
      { headers: { authorization: `Bearer ${getAccessToken()}` } })
      .then((response) => {
        enqueueSnackbar('Timer saved.', { variant: 'success' });
        navigate(`/manage/timers/edit/${response.data.data.id}`);
      })
      .catch(e => {
        showErrors(e.response.data.errors);
      })
      .finally(() => setSaving(false));
  };

  const addResponse = useCallback(() => {
    if (!item) {
      return;
    }
    const response = new TimerResponse();
    response.id = v4();
    response.timestamp = new Date().toISOString();
    response.response = '';
    response.isEnabled = true;

    const update = cloneDeep(item);
    update.messages = [...item.messages, response];
    setItem(update);
  }, [item]);

  const updateResponse = useCallback((value: TimerResponse) => {
    if (!item) {
      return;
    }

    const update = cloneDeep(item);
    for (let i = 0; i < update.messages.length; i++) {
      if (update.messages[i].id === value.id) {
        update.messages[i] = value as TimerResponse;
      }
    }
    setItem(update);
  }, [item]);

  const toggleResponseEnabled = useCallback((responseId: string) => {
    if (!item) {
      return;
    }

    const update = cloneDeep(item);

    const updateMessage = update.messages.find(o => o.id === responseId);
    if (updateMessage) {
      updateMessage.isEnabled = !updateMessage.isEnabled;
      const messages = update.messages.filter(o => o.id !== responseId);
      update.messages = [...messages, updateMessage];
      setItem(update);
    }
  }, [item]);

  const deleteResponse = useCallback((responseId: string) => {
    if (!item) {
      return;
    }
    const update = cloneDeep(item);
    update.messages = update.messages.filter(o => o.id !== responseId).map((o, idx) => ({
      ...o, timestamp: new Date(idx).toISOString(),
    })) as TimerResponse[];
    setItem(update);
  }, [item]);

  const onDragEndHandler = useCallback((value: any) => {
    if (!value.destination || !item) {
      return;
    }
    const update = cloneDeep(item);

    const responseId = value.draggableId;
    const ordered = orderBy(update.messages, 'timestamp', 'asc');

    const destIdx = value.destination.index;
    const fromIdx = ordered.findIndex(m => m.id === responseId);
    const fromItem = ordered.find(m => m.id === responseId);

    if (fromIdx === destIdx || !fromItem) {
      return;
    }

    // remove fromIdx
    ordered.splice(fromIdx, 1);

    // insert into destIdx
    ordered.splice(destIdx, 0, fromItem);

    update.messages = ordered.map((o, idx) => ({
      ...o, timestamp: new Date(idx).toISOString(),
    })) as any;

    setItem(update);
  }, [ item ]);

  return(<>
    {loading && <LinearProgress />}
    <Collapse in={!loading} mountOnEnter unmountOnExit>
      <DialogContent>
        <Box
          component="form"
          sx={{ '& .MuiFormControl-root': { my: 0.5 } }}
          noValidate
          autoComplete="off"
        >
          <TextField
            fullWidth
            {...propsError('name')}
            variant="filled"
            value={item?.name || ''}
            required
            label={capitalize(translate('name'))}
            onChange={(event) => handleValueChange('name', event.target.value)}
          />

          <TextField
            fullWidth
            {...propsError('triggerEverySecond')}
            variant="filled"
            type='number'
            value={item?.triggerEverySecond}
            required
            label={capitalize(translate('seconds'))}
            onChange={(event) => handleValueChange('triggerEverySecond', Number(event.target.value))}
          />

          <TextField
            fullWidth
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
              {(droppableProvided) => (<>
                <div
                  ref={droppableProvided.innerRef}
                >
                  {orderBy(item.messages, 'timestamp', 'asc').map((o, idx) => (
                    <Draggable key={o.id} draggableId={o.id} index={idx}>
                      {(draggableProvided) => (
                        <Grid container spacing={2}
                          ref={draggableProvided.innerRef}
                          {...draggableProvided.dragHandleProps}
                          {...draggableProvided.draggableProps}>
                          <Grid item sm='auto' sx={{ placeSelf: 'center' }}>
                            <DragIndicatorTwoTone/>
                          </Grid>
                          <Grid item sm>
                            <FormResponse value={o} idx={idx} onChange={(value) => updateResponse(value)} disableExecution disableFilter disablePermission/>
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
                {droppableProvided.placeholder}
              </>
              )}
            </Droppable>
          </DragDropContext>
        </Box>
      </DialogContent>
    </Collapse>
    <Divider/>
    <Box sx={{ p: 1 }}>
      <Grid container sx={{ height: '100%' }} justifyContent={'space-between'} spacing={1}>
        <Grid item>
          <Button onClick={addResponse} disabled={loading} sx={{ width: 200 }}>
            { translate('systems.customcommands.addResponse') }
          </Button>
        </Grid>
        <Grid item>
          <Stack spacing={1} direction='row'>
            <Button sx={{ width: 150 }} onClick={handleClose}>Close</Button>
            <LoadingButton variant='contained' color='primary' sx={{ width: 150 }} onClick={handleSave} loading={saving} disabled={haveErrors || loading}>Save</LoadingButton>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  </>);
};