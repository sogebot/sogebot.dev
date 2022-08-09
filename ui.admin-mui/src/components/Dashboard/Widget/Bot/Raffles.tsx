import {
  Chat, Sync, SyncDisabled, VisibilityOff,
} from '@mui/icons-material';
import { TabContext, TabList } from '@mui/lab';
import {
  Alert, Autocomplete, Box, Button, Checkbox, CircularProgress, Grid, Input, InputAdornment, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Paper, Slider, Stack, Tab, Table, TableBody, TableCell, TableContainer, TableRow, TextField, Typography,
} from '@mui/material';
import {
  green, grey, red,
} from '@mui/material/colors';
import { RaffleParticipantInterface } from '@sogebot/backend/src/database/entity/raffle';
import { UserInterface } from '@sogebot/backend/src/database/entity/user';
import { dayjs } from '@sogebot/ui-helpers/dayjsHelper';
import orderBy from 'lodash/orderBy';
import React, { useCallback, useEffect } from 'react';
import { useIntervalWhen } from 'rooks';

import DashboardWidgetBotDialogConfirmRaffleClose from '~/src/components/Dashboard/Widget/Bot/Dialog/ConfirmRaffleClose';
import DashboardWidgetBotDialogConfirmRafflePick from '~/src/components/Dashboard/Widget/Bot/Dialog/ConfirmRafflePick';
import { getSocket } from '~/src/helpers/socket';
import { useStyles } from '~/src/hooks/useStyles';
import { useTranslation } from '~/src/hooks/useTranslation';
import {
  minLength, required, startsWith,
} from '~/src/validators';

export const DashboardWidgetBotRaffles: React.FC<{ className: string }> = ({
  className,
}) => {
  const [ loading, setLoading ] = React.useState(true);
  const { translate } = useTranslation();

  const [ value, setValue ] = React.useState('1');
  const styles = useStyles();

  const [ participantSearch, setParticipantSearch ] = React.useState('');
  const [ keyword, setKeyword ] = React.useState('');
  const [ keywordError, setKeywordError ] = React.useState<string[]>([]);
  const [ isTypeKeywords, setIsTypeKeywords ] = React.useState(false);
  const [ range, setRange ] = React.useState<[min: number, max: number]>([0, 1000]);
  const [ eligible, setEligible ] = React.useState([{ title: translate('everyone'), value: 'all' }]);

  const [ participants, setParticipants ] = React.useState<RaffleParticipantInterface[]>([]);
  const [ running, setRunning ] = React.useState(false);
  const [ winner, setWinner ] = React.useState<null | UserInterface>(null);

  const eligibleItems = React.useMemo(() => [
    { title: translate('everyone'), value: 'all' },
    { title: translate('subscribers'), value: 'subscribers' },
  ], [translate]);

  const typeItems = React.useMemo(() => [
    { title: translate('raffle-type-keywords'), value: true },
    { title: translate('raffle-type-tickets'), value: false },
  ], [translate]);

  const typeItemSelected = React.useMemo(() => {
    return typeItems[isTypeKeywords ? 0 : 1];
  }, [isTypeKeywords, typeItems]);

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };

  const validate = React.useCallback(() => {
    // validate
    const rules = [
      required, startsWith(['!']), minLength(2),
    ];

    const errors: string[] = [];
    for (const rule of rules) {
      const validation = rule(keyword);
      if (validation !== true) {
        errors.push(validation);
      }
    }
    setKeywordError(errors);
  }, [ keyword ]);

  const isValid = React.useMemo(() => {
    return keywordError.length === 0;
  }, [ keywordError ]);

  useEffect(() => {
    validate();
  }, [keyword, validate]);

  const fParticipants = React.useMemo(() => {
    if (participantSearch.trim().length === 0) {
      return participants;
    } else {
      return participants.filter(o => o.username.includes(participantSearch.trim()));
    }
  }, [participants, participantSearch]);

  const countEligibleParticipants = React.useMemo(() => {
    return (participants.filter(o => o.isEligible)).length;
  }, [participants]);

  const winnerMessages = React.useMemo(() => {
    if (winner) {
      const messages = orderBy(participants.find(o => o.username === winner?.userName)?.messages ?? [], 'timestamp', 'desc');
      return messages.slice(Math.max(messages.length - 5, 0));
    } else {
      return [];
    }
  }, [participants, winner]);

  const open = React.useCallback(() => {
    const out = [];
    out.push(keyword);
    if (eligible.find(o => o.value === 'subscribers')) {
      out.push('-for ' + (eligible.find(o => o.value === 'subscribers') ? 'subscribers' : ' '));
    }

    if (!isTypeKeywords) {
      out.push(`-min ${range[0]}`);
      out.push(`-max ${range[1]}`);
    }
    console.group('raffles open()');
    console.debug('out: ', out.join(' '));
    console.groupEnd();
    getSocket('/systems/raffles').emit('raffle::open', out.join(' '));
  }, [keyword, isTypeKeywords, eligible, range ]);

  const handleEligibilitySet = useCallback((newValue: typeof eligibleItems) => {
    if (newValue.length > 0) {
      // last addes is all, so we can remove rest of eligible items
      if (newValue[newValue.length - 1].value === 'all') {
        setEligible([eligibleItems[0]]);
      } else {
        setEligible(newValue.filter(o => o.value !== 'all'));
      }
    } else {
      setEligible([eligibleItems[0]]);
    }
  }, [ eligibleItems ]);

  useIntervalWhen(() => {
    // better would be to have watcher, but there is no simple way
    // to catch all relevant props without lot of a code
    localStorage.setItem('/widget/raffles/', JSON.stringify({
      eligible:       eligible,
      isTypeKeywords: isTypeKeywords,
      keyword:        keyword,
      ticketsMax:     range[1],
      ticketsMin:     range[0],
    }));

    getSocket('/systems/raffles').emit('raffle:getLatest', (err, raffle) => {
      console.groupCollapsed('raffle:getLatest');
      console.log({ err, raffle });
      console.groupEnd();
      setLoading(false);
      if (err) {
        console.error(err);
        return;
      }
      if (raffle) {
        setParticipants(raffle.participants);
        setRunning(!raffle.isClosed);

        if (!raffle.winner) {
          setWinner(null);
        } else if (winner === null || winner.userName !== raffle.winner) {
          getSocket('/systems/raffles').emit('raffle::getWinner', raffle.winner, (err2, user) => {
            if (err2) {
              return console.error(err2);
            }
            if (user) {
              setWinner(user);
            }
          });
        }

        if (!raffle.isClosed) {
          setKeyword(raffle.keyword);
          setIsTypeKeywords(raffle.type === 0);
          setRange([raffle.minTickets ?? 0, raffle.maxTickets ?? 0]);

          // set eligibility
          if (!raffle.forSubscribers) {
            setEligible([eligibleItems[0]]);
          } else {
            setEligible([]);
            const eligibilitySet = [];
            if (raffle.forSubscribers) {
              eligibilitySet.push(eligibleItems[2]);
            }
            setEligible(eligibilitySet);
          }
        }
      }
    });
  }, 1000, true, true);

  useEffect(() => {
    const cache = localStorage.getItem('/widget/raffles/');
    if (cache) {
      const parsed = JSON.parse(cache);
      setEligible(parsed.eligible);
      setIsTypeKeywords(parsed.isTypeKeywords);
      setKeyword(parsed.keyword);
      setRange([parsed.ticketsMin, parsed.ticketsMax]);
    }

  }, []);

  const handleUserEligibility = (participant: RaffleParticipantInterface) => {
    participant.isEligible = !participant.isEligible;
    setParticipants([...participants.filter(o => o.id !== participant.id), participant]);

    getSocket('/systems/raffles').emit('raffle::setEligibility', { id: participant.id as string, isEligible: participant.isEligible }, (err) => {
      if (err) {
        return console.error(err);
      }
    });
  };

  return (
    <Box className={className}>
      {loading && <Box sx={{
        display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center',
      }}>
        <CircularProgress />
      </Box>}

      {!loading && <TabContext value={value}>
        <Box sx={{
          borderBottom: 1, borderColor: 'divider', backgroundColor: grey[900],
        }}>
          <Stack direction="row" alignItems={'center'}>
            <Box width={'100%'} height={48}>
              <TabList onChange={handleChange} scrollButtons="auto" variant="fullWidth">
                <Tab label={'Raffle'} value='1' />
                <Tab label={'Participants'} value='2' />
                <Tab label={'Winner'} value='3' />
              </TabList>
            </Box>
          </Stack>
        </Box>
        <Box sx={{ position: 'relative', height: 'calc(100% - 48px);' }}>
          <Box className={value === '1' ? styles.showTab : styles.hideTab}>
            <TextField
              error={keywordError.length > 0}
              helperText={keywordError.length > 0 ? keywordError[0] : undefined}
              variant="filled"
              label='Raffle command'
              fullWidth
              disabled={running}
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              InputProps={{ endAdornment: <InputAdornment position="end">{running && <CircularProgress size={20}/>}</InputAdornment> }}
            />
            <Autocomplete
              multiple
              options={eligibleItems}
              isOptionEqualToValue={(option, v) => {
                return option.value === v.value;
              }}
              disabled={running}
              getOptionLabel={(option) => option.title}
              disableClearable
              disablePortal
              value={eligible}
              onChange={(event, newValue) => handleEligibilitySet(newValue)}
              ChipProps={{
                size:  'small',
                color: 'primary',
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  variant="filled"
                  label={translate('eligible-to-enter')}
                />
              )}
            />
            <Autocomplete
              value={typeItemSelected}
              disablePortal
              options={typeItems}
              disabled={running}
              disableClearable
              onChange={(event, newValue) => setIsTypeKeywords(newValue ? newValue.value : true)}
              getOptionLabel={(option) => option.title}
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  variant="filled"
                  label={translate('raffle-type')}
                />
              )}
            />

            {!isTypeKeywords && <Box sx={{ width: '100%', p: 1 }}>
              <Typography id="input-slider" gutterBottom color={running ? grey[500] : styles.whiteColor}>
                { translate('raffle-tickets-range') }
              </Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item>
                  <Input
                    value={range[0]}
                    disabled={running}
                    size="small"
                    onChange={(event) => setRange([Number(event.target.value), range[1]])}
                    inputProps={{
                      step:              10,
                      min:               0,
                      max:               10000,
                      type:              'number',
                      'aria-labelledby': 'input-slider',
                    }}
                  />
                </Grid>
                <Grid item xs>
                  <Slider
                    value={range}
                    disabled={running}
                    valueLabelDisplay="auto"
                    max={10000}
                    onChange={(event, newValue) => setRange(newValue as [min: number, max: number])}
                  />
                </Grid>
                <Grid item>
                  <Input
                    value={range[1]}
                    size="small"
                    disabled={running}
                    onChange={(event) => setRange([range[0], Number(event.target.value)])}
                    inputProps={{
                      step:              10,
                      min:               0,
                      max:               10000,
                      type:              'number',
                      'aria-labelledby': 'input-slider',
                    }}
                  />
                </Grid>
              </Grid>
            </Box>}

            <Box sx={{
              width: '100%', p: 1, textAlign: 'center',
            }}>
              {!running && <Button onClick={open} disabled={!isValid} sx={{ width: '400px' }} variant='contained'>
                Open raffle
              </Button>}

              {running && <Stack spacing={1} sx={{ alignItems: 'center' }}>
                <DashboardWidgetBotDialogConfirmRaffleClose/>
                <DashboardWidgetBotDialogConfirmRafflePick onPick={() => setValue('3')}/>
              </Stack>}
            </Box>
          </Box>
          <Box className={value === '2' ? styles.showTab : styles.hideTab}>
            <TextField
              variant="filled"
              label='Search'
              fullWidth
              value={participantSearch}
              onChange={(event) => setParticipantSearch(event.target.value)}
            />
            <Box sx={{
              width: '100%', height: 'calc(100% - 48px)', overflow: 'hidden',
            }}>
              <List dense disablePadding>
                {fParticipants.map((participant) => <ListItem key={participant.id} disablePadding disableGutters>
                  <ListItemButton onClick={() => handleUserEligibility(participant)}>
                    <ListItemIcon>
                      <Checkbox checked={participant.isEligible}></Checkbox>
                    </ListItemIcon>
                    <ListItemText>
                      { participant.username }
                    </ListItemText>
                  </ListItemButton>
                </ListItem>)}

                {Math.abs(fParticipants.length - participants.length) > 0 && <ListItem>
                  <ListItemIcon>
                    <VisibilityOff/>
                  </ListItemIcon>
                  <ListItemText>
                    { Math.abs(fParticipants.length - participants.length) } { translate('hidden') }
                  </ListItemText>
                </ListItem>}
              </List>
            </Box>
          </Box>
          <Box className={value === '3' ? styles.showTab : styles.hideTab}>
            {!winner && <Alert severity="info">No winner was picked yet.</Alert>}
            {winner && <Box>
              <Grid container>
                <Grid item xs={12} textAlign={'center'}>
                  <Typography variant="h3">{ winner.userName }</Typography>
                </Grid>
                <Grid item xs={6} textAlign={'center'}>
                  <Typography variant="button" color={winner.isSubscriber ? green[400] : red[400]}>{ translate('subscriber') }</Typography>
                </Grid>

                <Grid item xs={12} sx={{ pt: 2, textAlign: 'center' }}>
                  {countEligibleParticipants > 0 && <DashboardWidgetBotDialogConfirmRafflePick onPick={() => setValue('3')} color="primary" title={<Stack direction="row"><Sync/>{ translate('roll-again')}</Stack>}/>}
                  {countEligibleParticipants === 0 && <Button disabled sx={{ width: '400px' }} variant='contained'><SyncDisabled/>{ translate('no-eligible-participants') }</Button>}
                </Grid>

                <Grid item xs={12} sx={{ p: 2 }}>
                  <Stack direction='row' spacing={1}>
                    <Chat/>
                    <Typography variant="button">{ translate('messages') }</Typography>
                  </Stack>

                  {winnerMessages.length === 0 && <Alert severity='info'>No messages from winner yet.</Alert>}
                  {winnerMessages.length > 0 &&<TableContainer component={Paper} sx={{ p: 1 }}>
                    <Table size="small">
                      <TableBody>
                        {winnerMessages.map((message) => (
                          <TableRow
                            key={message.timestamp}
                            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                          >
                            <TableCell component="th" scope="row">
                              { message.text }
                            </TableCell>
                            <TableCell align="right">{ dayjs(message.timestamp).format('LL LTS') }</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>}
                </Grid>
              </Grid>
            </Box>}

          </Box>
        </Box>
      </TabContext>}
    </Box>
  );
};