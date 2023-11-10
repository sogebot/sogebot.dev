import { LoadingButton } from '@mui/lab';
import { Autocomplete, Box, Button, Checkbox, Collapse, DialogContent, Divider, FormControlLabel, FormGroup, Grid, InputAdornment, LinearProgress, Switch, TextField, Typography } from '@mui/material';
import { EventInterface, Events } from '@sogebot/backend/dest/database/entity/event';
import match from 'autosuggest-highlight/match';
import parse from 'autosuggest-highlight/parse';
import { capitalize, cloneDeep } from 'lodash';
import { useSnackbar } from 'notistack';
import React, { useEffect , useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { v4 } from 'uuid';

import { CopyButton } from './Input/Adornment/Copy';
import { FormInputAdornmentCustomVariable } from './Input/Adornment/CustomVariables';
import { FormNumericInput } from './Input/Numeric';
import { FormRewardInput } from './Input/Reward';
import { getSocket } from '../../helpers/socket';
import { useTranslation } from '../../hooks/useTranslation';
import { useValidator } from '../../hooks/useValidator';
import theme from '../../theme';

const newEvent: EventInterface = {
  definitions: {},
  filter:      '',
  isEnabled:   true,
  name:        '',
  operations:  [],
  triggered:   false,
};

export const EventsEdit: React.FC = () => {
  const navigate = useNavigate();
  const { translate } = useTranslation();
  const { id } = useParams();

  const { enqueueSnackbar } = useSnackbar();

  const [ item, setItem ] = useState<EventInterface | null>(null);
  const previousItemName = React.useRef<string | null>(null);
  const [ availableEvents, setAvailableEvents ] = useState<Events.SupportedEvent[]>([]);
  const [ loading, setLoading ] = useState(true);
  const [ saving, setSaving ] = useState(false);
  const { reset, haveErrors } = useValidator();

  const availableVariables = React.useMemo(() => {
    return (availableEvents.find(o => o.id === item?.name ?? '') || { variables: [] }).variables;
  }, [ availableEvents, item ]);

  React.useEffect(() => {
    if (previousItemName.current === null || !item || item.name === previousItemName.current) {
      return;
    }
    const defaultEvent = availableEvents.find(o => o.id === item.name);
    if (defaultEvent) {
      setItem(it => {
        if (!it) {
          return it;
        }
        return { ...it, definitions: defaultEvent.definitions ?? {} };
      });
    }
    previousItemName.current = item.name;
  }, [ item?.name, previousItemName ]);

  useEffect(() => {
    if (id) {
      setLoading(true);
      Promise.all([
        new Promise<void>(resolve => {
          getSocket('/core/events').emit('generic::getOne', id, (err, res) => {
            if (err) {
              console.error(err);
            } else {
              setItem(res as EventInterface);
              previousItemName.current = res!.name;
            }
            resolve();
          });
        }),
        new Promise<void>(resolve => {
          getSocket('/core/events').emit('list.supported.events', (err, data: Events.SupportedEvent[]) => {
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
    } else {
      setItem({
        ...cloneDeep(newEvent),
        id: v4(),
      });
      setLoading(false);
    }
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
        console.error(err);
      } else {
        enqueueSnackbar('Event saved.', { variant: 'success' });
        navigate(`/manage/events/edit/${savedItem.id}?server=${JSON.parse(localStorage.server)}`);
      }
      setSaving(false);
    });
  };

  return(<>
    {loading && <LinearProgress />}
    <Collapse in={!loading} mountOnEnter unmountOnExit>
      <DialogContent>
        {item && <Box
          component="form"
          sx={{ '& .MuiFormControl-root': { my: 0.5 } }}
          noValidate
          autoComplete="off"
        >
          <Autocomplete
            value={item.name}
            disableClearable
            onChange={(ev, value) => {
              setItem({
                ...item, name: value,
              });
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
                  onChange={(_, val) => setItem({
                    ...item, isEnabled: val,
                  })}
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
            onChange={(ev) => setItem({
              ...item, filter: ev.target.value,
            })}
            InputProps={{
              endAdornment: <InputAdornment position="end">
                <FormInputAdornmentCustomVariable additionalVariables={availableVariables} onSelect={filter => setItem({
                  ...item, filter: item.filter + filter,
                })}/>
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

          <Box sx={{
            display:  'flex',
            flexWrap: 'wrap',
            mx:       -0.5,
            '& > *':  {
              flex:      '1 0 35%',
              px:        0.5,
              alignSelf: 'center',
            }
          }}>
            {Object.keys(item.definitions).map((key, index) => <React.Fragment key={`${key}-${index}`}>
              {typeof item.definitions[key] === 'boolean' && <FormGroup sx={{
                position: 'relative', top: '-0.5rem', pl: 2
              }}>
                <FormControlLabel control={<Checkbox checked={Boolean(item.definitions[key])} onChange={(_, checked) => setItem({
                  ...item,
                  definitions: {
                    ...item.definitions, [key]: checked,
                  }
                })}/>} label={translate(`events.definitions.${key}.label`)} />
              </FormGroup>}

              {key === 'rewardId' && <FormRewardInput
                value={String(item.definitions[key])}
                onChange={value => setItem({
                  ...item,
                  definitions: {
                    ...item.definitions, [key as any]: value,
                  }
                })}/>}

              {typeof item.definitions[key] === 'string' && <TextField
                fullWidth
                label={translate(`events.definitions.${key}.label`)}
                helperText={translate(`events.definitions.${key}.placeholder`)}
                value={item.definitions[key]}
                onChange={ev => setItem({
                  ...item,
                  definitions: {
                    ...item.definitions, [key as any]: ev.currentTarget.value,
                  }
                })}/>}

              {typeof item.definitions[key] === 'number' && <FormNumericInput
                fullWidth
                min={0}
                label={translate(`events.definitions.${key}.label`)}
                helperText={translate(`events.definitions.${key}.placeholder`)}
                value={Number(item.definitions[key])}
                onChange={value => setItem({
                  ...item,
                  definitions: {
                    ...item.definitions, [key as any]: value,
                  }
                })}/>}
            </React.Fragment>)}
          </Box>
        </Box>}
      </DialogContent>
    </Collapse>
    <Divider/>
    <Box sx={{ p: 1 }}>
      <Grid container sx={{ height: '100%' }} justifyContent={'end'} spacing={1}>
        <Grid item>
          <Button sx={{ width: 150 }} onClick={handleClose}>Close</Button>
        </Grid>
        <Grid item>
          <LoadingButton variant='contained' color='primary' sx={{ width: 150 }} onClick={handleSave} loading={saving} disabled={haveErrors || loading}>Save</LoadingButton>
        </Grid>
      </Grid>
    </Box>
  </>);
};
