import {
  DragDropContext, Draggable, Droppable,
} from '@hello-pangea/dnd';
import {
  Delete, DragIndicator, RestartAltTwoTone,
} from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Autocomplete, Box, Button, Checkbox, CircularProgress, createFilterOptions, Dialog, DialogContent, Divider, Fade, FormControl, FormControlLabel, FormGroup, FormHelperText, Grid, IconButton, InputAdornment, Stack, TextField,
} from '@mui/material';
import axios from 'axios';
import { validateOrReject } from 'class-validator';
import {
  capitalize,
  cloneDeep, merge, orderBy,
} from 'lodash';
import { useRouter } from 'next/router';
import { useSnackbar } from 'notistack';
import React, {
  useCallback, useMemo, useState,
} from 'react';
import { useEffect } from 'react';
import { v4 } from 'uuid';
import { CommandResponse } from '~/../backend/d.ts/src/parser';
import {
  Commands, CommandsGroup, CommandsResponses,
} from '~/../backend/dest/database/entity/commands';
import { defaultPermissions } from '~/../backend/src/helpers/permissions/defaultPermissions';

import { FormResponse } from '~/src/components/Form/Input/Response';
import getAccessToken from '~/src/getAccessToken';
import { useTranslation } from '~/src/hooks/useTranslation';
import { useValidator } from '~/src/hooks/useValidator';
import { StripTypeORMEntity } from '~/src/types/stripTypeORMEntity';

interface GroupType {
  inputValue?: string;
  title: string;
}

const filter = createFilterOptions<GroupType>();

const defaultItem = new Commands();
defaultItem.command = '';
defaultItem.responses = [];
defaultItem.enabled = true;
defaultItem.visible = true;
defaultItem.group = null;

export const CommandsEdit: React.FC<{
  groups: CommandsGroup[]
}> = (props) => {
  const router = useRouter();
  const { translate } = useTranslation();
  const [ editDialog, setEditDialog ] = useState(false);
  const [ item, setItem ] = useState<StripTypeORMEntity<Commands>>(defaultItem);

  const [ count, setCount ] = useState(-1);

  const [ loading, setLoading ] = useState(true);
  const [ saving, setSaving ] = useState(false);
  const { id } = router.query;
  const { enqueueSnackbar } = useSnackbar();
  const { propsError, reset, setErrors, validate, haveErrors } = useValidator();

  const handleValueChange = <T extends keyof StripTypeORMEntity<Commands>>(key: T, value: StripTypeORMEntity<Commands>[T]) => {
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
  };

  const addResponse = useCallback(() => {
    setItem((o) => {
      const response = new CommandsResponses();
      response.id = v4();
      response.order = o.responses.length;
      response.filter = '';
      response.response = '';
      response.stopIfExecuted = false;
      response.permission = defaultPermissions.VIEWERS;
      return {
        ...o, responses: [...o.responses, response], 
      };
    });
  }, []);

  useEffect(() => {
    if (id) {
      setLoading(true);
      axios.get(`${localStorage.server}/api/systems/customcommands/${id}`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
        .then(({ data }) => {
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
  }, [router, id, editDialog, reset]);

  useEffect(() => {
    if (!loading && editDialog && item) {
      const toCheck = new Commands();
      merge(toCheck, item);
      validateOrReject(toCheck)
        .then(() => setErrors(null))
        .catch(setErrors);
    }
  }, [item, loading, editDialog, setErrors]);

  useEffect(() => {
    if (router.asPath.includes('customcommands/edit/') || router.asPath.includes('customcommands/create') ) {
      setEditDialog(true);
    }
  }, [router]);

  const handleClose = () => {
    setEditDialog(false);
    setTimeout(() => {
      router.push('/commands/customcommands');
    }, 200);
  };

  const handleSave = () => {
    setSaving(true);
    axios.post(`${localStorage.server}/api/systems/customcommands`,
      {
        ...item, count, 
      },
      { headers: { authorization: `Bearer ${getAccessToken()}` } })
      .then((response) => {
        enqueueSnackbar('Commands saved.', { variant: 'success' });
        router.push(`/commands/customcommands/edit/${response.data.data.id}`);
      })
      .catch(e => {
        validate(e.response.data.errors);
      })
      .finally(() => setSaving(false));
  };

  const orderedResponses = useMemo(() => {
    return orderBy(item.responses, 'order', 'asc');
  }, [ item.responses ]);

  const updateResponse = useCallback((value: CommandsResponses) => {
    setItem((it) => {
      const responses = it.responses;
      for (let i = 0; i < responses.length; i++) {
        if (responses[i].id === value.id) {
          responses[i] = value as CommandsResponses;
        }
      }
      return {
        ...it, responses: responses, 
      };
    });
  }, []);

  const deleteResponse = useCallback((responseId: string) => {
    setItem((it) => {
      const responses = it.responses.filter(o => o.id !== responseId).map((o, idx) => ({
        ...o, order: idx, 
      })) as CommandsResponses[];
      return {
        ...it, responses: responses, 
      };
    });
  }, []);

  const onDragEndHandler = useCallback((value: any) => {
    const destIdx = value.destination.index;
    const responseId = value.draggableId;

    setItem((o: any) => {
      const responses: StripTypeORMEntity<CommandResponse>[] = [];

      const ordered = orderBy(o.responses, 'order', 'asc');
      const fromIdx = ordered.findIndex(m => m.id === responseId);

      if (fromIdx === destIdx) {
        return o;
      }

      for (let idx = 0; idx < o.responses.length; idx++) {
        const message = ordered[idx];
        if (message.id === responseId) {
          continue;
        }

        if (idx === destIdx && destIdx === 0) {
          const draggedMessage = ordered[fromIdx];
          draggedMessage.order = responses.length;
          responses.push(draggedMessage);
        }

        message.order = responses.length;
        responses.push(message);

        if (idx === destIdx && destIdx > 0) {
          const draggedMessage = ordered[fromIdx];
          draggedMessage.order = responses.length;
          responses.push(draggedMessage);
        }

      }
      return {
        ...o, responses, 
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
            {...propsError('command')}
            variant="filled"
            required
            value={item?.command || ''}
            label={translate('command')}
            onChange={(event) => handleValueChange('command', event.target.value)}
          />
          <FormControl fullWidth variant="filled" sx={{ mt: '8px' }}>
            <Autocomplete
              sx={{ '& .MuiFormControl-root': { marginTop: 0 } }}
              selectOnFocus
              handleHomeEndKeys
              onChange={(event, newValue) => {
                if (typeof newValue === 'string') {
                  handleValueChange('group', newValue);
                } else if (newValue && newValue.inputValue) {
                  // Create a new value from the user input
                  handleValueChange('group', newValue.inputValue);
                } else {
                  handleValueChange('group', newValue?.title ?? '');
                }
              }}
              getOptionLabel={(option) => {
                // Value selected with enter, right from the input
                if (typeof option === 'string') {
                  return option;
                }
                // Add "xxx" option created dynamically
                if (option.inputValue) {
                  return option.inputValue;
                }
                // Regular option
                return option.title;
              }}
              filterOptions={(options, params) => {
                const filtered = filter(options, params);
                const { inputValue } = params;
                // Suggest the creation of a new value
                const isExisting = options.some((option) => inputValue === option.title);
                if (inputValue !== '' && !isExisting) {
                  filtered.push({
                    inputValue,
                    title: `Add "${inputValue}"`,
                  });
                }
                return filtered;
              }}
              renderOption={(props2, option) => <li {...props2}>{option.title}</li>}
              value={{ title: item?.group ?? '' }}
              options={[...props.groups.map((o) => ({ title: o.name }))] as GroupType[]}
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

          <Grid container sx={{ mt: 1 }}columnSpacing={2}>
            <Grid item xs={6}>
              <FormGroup>
                <FormControlLabel control={<Checkbox checked={item?.enabled || false} onChange={(event) => handleValueChange('enabled', event.target.checked)}/>} label={translate('enabled')} />
                <FormHelperText sx={{
                  position: 'relative', top: '-10px', 
                }}>
                  {item?.enabled ? 'Command is enabled': 'Command is disabled'}
                </FormHelperText>
              </FormGroup>
            </Grid>
            <Grid item xs={6}>
              <FormGroup>
                <FormControlLabel control={<Checkbox checked={item?.visible || false} onChange={(event) => handleValueChange('visible', event.target.checked)}/>} label={capitalize(translate('visible'))} />
                <FormHelperText sx={{
                  position: 'relative', top: '-10px', 
                }}>
                  {item?.visible ? 'Command is visible': 'Command is hidden'}
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
                    <Draggable key={o.id} draggableId={o.id} index={o.order}>
                      {(draggableProvided) => (
                        <Grid container spacing={2}
                          ref={draggableProvided.innerRef}
                          {...draggableProvided.draggableProps}
                        >
                          <Grid item sm='auto' sx={{ placeSelf: 'center' }}
                            {...draggableProvided.dragHandleProps}
                          >
                            <DragIndicator/>
                          </Grid>
                          <Grid item sm>
                            <FormResponse value={o} idx={idx} onChange={updateResponse}/>
                          </Grid>
                          <Grid item sm='auto' sx={{ placeSelf: 'center' }}>
                            <IconButton color="error"  onClick={() => deleteResponse(o.id)} sx={{ mx: 0 }}><Delete/></IconButton>
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