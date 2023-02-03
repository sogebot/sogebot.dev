import {
  CheckBoxTwoTone, DisabledByDefaultTwoTone, DownloadTwoTone, ThumbDown, ThumbDownTwoTone, ThumbUp, ThumbUpTwoTone,
} from '@mui/icons-material';
import {
  Backdrop,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { green, red } from '@mui/material/colors';
import { Plugin } from '@sogebot/backend/dest/database/entity/plugins';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import React, {
  useCallback, useEffect, useMemo, useState,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import shortid from 'shortid';
import { v4 } from 'uuid';

import { Plugin as RemotePlugin } from '../../../../services/plugins/export';
import { ButtonsDeleteBulk } from '../../components/Buttons/DeleteBulk';
import { DeleteButton } from '../../components/Buttons/DeleteButton';
import EditButton from '../../components/Buttons/EditButton';
import getAccessToken from '../../getAccessToken';
import { dayjs } from '../../helpers/dayjsHelper';
import { getSocket } from '../../helpers/socket';
import { useColumnMaker } from '../../hooks/useColumnMaker';
import { useFilter } from '../../hooks/useFilter';
import { setBulkCount } from '../../store/appbarSlice';

const PageRegistryPlugins = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { enqueueSnackbar } = useSnackbar();

  const [ items, setItems ] = useState<Plugin[]>([]);
  const [ remoteItems, setRemoteItems ] = useState<RemotePlugin[]>([]);

  const [ loading, setLoading ] = useState(true);
  const [ importing, setImporting ] = useState<string[]>([]);
  const { bulkCount } = useSelector((state: any) => state.appbar);
  const [ selection, setSelection ] = useState<(string|number)[]>([]);

  const { useFilterSetup  } = useColumnMaker<Plugin>([
    {
      columnName:  'actions',
      table:       { width: 130 },
      sorting:     { sortingEnabled: false },
      translation: ' ',
      column:      {
        getCellValue: (row) => [
          <Stack direction="row" key="row">
            <EditButton
              href={'/registry/plugins/edit/' + row.id}
            />
            <DeleteButton key='delete' onDelete={() => deleteItem(row)} />
          </Stack>,
        ],
      },
    },
  ]);

  const { element: filterElement } = useFilter(useFilterSetup);

  const { useFilterSetup: useFilterSetupRemotePlugin  } = useColumnMaker<RemotePlugin & { mine: boolean, voted: boolean }>([
    {
      columnName: 'name',
      filtering:  { type: 'string' },
    },
    {
      columnName: 'description',
      filtering:  { type: 'string' },
    },
    {
      columnName: 'mine',
      filtering:  { type: 'boolean' },
    },
    {
      columnName: 'voted',
      filtering:  { type: 'boolean' },
    },
  ]);

  const { element: filterElementRemotePlugin } = useFilter(useFilterSetupRemotePlugin);

  const refresh = useCallback(async () => {
    await Promise.all([
      new Promise<void>(resolve => {
        getSocket('/core/plugins').emit('generic::getAll', (_, data) => {
          setItems(data);
          resolve();
        });
      }),
      new Promise<void>(resolve => {
        axios.get(`https://plugins.sogebot.xyz/plugins`, { headers: { authorization: `Bearer ${localStorage.code}` } })
          .then(({ data }) => {
            setRemoteItems(data);
          })
          .finally(resolve);
      }),
    ]);
    setLoading(false);
  }, []);

  const deleteItem = useCallback((item: Plugin) => {
    axios.delete(`${JSON.parse(sessionStorage.server)}/api/registry/plugins/${item.id}`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
      .finally(() => {
        enqueueSnackbar(`Plugin ${item.name} (${item.id}) deleted successfully.`, { variant: 'success' });
        refresh();
      });
  }, [ enqueueSnackbar, refresh ]);

  useEffect(() => {
    refresh();
  }, [location.pathname, refresh]);

  useEffect(() => {
    dispatch(setBulkCount(selection.length));
  }, [selection, dispatch]);

  const bulkCanEnable = useMemo(() => {
    for (const itemId of selection) {
      const item = items.find(o => o.id === itemId);
      if (item && !item.enabled) {
        return true;
      }
    }
    return false;
  }, [ selection, items ]);

  const bulkCanDisable = useMemo(() => {
    for (const itemId of selection) {
      const item = items.find(o => o.id === itemId);
      if (item && item.enabled) {
        return true;
      }
    }
    return false;
  }, [ selection, items ]);

  const bulkToggleAttribute = useCallback(async <T extends keyof Plugin>(attribute: T, value: Plugin[T]) => {
    for (const selected of selection) {
      const item = items.find(o => o.id === selected);
      if (item && item[attribute] !== value) {
        await new Promise<void>((resolve) => {
          item[attribute] = value;
          axios.post(`${JSON.parse(sessionStorage.server)}/api/registry/plugins`, item, { headers: { authorization: `Bearer ${getAccessToken()}` } })
            .then(() => {
              resolve();
            });
        });
      }
    }

    setItems(i => i.map((item) => {
      if (selection.includes(item.id)) {
        item[attribute] = value;
      }
      return item;
    }));

    if (attribute === 'enabled') {
      enqueueSnackbar(`Bulk operation set ${value ? 'enabled' : 'disabled'}.`, { variant: 'success' });
    }

    refresh();
  }, [ enqueueSnackbar, items, selection, refresh ]);

  const bulkDelete =  useCallback(async () => {
    for (const selected of selection) {
      const item = items.find(o => o.id === selected);
      if (item) {
        await new Promise<void>((resolve) => {
          axios.delete(`${JSON.parse(sessionStorage.server)}/api/registry/plugins/${item.id}`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
            .finally(() => {
              resolve();
            });
        });
      }
    }
    setItems(i => i.filter(item => !selection.includes(item.id)));
    enqueueSnackbar(`Bulk operation deleted items.`, { variant: 'success' });
    setSelection([]);
  }, [ selection, enqueueSnackbar, items ]);

  const calculateVotes = (votes: RemotePlugin['votes']) => {
    return votes.reduce((prev, cur) => prev + cur.vote, 0);
  };

  const votedThumbsUp = (votes: RemotePlugin['votes']) => {
    return !!votes.find(o => o.userId === localStorage.userId && o.vote === 1);
  };

  const votedThumbsDown = (votes: RemotePlugin['votes']) => {
    return !!votes.find(o => o.userId === localStorage.userId && o.vote === -1);
  };

  const handleThumbsUpClick = (plugin: RemotePlugin) => {
    const shouldAddVote = !votedThumbsUp(plugin.votes);
    setRemoteItems(plugins => {
      plugin.votes = plugin.votes.filter(o => o.userId !== localStorage.userId);
      if (shouldAddVote) {
        plugin.votes.push({
          id:     v4(),
          userId: localStorage.userId,
          vote:   1,
        });
        // pushing vote to backend
        const params = new URLSearchParams();
        params.append('vote', '1');
        axios.post(`https://plugins.sogebot.xyz/plugins/${plugin.id}/votes`, params, {
          headers: {
            'content-type': 'application/x-www-form-urlencoded', authorization: `Bearer ${localStorage.code}`,
          },
        });
      } else {
        // delete vote from backend
        axios.delete(`https://plugins.sogebot.xyz/plugins/${plugin.id}/votes`, { headers: { authorization: `Bearer ${localStorage.code}` } });
      }
      const updatePlugins = [...plugins];
      const idx = updatePlugins.findIndex(o => o.id === plugin.id);
      if (idx >= 0) {
        updatePlugins[idx] = plugin;
      }
      return [...updatePlugins];
    });
  };

  const handleThumbsDownClick = (plugin: RemotePlugin) => {
    const shouldAddVote = !votedThumbsDown(plugin.votes);
    setRemoteItems(plugins => {
      plugin.votes = plugin.votes.filter(o => o.userId !== localStorage.userId);
      if (shouldAddVote) {
        plugin.votes.push({
          id:     v4(),
          userId: localStorage.userId,
          vote:   -1,
        });
        // pushing vote to backend
        const params = new URLSearchParams();
        params.append('vote', '-1');
        axios.post(`https://plugins.sogebot.xyz/plugins/${plugin.id}/votes`, params, {
          headers: {
            'content-type': 'application/x-www-form-urlencoded', authorization: `Bearer ${localStorage.code}`,
          },
        });
      } else {
        // delete vote from backend
        axios.delete(`https://plugins.sogebot.xyz/plugins/${plugin.id}/votes`, { headers: { authorization: `Bearer ${localStorage.code}` } });
      }
      const updatePlugins = [...plugins];
      const idx = updatePlugins.findIndex(o => o.id === plugin.id);
      if (idx >= 0) {
        updatePlugins[idx] = plugin;
      }
      return [...updatePlugins];
    });
  };

  const importPlugin = useCallback((plugin: RemotePlugin) => {
    setImporting(val => [...val, plugin.id]);
    setRemoteItems(plugins => {
      const updatePlugins = [...plugins];
      const idx = updatePlugins.findIndex(o => o.id === plugin.id);
      if (idx >= 0) {
        updatePlugins[idx].importedCount += 1;
      }
      return [...updatePlugins];
    });

    axios.get(`https://plugins.sogebot.xyz/plugins/${plugin.id}`, {
      headers: {
        'content-type': 'application/json', authorization: `Bearer ${localStorage.code}`,
      },
    }).then(res => {
      const [ workflow, settings ] = res.data.plugin.split('%');

      const buf = Buffer.from(workflow, 'base64');
      let pluginSettings: any[] = [];

      if (settings) {
        console.log('Settings found, loading');
        pluginSettings = JSON.parse(Buffer.from(settings, 'base64').toString('utf-8'));
      } else {
        pluginSettings = [];
      }

      const toImport = {
        ...res.data,
        id:       shortid(),
        workflow: buf.toString('utf-8'),
        settings: pluginSettings,
        enabled:  false,
      };
      console.log({ toImport });
      getSocket('/core/plugins').emit('generic::save', toImport, (err) => {
        if (err) {
          console.error({ err });
          enqueueSnackbar(`Error during import of "${plugin.name}" version ${plugin.version}.`, { variant: 'error' } );
        } else {
          enqueueSnackbar(`Plugin "${plugin.name}" version ${plugin.version} was imported.`, { variant: 'success' } );
        }
        setImporting(val => [...val.filter(o => o !== plugin.id)]);
        refresh();
      });
    });
  }, [ enqueueSnackbar, refresh]);

  return (
    <>
      <Backdrop open={loading} >
        <CircularProgress color="inherit"/>
      </Backdrop>
      <Grid container sx={{ pb: 0.7 }} spacing={1} alignItems='center'>
        <Grid item>
          <Button variant="contained" href='/registry/plugins/create/'>Create new plugin</Button>
        </Grid>
        <Grid item>
          <Tooltip arrow title="Enable">
            <Button disabled={!bulkCanEnable} variant="contained" color="secondary" sx={{
              minWidth: '36px', width: '36px',
            }} onClick={() => bulkToggleAttribute('enabled', true)}><CheckBoxTwoTone/></Button>
          </Tooltip>
        </Grid>
        <Grid item>
          <Tooltip arrow title="Disable">
            <Button disabled={!bulkCanDisable} variant="contained" color="secondary" sx={{
              minWidth: '36px', width: '36px',
            }} onClick={() => bulkToggleAttribute('enabled', false)}><DisabledByDefaultTwoTone/></Button>
          </Tooltip>
        </Grid>
        <Grid item>
          <ButtonsDeleteBulk disabled={bulkCount === 0} onDelete={bulkDelete}/>
        </Grid>
        <Grid item>{filterElement}</Grid>
        <Grid item>
          {bulkCount > 0 && <Typography variant="button" px={2}>{ bulkCount } selected</Typography>}
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Typography variant='h2' gutterBottom>Local plugins</Typography>
          <Grid container spacing={1}>
            {items.map(o => <Grid item xs={12} key={o.id}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" variant='h6'>
                    {o.name}
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'space-between' }}>
                </CardActions>
              </Card>
            </Grid>)}
          </Grid>
        </Grid>
        <Grid item xs={6}>
          <Typography variant='h2' gutterBottom>Remote plugins</Typography>
          { filterElementRemotePlugin }
          <Grid container spacing={1}>
            {remoteItems.map(o => <Grid item xs={12} key={o.id}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" variant='h6'>
                    {o.name}
                    {' '}
                    <Chip variant='outlined' size='small' label={<strong>v{o.version}</strong>} color='primary'/>
                    {' '}
                    <Chip size='small' label={<strong>{o.compatibleWith}</strong>} color='warning'/>
                  </Typography>
                  <Typography color="text.secondary" variant="body2" gutterBottom>
                    { dayjs(o.publishedAt).format('LL LTS') }
                  </Typography>
                  <Typography variant="body2">
                    {o.description}
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'space-between' }}>
                  <Stack direction={'row'} alignItems='center' textAlign='left' spacing={0.5}>
                    <IconButton disabled={importing.includes(o.id)} onClick={() => importPlugin(o)}>
                      {importing.includes(o.id)
                        ? <CircularProgress size={24}/>
                        : <DownloadTwoTone/>
                      }
                    </IconButton>
                    <Typography component='span' variant='body2' sx={{ minWidth: 50 }}>{o.importedCount}</Typography>
                  </Stack>
                  <Stack direction={'row'} alignItems='center' textAlign='center' spacing={0.5}>
                    <IconButton sx={{
                      '&:hover':  { color: red[400] },
                      transition: 'all 200ms',
                      color:      votedThumbsDown(o.votes) ? red[400] : 'inherit',
                    }} onClick={() => handleThumbsDownClick(o)}>
                      {votedThumbsDown(o.votes)
                        ? <ThumbDown/>
                        : <ThumbDownTwoTone/>
                      }
                    </IconButton>
                    <Typography component='span' variant='body2' sx={{ minWidth: 50 }}>{calculateVotes(o.votes)}</Typography>
                    <IconButton sx={{
                      '&:hover':  { color: green[400] },
                      transition: 'all 200ms',
                      color:      votedThumbsUp(o.votes) ? green[400] : 'inherit',
                    }} onClick={() => handleThumbsUpClick(o)}>
                      {votedThumbsUp(o.votes)
                        ? <ThumbUp/>
                        : <ThumbUpTwoTone/>
                      }
                    </IconButton>
                  </Stack>
                </CardActions>
              </Card>
            </Grid>)}
          </Grid>
        </Grid>
      </Grid>
    </>
  );
};
export default PageRegistryPlugins;
