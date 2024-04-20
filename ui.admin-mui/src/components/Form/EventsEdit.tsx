import { DeleteTwoTone } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import { Autocomplete, Box, Button, Collapse, DialogActions, DialogContent, Grid, IconButton, InputAdornment, LinearProgress, Paper, Switch, TextField, Typography } from '@mui/material';
import { Event, SupportedEvent, SupportedOperation } from '@sogebot/backend/dest/database/entity/event';
import match from 'autosuggest-highlight/match';
import parse from 'autosuggest-highlight/parse';
import { capitalize, cloneDeep } from 'lodash';
import { useSnackbar } from 'notistack';
import React, { useEffect , useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { v4 } from 'uuid';

import { CopyButton } from './Input/Adornment/Copy';
import { FormInputAdornmentCustomVariable } from './Input/Adornment/CustomVariables';
import { EventsDefinitions } from './Input/EventsDefinitions';
import { EventsTester } from './Input/EventsTester';
import { getSocket } from '../../helpers/socket';
import { useTranslation } from '../../hooks/useTranslation';
import { useValidator } from '../../hooks/useValidator';
import theme from '../../theme';

const newEvent = {
  filter:    '',
  isEnabled: true,
  event:     {
    name:        'clearchat',
    triggered:   {},
    definitions: {},
  },
  operations: [],
};

export const EventsEdit: React.FC = () => {
  const navigate = useNavigate();
  const { translate } = useTranslation();
  const { id } = useParams();

  const { enqueueSnackbar } = useSnackbar();

  const [ item, setItem ] = useState<Event | null>(null);
  const [ availableEvents, setAvailableEvents ] = useState<SupportedEvent[]>([]);
  const [ availableOperations, setAvailableOperations ] = useState<SupportedOperation[]>([]);
  const [ loading, setLoading ] = useState(true);
  const [ saving, setSaving ] = useState(false);
  const { reset, haveErrors, validate, showErrors, propsError, dirtify } = useValidator({
    schema: new Event()._schema,
  });

  React.useEffect(() => {
    if (item) {
      validate(item);
    }
  }, [ item ]);

  const availableVariables = React.useMemo(() => {
    return (availableEvents.find(o => o.id === item?.event.name ?? '') || { variables: [] }).variables;
  }, [ availableEvents, item ]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      new Promise<void>(resolve => {
        if (id) {
          getSocket('/core/events').emit('generic::getOne', id, (err, res) => {
            if (err || !res) {
              console.error(err);
            } else {
              setItem(Event.create(res));
            }
            resolve();
          });
        } else {
          setItem(Event.create({
            ...cloneDeep(newEvent),
            id: v4(),
          }));
          resolve();
        }
      }),
      new Promise<void>(resolve => {
        getSocket('/core/events').emit('list.supported.operations', (err, data: SupportedOperation[]) => {
          if (err) {
            console.error(err);
          } else {
            setAvailableOperations(data.sort((a, b) => {
              const A = translate(a.id).toLowerCase();
              const B = translate(b.id).toLowerCase();
              if (A < B) { // sort string ascending
                return -1;
              }
              if (A > B) {
                return 1;
              }
              return 0; // default return value (no sorting)
            }));
          }
          resolve();
        });
      }),
      new Promise<void>(resolve => {
        getSocket('/core/events').emit('list.supported.events', (err, data: SupportedEvent[]) => {
          if (err) {
            console.error(err);
          } else {
            for (const d of data) {
              // sort variables
              if (d.variables) {
                d.variables = d.variables.sort((A, B) => {
                  if (A < B) { // sort string ascending
                    return -1;
                  }
                  if (A > B) {
                    return 1;
                  }
                  return 0; // default return value (no sorting)
                });
              } else {
                d.variables = [];
              }
            }
            setAvailableEvents(data.sort((a, b) => {
              const A = translate(a.id).toLowerCase();
              const B = translate(b.id).toLowerCase();
              if (A < B) { // sort string ascending
                return -1;
              }
              if (A > B) {
                return 1;
              }
              return 0; // default return value (no sorting)
            }));
          }
          resolve();
        });
      }),
    ]).finally(() => setLoading(false));
    reset();
  }, [id, reset]);

  const handleClose = () => {
    setTimeout(() => {
      navigate(`/manage/events?server=${JSON.parse(localStorage.server)}`);
    }, 200);
  };

  const handleSave = () => {
    if (!item) {
      return;
    }
    setSaving(true);
    getSocket('/core/events').emit('events::save', item, (err, savedItem) => {
      if (err) {
        showErrors(err as any);
      } else {
        enqueueSnackbar('Event saved.', { variant: 'success' });
        navigate(`/manage/events/edit/${savedItem.id}?server=${JSON.parse(localStorage.server)}`);
      }
      setSaving(false);
    });
  };

  const getEmptyDefinitionOf = (name: string) => {
    const defaultOperation = availableOperations.find(o => o.id === name);
    const emptyDefinitions = {} as Record<string, any>;
    if (defaultOperation) {
      if (Object.keys(defaultOperation.definitions).length > 0) {
        for (const [key, value] of Object.entries(defaultOperation.definitions)) {
          emptyDefinitions[key] = Array.isArray(value) ? value[0] : value; // select first option by default
        }
      }
    }
    return emptyDefinitions;
  };

  return(<>
    {loading && <LinearProgress />}
    <Collapse in={!loading} mountOnEnter unmountOnExit>
      <DialogContent dividers sx={{ minHeight: '75vh' }}>
        {item && <Grid container spacing={1}>
          <Grid item xs={4}>
            <Box
              component="form"
              sx={{
                '& .MuiFormControl-root':             { my: 0.5 },
                '& .MuiFormControl-root:first-child': { mt: 0 }
              }}
              noValidate
              autoComplete="off"
            >
              <Autocomplete
                value={item.event.name}
                disableClearable
                onChange={(ev, value) => {
                  const defaultEvent = availableEvents.find(o => o.id === value);
                  if (defaultEvent) {
                    setItem(Event.create({
                      ...item,
                      event: {
                        name:        value,
                        triggered:   {},
                        definitions: (defaultEvent.definitions ?? {}) as any
                      },
                    }));
                  }
                }}
                options={availableEvents.map(e => e.id)}
                filterOptions={(options, state) => {
                  if (state.inputValue.trim().length === 0) {
                    return options;
                  }
                  return options.filter(o => capitalize(translate(o)).toLowerCase().includes(state.inputValue.toLowerCase()));
                }}
                getOptionLabel={(option) => capitalize(translate(option))}
                renderInput={(params) => <TextField {...params} label={capitalize(translate('event'))} InputProps={{
                  ...params.InputProps,
                  endAdornment: <InputAdornment position="end">
                    <Switch
                      sx={{
                        position: 'absolute',
                        right:    '40px',
                        top:      'calc(50% - 19px)',
                      }}
                      checked={item.isEnabled}
                      onClick={ev => ev.stopPropagation()}
                      onChange={(_, val) => setItem(Event.create({
                        ...item,
                        isEnabled: val
                      }))}
                    />
                    {params.InputProps.endAdornment}
                  </InputAdornment>,
                }} />}
                renderOption={(p, option, { inputValue }) => {
                  const matches = match(capitalize(translate(option)), inputValue, { insideWords: true });
                  const parts = parse(capitalize(translate(option)), matches);

                  return (
                    <li {...p}>
                      <Typography>
                        {parts.map((part, index) => (
                          <span
                            key={index}
                            style={{
                              backgroundColor: part.highlight ? theme.palette.primary.main : 'inherit',
                              color:           part.highlight ? 'black' : 'inherit',
                            }}
                          >
                            {part.text}
                          </span>
                        ))}
                      </Typography>
                    </li>
                  );
                }}
              />

              <TextField
                fullWidth
                label={translate('filter')}
                value={item.filter}
                onChange={(ev) => setItem(Event.create({
                  ...item, filter: ev.target.value,
                }))}
                InputProps={{
                  endAdornment: <InputAdornment position="end">
                    <FormInputAdornmentCustomVariable additionalVariables={availableVariables} onSelect={filter => setItem(Event.create({
                      ...item, filter: item.filter + filter,
                    }))}/>
                  </InputAdornment>,
                }}/>

              <TextField
                fullWidth
                disabled
                label="Response filter"
                helperText="Be careful, not all variables may be available if triggered by response filter"
                value={`$triggerOperation(${item.id})`}
                InputProps={{
                  endAdornment: <InputAdornment position="end">
                    <CopyButton text={`$triggerOperation(${item.id})`}/>
                  </InputAdornment>,
                }}/>

              {Object.keys(item.event.definitions).map((key, index) => <EventsDefinitions
                key={`${key}-${index}`}
                additionalVariables={availableVariables}
                error={propsError}
                attribute={`event.definitions.${key}`}
                value={(item.event.definitions as any)[key]}
                onChange={(value: any) => setItem(Event.create({
                  ...item,
                  event: {
                    ...item.event,
                    definitions: {
                      ...item.event.definitions, [key]: value,
                    } as any
                  }
                }))}
              />)}
            </Box>
          </Grid>
          <Grid item xs={8}>
            {item.operations.map((operation, index) => <Paper
              component="form"
              sx={{ p: 1, mb: 3, position: 'relative' }}
              noValidate
              autoComplete="off"
              key={`${operation.id}-${index}`}
            >
              <IconButton color='error' size='small' sx={{
                position:                     'absolute',
                right:                        -16,
                top:                          -16,
                zIndex:                       5,
                '&.MuiIconButton-root:hover': {
                  backgroundColor: `${theme.palette.error.dark} !important`,
                },
                '&.MuiIconButton-root': {
                  backgroundColor: `${theme.palette.error.main} !important`,
                  color:           'white !important'
                },
              }} onClick={() => {
                setItem(Event.create({
                  ...item,
                  operations: [
                    ...item.operations.filter(op => op.id !== operation.id)
                  ]
                }));
              }}><DeleteTwoTone/></IconButton>

              <Box
                component="form"
                sx={{
                  '& .MuiFormControl-root':             { my: 0.5 },
                  '& .MuiFormControl-root:first-child': { mt: 0 },
                  '& .MuiFormGroup-root':               { top: 0 }
                }}
                noValidate
                autoComplete="off"
              >
                <Autocomplete
                  value={operation.name}
                  disableClearable
                  sx={{ '& .MuiFilledInput-root': { p: '10px' } }}
                  onChange={(ev, value) => {
                    dirtify(`operations.${index}.name`);
                    setItem((it) => {
                      if (!it) {
                        return null;
                      }
                      it.operations[index].name = value;
                      it.operations[index].definitions = getEmptyDefinitionOf(value);
                      return Event.create(it);
                    });
                  }}
                  options={availableOperations.map(e => e.id)}
                  filterOptions={(options, state) => {
                    if (state.inputValue.trim().length === 0) {
                      return options;
                    }
                    return options.filter(o => capitalize(translate(o)).toLowerCase().includes(state.inputValue.toLowerCase()));
                  }}
                  getOptionLabel={(option) => capitalize(translate(option))}
                  renderInput={(params) => <TextField {...params} {...propsError(`operations.${index}.name`)}/>}
                  renderOption={(p, option, { inputValue }) => {
                    const matches = match(capitalize(translate(option)), inputValue, { insideWords: true });
                    const parts = parse(capitalize(translate(option)), matches);

                    return (
                      <li {...p}>
                        <Typography>
                          {parts.map((part, i) => (
                            <span
                              key={i}
                              style={{
                                backgroundColor: part.highlight ? theme.palette.primary.main : 'inherit',
                                color:           part.highlight ? 'black' : 'inherit',
                              }}
                            >
                              {part.text}
                            </span>
                          ))}
                        </Typography>
                      </li>
                    );
                  }}
                />

                {Object.keys(operation.definitions).map((key, index_op) => <EventsDefinitions
                  key={`${key}-${index_op}`}
                  attribute={`operations.${index}.definitions.${key}`}
                  error={propsError}
                  additionalVariables={availableVariables}
                  value={operation.definitions[key]}
                  onChange={(value: any) =>
                    setItem((it) => {
                      if (!it) {
                        return null;
                      }
                      it.operations[index].definitions = { ...it.operations[index].definitions, [key]: value };
                      return Event.create(it);
                    })
                  }
                />)}
              </Box>
            </Paper>)}

            <Button variant='contained' sx={{ width: '300px', m: 'auto', display: 'block' }} onClick={() => {
              setItem(Event.create({
                ...item,
                operations: [
                  ...item.operations, {
                    id:          v4(),
                    name:        availableOperations[0]!.id,
                    definitions: getEmptyDefinitionOf(availableOperations[0]!.id),
                  }
                ]
              }));
            }}>Add operation</Button>
          </Grid>
        </Grid>}
      </DialogContent>
    </Collapse>
    <DialogActions>
      <EventsTester variables={availableVariables} eventId={id}/>
      <Button sx={{ width: 150 }} onClick={handleClose}>Close</Button>
      <LoadingButton variant='contained' color='primary' sx={{ width: 150 }} onClick={handleSave} loading={saving} disabled={haveErrors || loading}>Save</LoadingButton>
    </DialogActions>
  </>);
};
