import {
  Backspace, Lock, LockOpenTwoTone,
} from '@mui/icons-material';
import { TabContext, TabList } from '@mui/lab';
import {
  Alert, Box, Button, ButtonGroup, Chip, Divider, IconButton, List, ListItem, ListItemButton, ListItemText, Stack, Tab, TextField, Tooltip, Typography,
} from '@mui/material';
import { grey } from '@mui/material/colors';
import { QueueInterface } from '@sogebot/backend/src/database/entity/queue';
import { dayjs } from '@sogebot/ui-helpers/dayjsHelper';
import React from 'react';
import {
  useDidMount, useIntervalWhen, usePreviousImmediate, 
} from 'rooks';
import SimpleBar from 'simplebar-react';

import { getSocket } from '~/src/helpers/socket';
import { useStyles } from '~/src/hooks/useStyles';

import 'simplebar-react/dist/simplebar.min.css';

export const DashboardWidgetBotQueue: React.FC<{ className: string }> = ({
  className,
}) => {
  const [ value, setValue ] = React.useState('1');
  const styles = useStyles();

  const [ picked, setPicked ] = React.useState<QueueInterface[]>([]);
  const [ items, setItems ] = React.useState<QueueInterface[]>([]);
  const [ selectedUsers, setSelectedUsers ] = React.useState<number[]>([]);
  const [ locked, setLocked ] = React.useState(false);
  const [ selectCount, setSelectCount ] = React.useState(1);

  const [ eligibility, setEligibilty ] = React.useState({
    all:         true,
    subscribers: false,
  });
  const eligibilityCache = usePreviousImmediate(eligibility);

  React.useEffect(() => {
    if (selectCount < 1) {
      setSelectCount(1);
    }
  }, [selectCount]);

  useIntervalWhen(() => {
    getSocket('/systems/queue').emit('queue::getAllPicked', (err, users2: QueueInterface[]) => {
      if (err) {
        return console.error(err);
      }
      setPicked(users2);
    });

    getSocket('/systems/queue').emit('generic::getAll', (err, usersGetAll: QueueInterface[]) => {
      if (err) {
        return console.error(err);
      }
      setItems(usersGetAll);
    });
  }, 1000, true, true);

  useDidMount(() => {
    getSocket('/systems/queue').emit('settings', (err, data: any) => {
      if (err) {
        return console.error(err);
      }
      setEligibilty({
        all:         data.eligibility.eligibilityAll[0],
        subscribers: data.eligibility.eligibilitySubscribers[0],
      });
    });
    getSocket('/systems/queue').emit('get.value', 'locked', (err, locked2: boolean) => {
      if (err) {
        return console.error(err);
      }
      setLocked(locked2);
    });
  });

  const triggerEligibilityUpdate = React.useCallback(() => {
    if (eligibilityCache) {
      // all was disabled
      if (!eligibility.all && !eligibility.subscribers) {
        setEligibilty({ all: true, subscribers: false });
        return;
      }
      if (!eligibility.all && eligibilityCache.all) {
        // we cannot disable if flws and subs are disabled
        if (!eligibility.subscribers) {
          setEligibilty({ all: true, subscribers: false });
          return;
        }
      } else if (eligibility.all && !eligibilityCache.all) {
        // remove subscribers if all was enabled
        setEligibilty({ all: true, subscribers: false });
        return;
      }

      if (eligibility.all && eligibility.subscribers) {
        setEligibilty({ all: false, subscribers: eligibility.subscribers });
        return;
      }
    }
    const data = {
      eligibility: {
        eligibilityAll:         eligibility.all,
        eligibilitySubscribers: eligibility.subscribers,
      },
    };
    getSocket('/systems/queue').emit('settings.update', data, () => {
      return true;
    });
  }, [eligibility, eligibilityCache]);

  React.useEffect(() => {
    getSocket('/systems/queue').emit('set.value', { variable: 'locked', value: locked }, () => {
      return true;
    });
  }, [locked]);

  React.useEffect(() => {
    triggerEligibilityUpdate();
  }, [triggerEligibilityUpdate]);

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };

  function clear () {
    getSocket('/systems/queue').emit('queue::clear', (err) => {
      if (err) {
        return console.error(err);
      }
    });
  }
  function pick (random: boolean, count: number) {
    const data = {
      random,
      count: count,
    };
    getSocket('/systems/queue').emit('queue::pick', data, (err, users2) => {
      if (err) {
        return console.error(err);
      }
      if (users2) {
        setPicked(users2);
        setSelectedUsers([]);
        setValue('1');
      }
    });
  }

  const fUsers = React.useMemo(() => {
    if (eligibility.all) {
      return items;
    } else {
      let filteredUsers = items;
      if (eligibility.subscribers) {
        filteredUsers = filteredUsers.filter(o => o.isSubscriber);
      }
      return filteredUsers.sort(o => -(new Date(o.createdAt).getTime()));
    }
  }, [eligibility, items]);

  function pickSelected () {
    const data = {
      username: selectedUsers.map(idx => fUsers[idx].username),
      random:   false,
      count:    0,
    };
    getSocket('/systems/queue').emit('queue::pick', data, (err, users2) => {
      if (err) {
        return console.error(err);
      }
      if (users2) {
        setPicked(users2);
        setSelectedUsers([]);
        setValue('1');
      }
    });
  }

  const handleSelectOf = (id: number) => {
    if (selectedUsers.includes(id)) {
      setSelectedUsers(selectedUsers.filter(o => o !== id));
    } else {
      setSelectedUsers([id, ...selectedUsers]);
    }
  };

  return (
    <Box className={className}>
      <TabContext value={value}>
        <Box sx={{
          borderBottom: 1, borderColor: 'divider', backgroundColor: grey[900],
        }}>
          <Stack direction="row" alignItems={'center'}>
            <Box width={'100%'} height={48}>
              <TabList onChange={handleChange} scrollButtons="auto" variant="fullWidth">
                <Tab label={'Pick users'} value='1' />
                <Tab label={'Show picked'} value='2' />
              </TabList>
            </Box>
          </Stack>
        </Box>
        <Box sx={{ position: 'relative', height: 'calc(100% - 48px);' }}>
          <Box className={value === '1' ? styles.showTab : styles.hideTab}>
            <Box sx={{
              borderBottom: 1, borderColor: 'divider', backgroundColor: grey[900],
            }}>
              <Stack direction="row" alignItems={'center'}>
                <ButtonGroup color={'secondary'} variant="text" size='small' sx={{ p: 0.5, width: '100%' }}>
                  <Button
                    onClick={() => setEligibilty({ all: true, subscribers: false })}
                    color={eligibility.all ? 'success' : 'error'}
                  >ALL</Button>
                  <Button
                    onClick={() => setEligibilty({ all: false, subscribers: !eligibility.subscribers })}
                    color={eligibility.subscribers ? 'success' : 'error'}>SUBSCRIBERS</Button>
                </ButtonGroup>
                <Tooltip title="Clear list">
                  <IconButton onClick={clear}><Backspace fontSize={'small'}/></IconButton>
                </Tooltip>
                <Tooltip title={ locked ? 'Queue locked' : 'Queue opened' }>
                  <IconButton onClick={() => setLocked(!locked)} color={locked ? 'error' : 'success'}>
                    {locked && <Lock/>}
                    {!locked && <LockOpenTwoTone/>}
                  </IconButton>
                </Tooltip>
              </Stack>
            </Box>
            <SimpleBar style={{ maxHeight: 'calc(100% - 40px)' }} autoHide={false}>
              <Box>
                <TextField
                  variant="filled"
                  label='Select count to pick'
                  value={selectCount}
                  fullWidth
                  type='number'
                  inputProps={{
                    inputMode: 'numeric', pattern: '[0-9]*', min: '1',
                  }}
                  onChange={(event) => setSelectCount(Number(event.target.value))}
                />

                <Button fullWidth onClick={() => pickSelected()} disabled={fUsers.length === 0 || selectedUsers.length === 0}>
                  Pick { selectedUsers.length } selected
                </Button>
                <Button fullWidth onClick={() => pick(false, selectCount)} disabled={fUsers.length === 0}>
                  Pick first { selectCount }
                </Button>
                <Button fullWidth onClick={() => pick(true, selectCount)} disabled={fUsers.length === 0}>
                  Pick random { selectCount }
                </Button>

                <Divider sx={{ my: 1 }}>Users ({fUsers.length})</Divider>
                <List dense disablePadding>
                  {fUsers.map((user, idx) => <ListItem key={user.username}>
                    <ListItemButton selected={selectedUsers.includes(idx)} onClick={() => handleSelectOf(idx)}>
                      <ListItemText>
                        <Stack direction="row" spacing={0.5} alignItems='center'>
                          <Typography fontWeight={'bold'}>{user.username}</Typography>
                          {user.isSubscriber && <Chip label="Subscriber" size="small" variant="outlined" />}
                          <Typography fontSize={'0.8rem'} pl={0.5} color={grey[500]}>{ dayjs(user.createdAt).format('LL LTS') }</Typography>
                        </Stack>
                        <Typography component="span" variant="body2" fontStyle='italic' color={grey[500]}>{ user.message }</Typography>
                      </ListItemText>
                    </ListItemButton>
                  </ListItem>
                  )}
                </List>
              </Box>
            </SimpleBar>
          </Box>
          <Box className={value === '2' ? styles.showTab : styles.hideTab}>
            {picked.length === 0 && <Alert severity="info">No users were picked yet</Alert>}
            {picked.length > 0 && <List dense disablePadding sx={{ height: '100%', overflow: 'auto' }}>
              {picked.map((user) => <ListItem key={user.username}>
                <ListItemText>
                  <Stack direction="row" spacing={0.5} alignItems='center'>
                    <Typography fontWeight={'bold'}>{user.username}</Typography>
                    {user.isSubscriber && <Chip label="Subscriber" size="small" variant="outlined" />}
                    <Typography fontSize={'0.8rem'} pl={0.5} color={grey[500]}>{ dayjs(user.createdAt).format('LL LTS') }</Typography>
                  </Stack>
                  <Typography component="span" variant="body2" fontStyle='italic' color={grey[500]}>{ user.message }</Typography>
                </ListItemText>
              </ListItem>
              )}
            </List>}
          </Box>
        </Box>
      </TabContext>
    </Box>
  );
};