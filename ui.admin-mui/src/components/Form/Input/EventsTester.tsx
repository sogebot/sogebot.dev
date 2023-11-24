import { CasinoTwoTone } from '@mui/icons-material';
import { Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, FormControlLabel, Grid, IconButton, InputLabel, MenuItem, Select, TextField } from '@mui/material';
import { useSnackbar } from 'notistack';
import React from 'react';

import { FormNumericInput } from './Numeric';
import { getSocket } from '../../../helpers/socket';
import { useTranslation } from '../../../hooks/useTranslation';

type Props = {
  variables: string[];
  eventId?:  string;
};

const EventsTester: React.FC<Props> = (props) => {
  const { translate } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();

  const [ open, setOpen ] = React.useState(false);

  const variables = props.variables.filter(variable => !variable.includes('Name') && !['currency', 'currencyInBot'].includes(variable));

  const [ randomized, setRandomized ] = React.useState<string[]>(variables);
  const [ values, setValues ] = React.useState<any[]>(variables.map(() => ''));

  React.useEffect(() => {
    setRandomized(variables);
    setValues(variables.map(variable => {
      if (variable.startsWith('is.') || variable.startsWith('recipientis.') || variable === 'method' || variable === 'subStreakShareEnabled') {
        return true;
      } else if (variable === 'tier') {
        return 'Prime';
      } else if (variable === 'level') {
        return '1';
      } else if (variable === 'lastContributionType') {
        return 'BITS';
      } else if (['lastContributionTotal', 'topContributionsSubsTotal', 'topContributionsBitsTotal', 'total', 'goal', 'duration', 'viewers', 'bits', 'subCumulativeMonths', 'count', 'subStreak', 'amount', 'amountInBotCurrency'].includes(variable)) {
        return 0;
      } else if (variable === 'source') {
        return 'Twitch';
      } else {
        return '';
      }
    }));
  }, [ props.variables ]);

  const toggleRandomized = (variable: string) => () => {
    setRandomized(randomized.includes(variable) ? randomized.filter((v) => v !== variable) : [ ...randomized, variable ]);
  };

  return <>
    <Button onClick={() => setOpen(true)} sx={{ width: 150 }} variant='contained' color='light' disabled={props.eventId === undefined}>Tester</Button>
    <Dialog
      open={open}
      fullWidth
      maxWidth='xl'>
      <DialogTitle>Tester</DialogTitle>
      <DialogContent dividers>
        {variables.map((variable: string, idx) => <Grid container key={variable}>
          <Grid>
            <IconButton onClick={toggleRandomized(variable)} color={ randomized.includes(variable) ? 'success' : 'error' } >
              <CasinoTwoTone sx={{
                transition: 'all 100ms',
              }}/>
            </IconButton>
          </Grid>
          <Grid xs>
            {(variable.startsWith('is.') || variable.startsWith('recipientis.') || variable === 'subStreakShareEnabled') && <FormControlLabel
              disabled={randomized.includes(variable)}
              control={<Checkbox checked={values[idx] ?? true} onChange={(_ev, checked) => setValues(val => {
                val[idx] = checked;
                return [ ...val ];
              })} />}
              label={translate('responses.variable.' + variable)} />}

            {variable === 'method' && <FormControlLabel
              disabled={randomized.includes(variable)}
              control={<Checkbox checked={values[idx] ?? true} onChange={(_ev, checked) => setValues(val => {
                val[idx] = checked;
                return [ ...val ];
              })} />}
              label='Twitch Prime' />}

            {['lastContributionTotal', 'topContributionsSubsTotal', 'topContributionsBitsTotal', 'total', 'goal', 'duration', 'viewers', 'bits', 'subCumulativeMonths', 'count', 'subStreak', 'amount', 'amountInBotCurrency'].includes(variable)
            && <FormNumericInput
              fullWidth
              min={0}
              value={values[idx]}
              size='small'
              label={translate('responses.variable.' + variable)}
              onChange={(value) => setValues(val => {
                val[idx] = value;
                return [ ...val ];
              })}
              disabled={randomized.includes(variable)}>
            </FormNumericInput>}

            {['lastContributionUsername', 'lastContributionUserId', 'topContributionsBitsUserId', 'topContributionsBitsUsername', 'topContributionsSubsUserId', 'topContributionsSubsUsername', 'game', 'oldGame', 'target', 'username', 'recipient', 'command'].includes(variable)
          && <TextField
            fullWidth
            size='small'
            value={values[idx]}
            label={translate('responses.variable.' + variable)}
            onChange={(ev) => setValues(val => {
              val[idx] = ev.currentTarget.value;
              return [ ...val ];
            })}
            disabled={randomized.includes(variable)}>
          </TextField>}

            {['userInput', 'message', 'reason'].includes(variable)
          && <TextField
            multiline
            fullWidth
            size='small'
            value={values[idx]}
            label={translate('responses.variable.' + variable)}
            onChange={(ev) => setValues(val => {
              val[idx] = ev.currentTarget.value;
              return [ ...val ];
            })}
            disabled={randomized.includes(variable)}>
          </TextField>}

            {variable === 'level' && <FormControl fullWidth disabled={randomized.includes(variable)}>
              <InputLabel id='level'>{translate('responses.variable.' + variable)}</InputLabel>
              <Select
                labelId='level'
                size='small'
                label={translate('responses.variable.' + variable)}
                value={values[idx] ?? 'BITS'}
                onChange={(ev) => setValues(val => {
                  val[idx] = ev.target.value;
                  return [ ...val ];
                })}
              >
                {['1', '2', '3', '4', '5'].map(val => <MenuItem value={val}>{val}</MenuItem>)}
              </Select>
            </FormControl>}

            {variable === 'source' && <FormControl fullWidth disabled={randomized.includes(variable)}>
              <InputLabel id='source'>{translate('responses.variable.' + variable)}</InputLabel>
              <Select
                labelId='source'
                size='small'
                label={translate('responses.variable.' + variable)}
                value={values[idx] ?? 'Twitch'}
                onChange={(ev) => setValues(val => {
                  val[idx] = ev.target.value;
                  return [ ...val ];
                })}
              >
                {['Twitch', 'Discord'].map(val => <MenuItem value={val}>{val}</MenuItem>)}
              </Select>
            </FormControl>}

            {variable === 'lastContributionType' && <FormControl fullWidth disabled={randomized.includes(variable)}>
              <InputLabel id='lastContributionType'>{translate('responses.variable.' + variable)}</InputLabel>
              <Select
                labelId='lastContributionType'
                size='small'
                label={translate('responses.variable.' + variable)}
                value={values[idx] ?? 'Prime'}
                onChange={(ev) => setValues(val => {
                  val[idx] = ev.target.value;
                  return [ ...val ];
                })}
              >
                {['BITS', 'SUBS'].map(val => <MenuItem value={val}>{val}</MenuItem>)}
              </Select>
            </FormControl>}

            {variable === 'tier' && <FormControl fullWidth disabled={randomized.includes(variable)}>
              <InputLabel id='tier'>{translate('responses.variable.' + variable)}</InputLabel>
              <Select
                labelId='tier'
                size='small'
                label={translate('responses.variable.' + variable)}
                value={values[idx] ?? 'Prime'}
                onChange={(ev) => setValues(val => {
                  val[idx] = ev.target.value;
                  return [ ...val ];
                })}
              >
                {['Prime', '0', '1', '2'].map(val => <MenuItem value={val}>{val}</MenuItem>)}
              </Select>
            </FormControl>}
          </Grid>
        </Grid>)}
      </DialogContent>
      <DialogActions>
        <Button sx={{ width: '150px' }} onClick={() => setOpen(false)}>Close</Button>
        <Button variant='contained' color='light' sx={{ width: '150px' }} onClick={() => {
          if (!props.eventId) {
            return;
          }
          console.log({
            id: props.eventId, randomized: randomized, values: values, variables: variables,
          });
          enqueueSnackbar('Event sent', { variant: 'success' });
          getSocket('/core/events').emit('test.event', {
            id: props.eventId, randomized: randomized, values: values, variables: variables,
          }, () => {
            return true;
          });
        }}>Test</Button>
      </DialogActions>
    </Dialog>
  </>;
};

export { EventsTester };