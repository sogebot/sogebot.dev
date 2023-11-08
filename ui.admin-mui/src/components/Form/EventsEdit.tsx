import { LoadingButton } from '@mui/lab';
import {
  Autocomplete, Box, Button, Collapse, DialogContent, Divider, Grid, LinearProgress, TextField, Typography,
} from '@mui/material';
import { EventInterface, Events } from '@sogebot/backend/dest/database/entity/event';
import match from 'autosuggest-highlight/match';
import parse from 'autosuggest-highlight/parse';
import { capitalize, cloneDeep } from 'lodash';
import React, { useEffect , useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { v4 } from 'uuid';

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

  const [ item, setItem ] = useState<EventInterface | null>(null);
  const [ availableEvents, setAvailableEvents ] = useState<Events.SupportedEvent[]>([]);
  const [ loading, setLoading ] = useState(true);
  const [ saving, setSaving ] = useState(false);
  const { reset, haveErrors } = useValidator();

  // const handleValueChange = <T extends keyof EventInterface>(key: T, value: EventInterface[T]) => {
  //   if (!item) {
  //     return;
  //   }
  //   const update = cloneDeep(item);
  //   update[key] = value;
  //   setItem(update);
  // };

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
    setSaving(true);
    // getSocket('/systems/alias').emit('generic::save', alias, (err, savedItem) => {
    //   if (err) {
    //     showErrors(err as any);
    //   } else {
    //     enqueueSnackbar('Alias saved.', { variant: 'success' });
    //     navigate(`/commands/alias/edit/${savedItem.id}?server=${JSON.parse(localStorage.server)}`);
    //   }
    //   setSaving(false);
    // });
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
            disablePortal
            id="plugin.update.selector"
            options={availableEvents.map(e => e.id)}
            filterOptions={(options, state) => {
              if (state.inputValue.trim().length === 0) {
                return options;
              }
              return options.filter(o => capitalize(translate(o)).toLowerCase().includes(state.inputValue.toLowerCase()));
            }}
            getOptionLabel={(option) => capitalize(translate(option))}
            renderInput={(params) => <TextField {...params} label={capitalize(translate('event'))} />}
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
          {JSON.stringify(item)}
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