import { Backspace, Lock, LockOpenTwoTone } from '@mui/icons-material';
import { TabContext, TabList } from '@mui/lab';
import { Alert, Box, Button, ButtonGroup, Chip, Divider, IconButton, List, ListItem, ListItemButton, ListItemText, Stack, SxProps, Tab, TextField, Tooltip, Typography } from '@mui/material';
import { grey } from '@mui/material/colors';
import { QueueInterface } from '@sogebot/backend/src/database/entity/queue';
import axios from 'axios';
import { isEqual } from 'lodash';
import React from 'react';
import { useIntervalWhen } from 'rooks';
import SimpleBar from 'simplebar-react';

import 'simplebar-react/dist/simplebar.min.css';
import getAccessToken from '../../../../getAccessToken';
import { dayjs } from '../../../../helpers/dayjsHelper';
import { useScope } from '../../../../hooks/useScope';
import { useSettings } from '../../../../hooks/useSettings';
import { classes } from '../../../styles';

export const DashboardWidgetBotQueue: React.FC<{ sx: SxProps }> = ({
  sx,
}) => {
  const scope = useScope('queue');

  const [ value, setValue ] = React.useState('1');

  const [ picked, setPicked ] = React.useState<QueueInterface[]>([]);
  const [ items, setItems ] = React.useState<QueueInterface[]>([]);
  const [ selectedUsers, setSelectedUsers ] = React.useState<number[]>([]);
  const [ locked, setLocked ] = React.useState(false);
  const [ selectCount, setSelectCount ] = React.useState(1);

  const { settings, handleChange: handleSettingsChange } = useSettings('/systems/queue');

  React.useEffect(() => {
    axios.get('/api/settings/systems/queue/locked', {
      headers: {
        Authorization: `Bearer ${getAccessToken()}`
      }
    }).then(({ data }) => {
      setLocked(data.data);
    });
  }, []);

  React.useEffect(() => {
    if (selectCount < 1) {
      setSelectCount(1);
    }
  }, [selectCount]);

  useIntervalWhen(() => {
    axios.get('/api/systems/queue?_action=picked', {
      headers: {
        Authorization: `Bearer ${getAccessToken()}`
      }
    }).then(({ data }) => {
      if (!isEqual(picked, data.data)) {
        setPicked(data.data);
      }
    });
  }, 1000, true, true);

  useIntervalWhen(() => {
    axios.get('/api/systems/queue', {
      headers: {
        Authorization: `Bearer ${getAccessToken()}`
      }
    }).then(({ data }) => {
      if (!isEqual(items, data.data)) {
        setItems(data.data);
      }
    });
  }, 5000, true, true);

  React.useEffect(() => {
    axios.post('/api/settings/systems/queue/locked', { value: locked }, {
      headers: {
        Authorization: `Bearer ${getAccessToken()}`
      }
    });
  }, [locked]);

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };

  function clear () {
    axios.post('/api/systems/queue?_action=clear', undefined, {
      headers: {
        Authorization: `Bearer ${getAccessToken()}`
      }
    });
  }
  function pick (random: boolean, count: number) {
    axios.post('/api/systems/queue?_action=pick', { random, count }, {
      headers: {
        Authorization: `Bearer ${getAccessToken()}`
      }
    })
      .then(({ data }) => {
        setPicked(data.data);
        setSelectedUsers([]);
        setValue('1');
      });
  }

  const fUsers = React.useMemo(() => {
    if (!settings) {
      return [];
    }
    if (settings.eligibility.eligibilityAll[0]) {
      return items;
    } else {
      let filteredUsers = items;
      if (settings.eligibility.eligibilitySubscribers) {
        filteredUsers = filteredUsers.filter(o => o.isSubscriber);
      }
      return filteredUsers.sort(o => -(new Date(o.createdAt).getTime()));
    }
  }, [settings, items]);

  function pickSelected () {
    axios.post('/api/systems/queue?_action=pick', {
      username: selectedUsers.map(idx => fUsers[idx].username),
      random:   false,
      count:    0,
    }, {
      headers: {
        Authorization: `Bearer ${getAccessToken()}`
      }
    })
      .then(({ data }) => {
        setPicked(data.data);
        setSelectedUsers([]);
        setValue('1');
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
    <Box sx={sx}>
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
        <Box sx={{
          position: 'relative', height: 'calc(100% - 48px);',
        }}>
          <Box sx={value === '1' ? classes.showTab : classes.hideTab}>
            <Box sx={{
              borderBottom: 1, borderColor: 'divider', backgroundColor: grey[900],
            }}>
              <Stack direction="row" alignItems={'center'}>
                <ButtonGroup disabled={!scope.manage} color={'secondary'} variant="text" size='small' sx={{
                  p: 0.5, width: '100%',
                }}>
                  <Button
                    onClick={() => handleSettingsChange({
                      'eligibility.eligibilityAll': true,
                      'eligibility.eligibilitySubscribers': false,
                    }, undefined, true)}
                    color={settings?.eligibility.eligibilityAll[0] ? 'success' : 'error'}
                  >ALL</Button>
                  <Button
                    onClick={() => handleSettingsChange({
                      'eligibility.eligibilityAll': false,
                      'eligibility.eligibilitySubscribers': !settings?.eligibility.eligibilitySubscribers[0],
                    }, undefined, true)}
                    color={settings?.eligibility.eligibilitySubscribers[0] ? 'success' : 'error'}>SUBSCRIBERS</Button>
                </ButtonGroup>
                <Tooltip title="Clear list">
                  <IconButton onClick={clear}><Backspace fontSize={'small'}/></IconButton>
                </Tooltip>
                <Tooltip title={ locked ? 'Queue locked' : 'Queue opened' }>
                  <IconButton onClick={() => setLocked(!locked)} color={locked ? 'error' : 'success'} disabled={!scope.manage}>
                    {locked && <Lock/>}
                    {!locked && <LockOpenTwoTone/>}
                  </IconButton>
                </Tooltip>
              </Stack>
            </Box>
            <SimpleBar style={{ maxHeight: 'calc(100% - 40px)' }} autoHide={false}>
              <Box>
                {scope.manage && <>
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
                </>}

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
                  </ListItem>,
                  )}
                </List>
              </Box>
            </SimpleBar>
          </Box>
          <Box sx={value === '2' ? classes.showTab : classes.hideTab}>
            {picked.length === 0 && <Alert severity="info">No users were picked yet</Alert>}
            {picked.length > 0 && <List dense disablePadding sx={{
              height: '100%', overflow: 'auto',
            }}>
              {picked.map((user) => <ListItem key={user.username}>
                <ListItemText>
                  <Stack direction="row" spacing={0.5} alignItems='center'>
                    <Typography fontWeight={'bold'}>{user.username}</Typography>
                    {user.isSubscriber && <Chip label="Subscriber" size="small" variant="outlined" />}
                    <Typography fontSize={'0.8rem'} pl={0.5} color={grey[500]}>{ dayjs(user.createdAt).format('LL LTS') }</Typography>
                  </Stack>
                  <Typography component="span" variant="body2" fontStyle='italic' color={grey[500]}>{ user.message }</Typography>
                </ListItemText>
              </ListItem>,
              )}
            </List>}
          </Box>
        </Box>
      </TabContext>
    </Box>
  );
};