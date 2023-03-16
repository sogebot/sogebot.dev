import {
  DragDropContext, Draggable, Droppable,
} from '@hello-pangea/dnd';
import {
  DeleteTwoTone, DragIndicatorTwoTone, RestartAltTwoTone,
} from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Autocomplete, Box, Button, ButtonGroup, Checkbox, Collapse, createFilterOptions, DialogActions, DialogContent, FormControl, FormControlLabel, FormGroup, FormHelperText, Grid, IconButton, InputAdornment, LinearProgress, Stack, TextField,
} from '@mui/material';
import { Commands, CommandsGroup } from '@sogebot/backend/dest/database/entity/commands';
import defaultPermissions from '@sogebot/backend/src/helpers/permissions/defaultPermissions';
import axios from 'axios';
import {
  capitalize,
  cloneDeep, orderBy,
} from 'lodash';
import { useSnackbar } from 'notistack';
import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { v4 } from 'uuid';

import { FormResponse } from './Input/Response';
import { FormTriggerAlert } from './Input/TriggerAlert';
import { CommandsMenu } from './Menu/CommandsMenu';
import getAccessToken from '../../getAccessToken';
import { useTranslation } from '../../hooks/useTranslation';
import { useValidator } from '../../hooks/useValidator';

const filter = createFilterOptions<string>();

const defaultItem = new Commands();
defaultItem.command = '';
defaultItem.responses = [];
defaultItem.enabled = true;
defaultItem.visible = true;
defaultItem.group = null;

export const CommandsEdit: React.FC<{
  groups: CommandsGroup[]
}> = (props) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { translate } = useTranslation();
  const [ item, setItem ] = useState<Commands>(defaultItem);

  const [ count, setCount ] = useState(-1);

  const [ loading, setLoading ] = useState(true);
  const [ saving, setSaving ] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const { propsError, reset, showErrors, validate, haveErrors } = useValidator();

  const handleValueChange = useCallback(<T extends keyof Commands>(key: T, value: Commands[T]) => {
    if (!item) {
      return;
    }
    const update = cloneDeep(item);
    if (key === 'group' && String(value).trim().length === 0) {
      update.group = null;
    } else {
      update[key] = value;
    }
    setItem(update);
  }, [ item ]);

  const addResponse = useCallback((response: string) => {
    if (!item) {
      return;
    }

    const newResponse = {
      id:             v4(),
      order:          item.responses.length,
      filter:         '',
      response:       response,
      stopIfExecuted: false,
      permission:     defaultPermissions.VIEWERS,
    };
    const update = cloneDeep(item);
    update.responses = [...item.responses, newResponse];
    setItem(update);
  }, [item]);

  useEffect(() => {
    if (id) {
      setLoading(true);
      axios.get(`${JSON.parse(localStorage.server)}/api/systems/customcommands/${id}`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
        .then(({ data }) => {
          data.data.responses = data.data.responses.map((o: any) => ({
            ...o, id: v4(), // force random id to ensure that we can always drag
          }));
          setItem(data.data);
          setCount(data.count);
          setLoading(false);
        });
    } else {
      setItem(defaultItem);
      setCount(-1);
      setLoading(false);
    }
    reset();
  }, [id, reset]);

  useEffect(() => {
    if (!loading && item) {
      validate(Commands, item);
    }
  }, [item, loading, validate]);

  const handleClose = () => {
    navigate('/commands/customcommands');
  };

  const handleSave = () => {
    setSaving(true);
    axios.post(`${JSON.parse(localStorage.server)}/api/systems/customcommands`,
      {
        ...item, count,
      },
      { headers: { authorization: `Bearer ${getAccessToken()}` } })
      .then((response) => {
        enqueueSnackbar('Commands saved.', { variant: 'success' });
        navigate(`/commands/customcommands/edit/${response.data.data.id}`);
      })
      .catch(e => {
        showErrors(e.response.data.errors);
      })
      .finally(() => setSaving(false));
  };

  const updateResponse = useCallback((value: Commands['responses'][number]) => {
    if (!item) {
      return;
    }
    const update = cloneDeep(item);

    for (let i = 0; i < update.responses.length; i++) {
      if (update.responses[i].id === value.id) {
        update.responses[i] = value as Commands['responses'][number];
      }
    }
    setItem(update);
  }, [item]);

  const deleteResponse = useCallback((responseId: string) => {
    if (!item) {
      return;
    }
    const update = cloneDeep(item);
    update.responses = update.responses.filter(o => o.id !== responseId).map((o, idx) => ({
      ...o, order: idx,
    })) as Commands['responses'];
    setItem(update);
  }, [item]);

  const onDragEndHandler = useCallback((value: any) => {
    if (!value.destination || !item) {
      return;
    }
    const update = cloneDeep(item);

    const responseId = value.draggableId;
    const ordered = orderBy(update.responses, 'order', 'asc');

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

    update.responses = ordered.map((o, idx) => ({
      ...o, order: idx,
    }));

    setItem(update);
  }, [ item ]);

  return(<>
    {loading && <LinearProgress />}
    <DialogContent>
      <Collapse in={!loading} mountOnEnter unmountOnExit>
        <Box
          component="form"
          sx={{ '& .MuiFormControl-root': { my: 0.5 } }}
          noValidate
          autoComplete="off"
        >
          <TextField
            fullWidth
            {...propsError('command')}
            variant="filled"
            required
            value={item?.command || ''}
            label={translate('command')}
            onChange={(event) => handleValueChange('command', event.target.value)}
          />
          <FormControl fullWidth variant="filled">
            <Autocomplete
              selectOnFocus
              sx={{ '& .MuiFormControl-root': { marginTop: 0 } }}
              handleHomeEndKeys
              freeSolo
              clearOnBlur
              options={[...props.groups.map((o) => o.name)]}
              onChange={(_, value) => {
                handleValueChange('group', value as string);
              }}
              filterOptions={(options, params) => {
                const filtered = filter(options, params);

                const { inputValue } = params;
                // Suggest the creation of a new value
                const isExisting = options.some((option) => inputValue === option);
                if (inputValue !== '' && !isExisting) {
                  filtered.push(inputValue);
                }

                return filtered;
              }}
              value={item?.group ?? ''}
              renderInput={(params) =>
                <TextField
                  label={translate('group')}
                  variant="filled"
                  {...params}/>
              }
            />
          </FormControl>

          {count > -1 && <TextField
            fullWidth
            label={capitalize(translate('count'))}
            variant="filled"
            value={count}
            InputProps={{
              readOnly:     true,
              endAdornment: <InputAdornment position="end"><IconButton onClick={() => setCount(0)}><RestartAltTwoTone/></IconButton></InputAdornment>,
            }}
          />}

          <Stack direction='row' spacing={1} px={2}>
            <FormGroup sx={{ width: '100%' }}>
              <FormControlLabel control={<Checkbox checked={item?.enabled || false} onChange={(event) => handleValueChange('enabled', event.target.checked)}/>} label={translate('enabled')} />
              <FormHelperText sx={{
                position: 'relative', top: '-10px',
              }}>
                {item?.enabled ? 'Command is enabled.': 'Command is disabled.'}
              </FormHelperText>
            </FormGroup>
            <FormGroup sx={{ width: '100%' }}>
              <FormControlLabel control={<Checkbox checked={item?.visible || false} onChange={(event) => handleValueChange('visible', event.target.checked)}/>} label={capitalize(translate('visible'))} />
              <FormHelperText sx={{
                position: 'relative', top: '-10px',
              }}>
                {item?.visible ? 'Command is visible.': 'Command is hidden.'}
              </FormHelperText>
            </FormGroup>
            <FormGroup sx={{ width: '100%' }}>
              <FormControlLabel control={<Checkbox checked={item?.areResponsesRandomized || false} onChange={(event) => handleValueChange('areResponsesRandomized', event.target.checked)}/>} label={capitalize('Randomized')} />
              <FormHelperText sx={{
                position: 'relative', top: '-10px',
              }}>
                {item?.areResponsesRandomized ? 'Commands responses will be randomized.': 'Command responses will be triggered in exact order.'}
              </FormHelperText>
            </FormGroup>
          </Stack>

          <DragDropContext onDragEnd={onDragEndHandler}>
            <Droppable droppableId="droppable">
              {(droppableProvided) => (<>
                <div
                  ref={droppableProvided.innerRef}
                >
                  {orderBy(item.responses, 'order', 'asc').map((o, idx) => (
                    <Draggable key={o.id} draggableId={o.id} index={o.order}>
                      {(draggableProvided) => (
                        <Grid container spacing={2}
                          ref={draggableProvided.innerRef}
                          {...draggableProvided.dragHandleProps}
                          {...draggableProvided.draggableProps}>
                          <Grid item sm='auto' sx={{ placeSelf: 'center' }}>
                            <DragIndicatorTwoTone/>
                          </Grid>
                          <Grid item sm>
                            {o.response.includes('$triggerAlert')
                              ? <FormTriggerAlert value={o} idx={idx} onChange={(value) => updateResponse(value)}/>
                              : <FormResponse value={o} idx={idx} onChange={(value) => updateResponse(value)}/>
                            }
                          </Grid>
                          <Grid item sm='auto' sx={{ placeSelf: 'center' }}>
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
      </Collapse>
    </DialogContent>
    <DialogActions>
      <Grid container sx={{ height: '100%' }} justifyContent={'space-between'} spacing={1}>
        <Grid item>
          <ButtonGroup color='light' variant='contained' aria-label="outlined primary button group">
            <Button onClick={() => addResponse('')} disabled={loading}>
              { translate('systems.customcommands.addResponse') }
            </Button>
            <CommandsMenu onClick={addResponse}/>
          </ButtonGroup>
        </Grid>
        <Grid item>
          <Stack spacing={1} direction='row'>
            <Button sx={{ width: 150 }} onClick={handleClose}>Close</Button>
            <LoadingButton variant='contained' color='primary' sx={{ width: 150 }} onClick={handleSave} loading={saving} disabled={haveErrors || loading}>Save</LoadingButton>
          </Stack>
        </Grid>
      </Grid>
    </DialogActions>
  </>);
};