import { ChatTwoTone, SyncDisabledTwoTone, SyncTwoTone, VisibilityOffTwoTone } from '@mui/icons-material';
import { TabContext, TabList } from '@mui/lab';
import { Alert, Autocomplete, Box, Button, Checkbox, CircularProgress, Grid, Input, InputAdornment, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Paper, Slider, Stack, SxProps, Tab, Table, TableBody, TableCell, TableContainer, TableRow, TextField, Typography } from '@mui/material';
import { green, grey, red } from '@mui/material/colors';
import { RaffleInterface } from '@sogebot/backend/dest/database/entity/raffle';
import { RaffleParticipantInterface } from '@sogebot/backend/src/database/entity/raffle';
import { UserInterface } from '@sogebot/backend/src/database/entity/user';
import axios from 'axios';
import { isEqual } from 'lodash';
import orderBy from 'lodash/orderBy';
import { useConfirm } from 'material-ui-confirm';
import React, { useCallback, useEffect } from 'react';
import { useIntervalWhen } from 'rooks';

import { SECOND } from '../../../../constants';
import { dayjs } from '../../../../helpers/dayjsHelper';
import { useScope } from '../../../../hooks/useScope';
import { useTranslation } from '../../../../hooks/useTranslation';
import { minLength, required, startsWith } from '../../../../validators';
import { classes } from '../../../styles';

let lastUpdateAt = 0;

export const DashboardWidgetBotRaffles: React.FC<{ sx: SxProps, active: boolean }> = ({
  sx, active,
}) => {
  const scope = useScope('systems:raffles');

  const [ loading, setLoading ] = React.useState(true);
  const { translate } = useTranslation();

  const confirm = useConfirm();

  const [ value, setValue ] = React.useState('1');

  const [ participantSearch, setParticipantSearch ] = React.useState('');
  const [ keyword, setKeyword ] = React.useState('');
  const [ keywordError, setKeywordError ] = React.useState<string[]>([]);
  const [ isTypeKeywords, setIsTypeKeywords ] = React.useState(false);
  const [ range, setRange ] = React.useState<[min: number, max: number]>([0, 1000]);
  const [ eligible, setEligible ] = React.useState([{
    title: translate('everyone'), value: 'all',
  }]);

  const [ raffle, setRaffle ] = React.useState<RaffleInterface | null>(null);
  const [ winner, setWinner ] = React.useState<null | UserInterface>(null);

  const eligibleItems = React.useMemo(() => [
    {
      title: translate('everyone'), value: 'all',
    },
    {
      title: translate('subscribers'), value: 'subscribers',
    },
  ], [translate]);

  const typeItems = React.useMemo(() => [
    {
      title: translate('raffle-type-keywords'), value: true,
    },
    {
      title: translate('raffle-type-tickets'), value: false,
    },
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
      return (raffle?.participants || []);
    } else {
      return (raffle?.participants || []).filter(o => o.username.includes(participantSearch.trim()));
    }
  }, [raffle, participantSearch]);

  const countEligibleParticipants = React.useMemo(() => {
    return ((raffle?.participants || []).filter(o => o.isEligible)).length;
  }, [raffle]);

  const winnerMessages = React.useMemo(() => {
    if (winner) {
      const messages = orderBy((raffle?.participants || []).find(o => o.username === winner?.userName)?.messages ?? [], 'timestamp', 'desc');
      return messages.slice(Math.max(messages.length - 5, 0));
    } else {
      return [];
    }
  }, [raffle, winner]);

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
    axios.post('/api/systems/raffles/?_action=open', { message: out.join(' ') })
      .then(({ data }) => {
        const raffleResponse = data.data;
        setRaffle(raffleResponse);
      })
      .catch((error) => {
        console.error("Failed to open raffle:", error);
      });
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

  const refresh = () => {
    axios.get('/api/systems/raffles').then(({ data }) => {
      const raffleResponse = data.data;
      console.groupCollapsed('raffle:getLatest');
      console.log({
        raffle, raffleResponse
      });
      console.groupEnd();
      setLoading(false);

      if (!isEqual(raffle, raffleResponse)) {
        setRaffle(raffleResponse || null);
        setKeyword(raffleResponse?.keyword ?? '');
      }
    })
    .catch((error) => {
      console.error("Failed to refresh raffle data:", error);
      setLoading(false);
    });
  };
  useIntervalWhen(() => {
    if (!active) {
      // do nothing if not visible
      return;
    }

    if (Date.now() - lastUpdateAt < SECOND * 10) {
      // not time to update yet
      return;
    }

    lastUpdateAt = Date.now();

    refresh();
  }, 1000, true, true);

  useEffect(() => {
    if (raffle) {
      if (!raffle.winner) {
        setWinner(null);
      } else if (winner === null || winner.userName !== raffle.winner) {
        axios.get(`/api/core/users/${raffle.winner}?_query=userName`)
          .then(({ data }) => {
            setWinner(data.data);
          })
         .catch((error) => {
           console.error("Failed to fetch winner information:", error);
         });
      }

      if (!raffle?.isClosed) {
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
  }, [ raffle, eligibleItems, winner ]);

  const handleUserEligibility = (participant: RaffleParticipantInterface) => {
    if (!scope.manage) {
      return;
    }
    participant.isEligible = !participant.isEligible;
    setRaffle(r => r ? {
      ...r, participants: [...r.participants.filter(o => o.id !== participant.id), participant],
    } : null);

    axios.post('/api/systems/raffles/?_action=eligibility', {
      id: participant.id, isEligible: participant.isEligible,
    })
    .catch((error) => {
      console.error("Failed to update participant eligibility:", error);
    });
    });
  };

  const closeRaffle = () => {
    confirm({
      title: 'Do you want to close raffle without a winner?',
      confirmationText: 'Ok',
      cancellationText: 'Cancel',
    })
      .then(() => {
        axios.post('/api/systems/raffles/?_action=close')
          .then(() => {
            refresh();
          });
      })
      .catch(() => {});
  };

  const pickRaffle = () => {
    confirm({
      title: 'Do you want to close pick a winner of raffle?',
      confirmationText: 'Ok',
      cancellationText: 'Cancel',
    })
      .then(() => {
        axios.post('/api/systems/raffles/?_action=pick')
          .then(() => {
            refresh();
            setValue('3');
          });
      })
      .catch(() => {});
  };

  return (
    <Box sx={sx}>
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
        <Box sx={{
          position: 'relative', height: 'calc(100% - 48px);',
        }}>
          <Box sx={value === '1' ? classes.showTab : classes.hideTab}>
            <TextField
              error={keywordError.length > 0}
              helperText={keywordError.length > 0 ? keywordError[0] : undefined}
              variant="filled"
              label='Raffle command'
              fullWidth
              disabled={!raffle?.isClosed || !scope.manage}
              value={keyword }
              onChange={(event) => setKeyword(event.target.value)}
              InputProps={{ endAdornment: <InputAdornment position="end">{!raffle?.isClosed && <CircularProgress size={20}/>}</InputAdornment> }}
            />
            <Autocomplete
              multiple
              options={eligibleItems}
              isOptionEqualToValue={(option, v) => {
                return option.value === v.value;
              }}
              disabled={!raffle?.isClosed || !scope.manage}
              getOptionLabel={(option) => option.title}
              disableClearable
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
              options={typeItems}
              disabled={!raffle?.isClosed || !scope.manage}
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

            {!isTypeKeywords && <Box sx={{
              width: '100%', p: 1,
            }}>
              <Typography id="input-slider" gutterBottom color={!raffle?.isClosed || !scope.manage ? grey[500] : classes.whiteColor}>
                { translate('raffle-tickets-range') }
              </Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item>
                  <Input
                    value={range[0]}
                    disabled={!raffle?.isClosed || !scope.manage}
                    size="small"
                    onChange={(event) => setRange([Number(event.target.value), range[1]])}
                    inputProps={{
                      step:              10,
                      min:               1,
                      max:               10000,
                      type:              'number',
                      'aria-labelledby': 'input-slider',
                    }}
                  />
                </Grid>
                <Grid item xs>
                  <Slider
                    value={range}
                    disabled={!raffle?.isClosed || !scope.manage}
                    valueLabelDisplay="auto"
                    min={1}
                    max={10000}
                    onChange={(event, newValue) => setRange(newValue as [min: number, max: number])}
                  />
                </Grid>
                <Grid item>
                  <Input
                    value={range[1]}
                    size="small"
                    disabled={!raffle?.isClosed || !scope.manage}
                    onChange={(event) => setRange([range[0], Number(event.target.value)])}
                    inputProps={{
                      step:              10,
                      min:               1,
                      max:               10000,
                      type:              'number',
                      'aria-labelledby': 'input-slider',
                    }}
                  />
                </Grid>
              </Grid>
            </Box>}

            {scope.manage && <Box sx={{
              width: '100%', p: 1, textAlign: 'center',
            }}>
              {!!raffle?.isClosed && <Button onClick={open} disabled={!isValid} sx={{ width: '400px' }} variant='contained'>
                Open raffle
              </Button>}

              {!raffle?.isClosed && <Stack spacing={1} sx={{ alignItems: 'center' }}>
                <Button onClick={closeRaffle} sx={{ width: '400px' }} variant='contained' color='warning'>
                  Close raffle
                </Button>
                <Button onClick={pickRaffle} sx={{ width: '400px' }} variant='contained' color='success'>
                  Pick winner
                </Button>
              </Stack>}
            </Box>}
          </Box>
          <Box sx={value === '2' ? classes.showTab : classes.hideTab}>
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
                      <Checkbox checked={participant.isEligible} disabled={!scope.manage}></Checkbox>
                    </ListItemIcon>
                    <ListItemText>
                      { participant.username }
                    </ListItemText>
                  </ListItemButton>
                </ListItem>)}

                {Math.abs(fParticipants.length - (raffle?.participants || []).length) > 0 && <ListItem sx={{
                  userSelect: 'none',
                  p: 1.4,
                  px: 3,
                }}>
                  <ListItemIcon>
                    <VisibilityOffTwoTone/>
                  </ListItemIcon>
                  <ListItemText>
                    { Math.abs(fParticipants.length - (raffle?.participants || []).length) } { translate('hidden') }
                  </ListItemText>
                </ListItem>}
              </List>
            </Box>
          </Box>
          <Box sx={value === '3' ? classes.showTab : classes.hideTab}>
            {!winner && <Alert severity="info">No winner was picked yet.</Alert>}
            {winner && <Box>
              <Grid container>
                <Grid item xs={12} textAlign={'center'}>
                  <Typography variant="h3">{ winner.userName }</Typography>
                </Grid>
                <Grid item xs={6} textAlign={'center'}>
                  <Typography variant="button" color={winner.isSubscriber ? green[400] : red[400]}>{ translate('subscriber') }</Typography>
                </Grid>

                {scope.manage && <Grid item xs={12} sx={{
                  pt: 2, textAlign: 'center',
                }}>
                  {countEligibleParticipants > 0 && <Button onClick={pickRaffle}><Stack direction="row"><SyncTwoTone/>{ translate('roll-again')}</Stack></Button>}
                  {countEligibleParticipants === 0 && <Button disabled sx={{ width: '400px' }} variant='contained'><SyncDisabledTwoTone/>{ translate('no-eligible-participants') }</Button>}
                </Grid>}

                <Grid item xs={12} sx={{ p: 2 }}>
                  <Stack direction='row' spacing={1}>
                    <ChatTwoTone/>
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