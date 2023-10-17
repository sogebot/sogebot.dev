import {
  DownloadTwoTone, ExpandLessTwoTone, ExpandMoreTwoTone, ThumbDown,
  ThumbDownTwoTone, ThumbUp, ThumbUpTwoTone,
} from '@mui/icons-material';
import {
  Box, Button,
  ButtonGroup, Card, CardActions, CardContent, Chip, CircularProgress, Dialog , DialogActions, DialogContent, DialogTitle,
  FormControl,
  IconButton, InputLabel, LinearProgress, MenuItem, Pagination, Select, Stack, TextField, Tooltip, Typography,
} from '@mui/material';
import { green, red } from '@mui/material/colors';
import { Overlay } from '@sogebot/backend/src/database/entity/overlay';
import axios from 'axios';
import HTMLReactParser from 'html-react-parser';
import { atom, useAtomValue } from 'jotai';
import { chunk, orderBy } from 'lodash';
import React from 'react';
import { useLocalstorageState } from 'rooks';
import shortid from 'shortid';
import { v4 } from 'uuid';

import { Overlay as RemoteOverlay } from '../../../../services/plugins/export';
import { dayjs } from '../../helpers/dayjsHelper';
import { getSocket } from '../../helpers/socket';

type Props = {
  onImport: (items: Overlay['items']) => void;
};

const endpoint = 'https://registry.sogebot.xyz';

const fetchLocalOverlays = async () => {
  return new Promise<Overlay[]>((resolve, reject) => {
    getSocket('/registries/overlays', true).emit('generic::getAll', (err, result) => {
      if (err) {
        console.error(err);
        reject(err);
      }
      resolve(result);
    });
  });
};
const overlaysAtom = atom(fetchLocalOverlays());

export const ImportDialog: React.FC<Props> = ({ onImport }) => {
  const [ open, setOpen ] = React.useState(false);
  const [ page, setPage ] = React.useState(1);
  const [ order, setOrder ] = React.useState('votes');
  const [ orderAsc, setOrderAsc ] = React.useState(false);
  const [ search, setSearch ] = React.useState('');
  const [ loading, setLoading ] = React.useState(false);
  const [ importing, setImporting ] = React.useState<string[]>([]);
  const [ server ] = useLocalstorageState('server', 'https://demobot.sogebot.xyz');

  const [ remoteOverlays, setRemoteOverlays ] = React.useState<null | RemoteOverlay[]>(null);
  const localOverlays = useAtomValue(overlaysAtom);

  const [, startTransition] = React.useTransition();

  const filteredRemoteOverlays = React.useMemo(() => {
    return orderBy(remoteOverlays?.filter(o =>
      o.name.toLowerCase().includes(search.toLowerCase())
      || o.description.toLowerCase().includes(search.toLowerCase()),
    ), order, orderAsc ? 'asc' : 'desc') as RemoteOverlay[];
  }, [search, remoteOverlays, order, orderAsc]);
  const pagedRemoteOverlays = React.useMemo(() => {
    return chunk(filteredRemoteOverlays, 5)[page - 1];
  }, [page, filteredRemoteOverlays]);

  React.useEffect(() => {
    setPage(1);
  }, [filteredRemoteOverlays]);

  React.useEffect(() => {
    if (open) {
      startTransition(() => {
        setPage(1);
        setSearch('');
        setOrder('votes');
        setOrderAsc(false);
        setLoading(true);
      });
      axios.get<RemoteOverlay[]>(endpoint + '/overlays', { headers: { authorization: `Bearer ${localStorage.code}` } })
        .then(res => setRemoteOverlays(res.data))
        .finally(() => setLoading(false));
    }
  }, [ open ]);

  const importLocalOverlay = (value: Overlay['items'][number]) => {
    console.log({ value });
    onImport([ value ]);
  };

  const importOverlay = (value: RemoteOverlay) => {
    console.log('Importing', value);
    setImporting(val => [...val, value.id]);
    setRemoteOverlays(o => {
      if (!o) {
        return null;
      }
      const update = [...o];
      const idx = update.findIndex(v => v.id === value.id);
      if (idx >= 0) {
        update[idx].importedCount += 1;
      }
      return [...update];
    });

    axios.get<RemoteOverlay>(`${endpoint}/overlays/${value.id}`, {
      headers: {
        'content-type': 'application/json', authorization: `Bearer ${localStorage.code}`,
      },
    }).then(async ({ data }) => {
      const gallery = JSON.parse(data.data);
      const items = JSON.parse(data.items);

      const i = 0;
      for (const [key, item] of Object.entries(gallery)) {
        console.log('Uploading gallery item', key);
        const chunkSize = 512 * 1024;
        const id = shortid();
        for (const b64dataArr of chunk(String(item), chunkSize)) {
          const b64data = b64dataArr.join('');
          await new Promise((resolve) => {
            getSocket('/overlays/gallery').emit('gallery::upload', [
              `${data.name} #${i}`,
              {
                folder: '/overlays', b64data, id,
              }], resolve);
          });
        }
        for (const it of items) {
          if (it.opts.typeId === 'html') {
            it.opts.html = it.opts.html.replaceAll(key, `${server}/gallery/${id}`);
            it.opts.css = it.opts.css.replaceAll(key, `${server}/gallery/${id}`);
            it.opts.javascript = it.opts.javascript.replaceAll(key, `${server}/gallery/${id}`);
          }
        }
      }

      onImport(items);
    }).finally(() => {
      setImporting(val => val.filter(o => o !== value.id));
    });
  };

  const calculateVotes = (votes: RemoteOverlay['votes']) => {
    return votes.reduce((prev, cur) => prev + cur.vote, 0);
  };

  const votedThumbsUp = (votes: RemoteOverlay['votes']) => {
    return !!votes.find(o => o.userId === localStorage.userId && o.vote === 1);
  };

  const votedThumbsDown = (votes: RemoteOverlay['votes']) => {
    return !!votes.find(o => o.userId === localStorage.userId && o.vote === -1);
  };

  const handleThumbsUpClick = (plugin: RemoteOverlay) => {
    const shouldAddVote = !votedThumbsUp(plugin.votes);
    setRemoteOverlays(plugins => {
      if (!plugins) {
        return null;
      }
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
        axios.post(`${endpoint}/overlays/${plugin.id}/votes`, params, {
          headers: {
            'content-type': 'application/x-www-form-urlencoded', authorization: `Bearer ${localStorage.code}`,
          },
        });
      } else {
        // delete vote from backend
        axios.delete(`${endpoint}/overlays/${plugin.id}/votes`, { headers: { authorization: `Bearer ${localStorage.code}` } });
      }
      const updatePlugins = [...plugins];
      const idx = updatePlugins.findIndex(o => o.id === plugin.id);
      if (idx >= 0) {
        updatePlugins[idx] = plugin;
      }
      return [...updatePlugins];
    });
  };

  const handleThumbsDownClick = (plugin: RemoteOverlay) => {
    const shouldAddVote = !votedThumbsDown(plugin.votes);
    setRemoteOverlays(plugins => {
      if (!plugins) {
        return null;
      }
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
        axios.post(`${endpoint}/overlays/${plugin.id}/votes`, params, {
          headers: {
            'content-type': 'application/x-www-form-urlencoded', authorization: `Bearer ${localStorage.code}`,
          },
        });
      } else {
        // delete vote from backend
        axios.delete(`${endpoint}/overlays/${plugin.id}/votes`, { headers: { authorization: `Bearer ${localStorage.code}` } });
      }
      const updatePlugins = [...plugins];
      const idx = updatePlugins.findIndex(o => o.id === plugin.id);
      if (idx >= 0) {
        updatePlugins[idx] = plugin;
      }
      return [...updatePlugins];
    });
  };

  const [ type, setType ] = React.useState('remote');

  return <>
    <Tooltip title="Import">
      <IconButton onClick={() => setOpen(true)}><DownloadTwoTone/></IconButton>
    </Tooltip>
    <Dialog
      open={open}
      onClose={() => setOpen(false)}
      maxWidth='md'
      fullWidth
      PaperProps={{ sx: { height: '100% !important' } }}
    >
      {loading && <LinearProgress />}
      <DialogTitle>
      Import Overlay
      </DialogTitle>
      <DialogContent>
        <ButtonGroup sx={{ pb: 1 }}>
          <Button fullWidth variant={type === 'remote' ? 'contained' : undefined} color='light' onClick={() => setType('remote')}>Remote</Button>
          <Button fullWidth variant={type === 'local' ? 'contained' : undefined} color='light' onClick={() => setType('local')}>Local</Button>
        </ButtonGroup>
        {type === 'remote' && <>
          <Stack direction='row' spacing={0.5}>
            <Box sx={{ flexGrow: 1 }}>
              <TextField label="Search" fullWidth onChange={(ev) => setSearch(ev.currentTarget.value ?? '')}/>
            </Box>
            <FormControl>
              <InputLabel id="type-select-label">Order</InputLabel>
              <Select
                label="Order"
                labelId="type-select-label"
                value={order}
                onChange={(ev) => setOrder(ev.target.value)}
              >
                <MenuItem value='votes'>Votes</MenuItem>
                <MenuItem value='publishedAt'>Creation date</MenuItem>
                <MenuItem value='importedCount'>Downloads</MenuItem>
              </Select>
            </FormControl>
            <Box>
              <Button variant='contained' color='dark' sx={{ height: '100%' }} onClick={() => setOrderAsc(!orderAsc)}>
                {!orderAsc ? <ExpandMoreTwoTone/> : <ExpandLessTwoTone/>}
              </Button>
            </Box>
          </Stack>
          { pagedRemoteOverlays?.map(o => <Card sx={{ my: 0.25 }} key={o.id}>
            <CardContent sx={{ pb: 0 }}>
              <Typography color="text.secondary" variant='h6' sx={{ pb: 1 }}>
                {o.name}
              </Typography>
              <Typography variant="body2">
                {HTMLReactParser(o.description.replace(/\n/g, '<br/>'))}
              </Typography>
            </CardContent>
            <CardActions>
              <Stack direction='row' spacing={1} alignItems='center'>
                <Stack direction={'row'} alignItems='center' textAlign='left' spacing={0.5}>
                  <IconButton disabled={importing.includes(o.id)} onClick={() => importOverlay(o)}>
                    {importing.includes(o.id)
                      ? <CircularProgress size={24}/>
                      : <DownloadTwoTone/>
                    }
                  </IconButton>
                  <Typography component='span' variant='body2' sx={{ minWidth: 50 }}>{o.importedCount}</Typography>
                </Stack>

                <Chip size='small' label={`v${o.version}`}/>
                <Chip size='small' label={<strong>{o.compatibleWith}</strong>} color='warning'/>
                <Chip size='small' variant='outlined' label={dayjs(o.publishedAt).format('LL LTS')}/>

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
              </Stack>
            </CardActions>
          </Card>)}
        </>}
        {type === 'local' && <>
          { localOverlays.map(o => <Card sx={{ my: 0.25 }} key={o.id}>
            <CardContent sx={{ pb: 0 }}>
              <Typography color="text.secondary" variant='h6' sx={{ pb: 1 }}>
                {o.name} <Typography component='span' variant='caption'>{o.id}</Typography>
              </Typography>

              {o.items.map((item, idx) => <Box key={idx} sx={{
                p:         0.3,
                px:        1,
                '&:hover': { backgroundColor: 'rgba(130,130,130,0.1)' },
              }}>
                <Stack direction='row' sx={{
                  alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <Typography variant="body2" component='div'>
                    {item.name}{' '}
                    <Typography component='span' variant='caption'>
                      {item.opts.typeId}
                    </Typography>
                  </Typography>
                  <IconButton disabled={importing.includes(o.id)} onClick={() => importLocalOverlay(item)}>
                    <DownloadTwoTone/>
                  </IconButton>
                </Stack>
              </Box>)}
            </CardContent>
          </Card>)}
        </>}
      </DialogContent>
      <DialogActions>
        {type === 'remote' && <Box sx={{
          flexGrow: 1, justifyContent: 'center', display: 'flex',
        }}>
          <Pagination count={Math.ceil((filteredRemoteOverlays ?? []).length / 5) || 1} page={page} onChange={(_ev, val) => setPage(val)}/>
        </Box>}
        <Button onClick={() => setOpen(false)}>Close</Button>
      </DialogActions>
    </Dialog>
  </>;
};