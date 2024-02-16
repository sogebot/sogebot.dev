import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import { DeleteTwoTone, DragIndicatorTwoTone } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import { Autocomplete, Box, Button, Checkbox, Collapse, createFilterOptions, DialogActions, DialogContent, FormControl, FormControlLabel, FormGroup, FormHelperText, Grid, IconButton, LinearProgress, Stack, TextField } from '@mui/material';
import { Keyword, KeywordGroup } from '@sogebot/backend/dest/database/entity/keyword';
import defaultPermissions from '@sogebot/backend/src/helpers/permissions/defaultPermissions';
import axios from 'axios';
import { capitalize, cloneDeep, orderBy } from 'lodash';
import { useSnackbar } from 'notistack';
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { v4 } from 'uuid';

import { FormResponse } from './Input/Response';
import getAccessToken from '../../getAccessToken';
import { useTranslation } from '../../hooks/useTranslation';
import { useValidator } from '../../hooks/useValidator';

const filter = createFilterOptions<string>();

const defaultItem = new Keyword();
defaultItem.keyword = '';
defaultItem.responses = [];
defaultItem.enabled = true;
defaultItem.group = null;

export const KeywordEdit: React.FC<{
  groups: KeywordGroup[]
}> = (props) => {
  const { translate } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const [ item, setItem ] = useState<Keyword>(defaultItem);
  const [ loading, setLoading ] = useState(true);
  const [ saving, setSaving ] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const { propsError, reset, showErrors, validate, haveErrors } = useValidator({ schema: new Keyword()._schema });

  const handleValueChange = <T extends keyof Keyword>(key: T, value: Keyword[T]) => {
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
    if (!item) {
      return;
    }

    const response = {
      id: v4(),
      order: item.responses.length,
      filter: '',
      response: '',
      stopIfExecuted: false,
      permission: defaultPermissions.VIEWERS,
    };
    const update = cloneDeep(item);
    update.responses = [...item.responses, response];
    setItem(update);
  }, [item]);

  useEffect(() => {
    if (id) {
      setLoading(true);
      axios.get(`/api/systems/keywords/${id}`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
        .then(({ data }) => {
          console.log({ data });
          setItem(data.data);
          setLoading(false);
        });
    } else {
      setItem(defaultItem);
      setLoading(false);
    }
    reset();
  }, [id, reset]);

  useEffect(() => {
    if (!loading && item) {
      validate(item);
    }
  }, [item, loading]);

  const handleClose = () => {
    navigate('/commands/keywords');
  };

  const handleSave = () => {
    setSaving(true);
    axios.post(`/api/systems/keywords`,
      item,
      { headers: { authorization: `Bearer ${getAccessToken()}` } })
      .then((response) => {
        enqueueSnackbar('Keyword saved.', { variant: 'success' });
        navigate(`/commands/keywords/edit/${response.data.data.id}`);
      })
      .catch(e => {
        showErrors(e.response.data.errors);
      })
      .finally(() => setSaving(false));
  };

  const updateResponse = useCallback((value: Keyword['responses'][number]) => {
    if (!item) {
      return;
    }
    const update = cloneDeep(item);

    for (let i = 0; i < update.responses.length; i++) {
      if (update.responses[i].id === value.id) {
        update.responses[i] = value as Keyword['responses'][number];
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
    })) as Keyword['responses'];
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
    })) as any;

    setItem(update);
  }, [ item ]);

  return(<>
    {loading && <LinearProgress />}
    <Collapse in={!loading} mountOnEnter unmountOnExit>
      <DialogContent dividers>
        <Box
          component="form"
          sx={{ '& .MuiFormControl-root': { my: 0.5 } }}
          noValidate
          autoComplete="off"
        >
          <TextField
            fullWidth
            {...propsError('keyword')}
            variant="filled"
            required
            value={item?.keyword || ''}
            label={translate('keyword')}
            onChange={(event) => handleValueChange('keyword', event.target.value)}
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

          <Grid container columnSpacing={1}>
            <Grid item xs={6}>
              <FormGroup>
                <FormControlLabel control={<Checkbox checked={item?.enabled || false} onChange={(event) => handleValueChange('enabled', event.target.checked)}/>} label={translate('enabled')} />
                <FormHelperText sx={{
                  position: 'relative', top: '-10px',
                }}>
                  {item?.enabled ? 'Keyword is enabled': 'Keyword is disabled'}
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
            </Grid>
          </Grid>

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
                            <FormResponse value={o} idx={idx} onChange={(value) => updateResponse(value)}/>
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
      </DialogContent>
    </Collapse>
    <DialogActions>
      <Grid container sx={{ height: '100%' }} justifyContent={'space-between'} spacing={1}>
        <Grid item>
          <Button onClick={addResponse} disabled={loading} sx={{ width: 200 }}>
            { translate('systems.customcommands.addResponse') }
          </Button>
        </Grid>
        <Grid item>
          <Stack spacing={1} direction='row'>
            <Button onClick={handleClose}>Close</Button>
            <LoadingButton variant='contained' color='primary' onClick={handleSave} loading={saving} disabled={haveErrors || loading}>Save</LoadingButton>
          </Stack>
        </Grid>
      </Grid>
    </DialogActions>
  </>);
};