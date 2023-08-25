import {
  DownloadTwoTone, ExpandLessTwoTone, ExpandMoreTwoTone, ThumbDown,
  ThumbDownTwoTone, ThumbUp, ThumbUpTwoTone,
} from '@mui/icons-material';
import {
  Box,
  Button, Card, CardActions, CardContent, Chip, CircularProgress, Dialog , DialogActions, DialogContent, DialogTitle,
  FormControl,
  IconButton, InputLabel, LinearProgress, MenuItem, Pagination, Select, Stack, TextField, Tooltip, Typography,
} from '@mui/material';
import { green, red } from '@mui/material/colors';
import axios from 'axios';
import HTMLReactParser from 'html-react-parser';
import { chunk, orderBy } from 'lodash';
import React from 'react';
import { v4 } from 'uuid';

import { Plugin as RemotePlugin } from '../../../../services/plugins/export';
import { dayjs } from '../../helpers/dayjsHelper';

type Props = {
  onImport: (items: string) => void;
};

const endpoint = 'https://registry.sogebot.xyz';

export const ImportDialog: React.FC<Props> = ({ onImport }) => {
  const [ open, setOpen ] = React.useState(false);
  const [ page, setPage ] = React.useState(1);
  const [ order, setOrder ] = React.useState('votes');
  const [ orderAsc, setOrderAsc ] = React.useState(false);
  const [ search, setSearch ] = React.useState('');
  const [ loading, setLoading ] = React.useState(false);
  const [ importing, setImporting ] = React.useState<string[]>([]);

  const [ remotePlugins, setRemotePlugins ] = React.useState<null | RemotePlugin[]>(null);

  const [, startTransition] = React.useTransition();

  const filteredRemotePlugins = React.useMemo(() => {
    return orderBy(remotePlugins?.filter(o =>
      o.name.toLowerCase().includes(search.toLowerCase())
      || o.description.toLowerCase().includes(search.toLowerCase()),
    ), order, orderAsc ? 'asc' : 'desc') as RemotePlugin[];
  }, [search, remotePlugins, order, orderAsc]);
  const pagedRemotePlugins = React.useMemo(() => {
    return chunk(filteredRemotePlugins, 5)[page - 1];
  }, [page, filteredRemotePlugins]);

  React.useEffect(() => {
    setPage(1);
  }, [filteredRemotePlugins]);

  React.useEffect(() => {
    if (open) {
      startTransition(() => {
        setPage(1);
        setSearch('');
        setOrder('votes');
        setOrderAsc(false);
        setLoading(true);
      });
      axios.get<RemotePlugin[]>(endpoint + '/plugins', { headers: { authorization: `Bearer ${localStorage.code}` } })
        .then(res => setRemotePlugins(res.data))
        .finally(() => setLoading(false));
    }
  }, [ open ]);

  const importOverlay = (value: RemotePlugin) => {
    console.log('Importing', value);
    setImporting(val => [...val, value.id]);
    setRemotePlugins(o => {
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

    axios.get<RemotePlugin>(`${endpoint}/plugins/${value.id}`, {
      headers: {
        'content-type': 'application/json', authorization: `Bearer ${localStorage.code}`,
      },
    }).then(async ({ data }) => {
      const files = Buffer.from(data.plugin, 'base64').toString('utf-8');
      onImport(files);
    }).finally(() => {
      setImporting(val => val.filter(o => o !== value.id));
    });
  };

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
    setRemotePlugins(plugins => {
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
        axios.post(`${endpoint}/plugins/${plugin.id}/votes`, params, {
          headers: {
            'content-type': 'application/x-www-form-urlencoded', authorization: `Bearer ${localStorage.code}`,
          },
        });
      } else {
        // delete vote from backend
        axios.delete(`${endpoint}/plugins/${plugin.id}/votes`, { headers: { authorization: `Bearer ${localStorage.code}` } });
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
    setRemotePlugins(plugins => {
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
        axios.post(`${endpoint}/plugins/${plugin.id}/votes`, params, {
          headers: {
            'content-type': 'application/x-www-form-urlencoded', authorization: `Bearer ${localStorage.code}`,
          },
        });
      } else {
        // delete vote from backend
        axios.delete(`${endpoint}/plugins/${plugin.id}/votes`, { headers: { authorization: `Bearer ${localStorage.code}` } });
      }
      const updatePlugins = [...plugins];
      const idx = updatePlugins.findIndex(o => o.id === plugin.id);
      if (idx >= 0) {
        updatePlugins[idx] = plugin;
      }
      return [...updatePlugins];
    });
  };

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
      Import Plugin
      </DialogTitle>
      <DialogContent>
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
        { pagedRemotePlugins?.map(o => <Card sx={{ my: 0.25 }} key={o.id}>
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
      </DialogContent>
      <DialogActions>
        <Box sx={{
          flexGrow: 1, justifyContent: 'center', display: 'flex',
        }}>
          <Pagination count={Math.ceil((filteredRemotePlugins ?? []).length / 5) || 1} page={page} onChange={(_ev, val) => setPage(val)}/>
        </Box>
        <Button onClick={() => setOpen(false)}>Close</Button>
      </DialogActions>
    </Dialog>
  </>;
};