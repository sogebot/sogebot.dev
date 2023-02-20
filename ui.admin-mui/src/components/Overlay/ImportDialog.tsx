import {
  DownloadTwoTone, ThumbDown, ThumbDownTwoTone, ThumbUp, ThumbUpTwoTone,
} from '@mui/icons-material';
import {
  Button, Card, CardActions, CardContent, Chip, CircularProgress, Dialog , DialogActions, DialogContent, DialogTitle,
  IconButton, LinearProgress, Stack, TextField, Tooltip, Typography,
} from '@mui/material';
import { green, red } from '@mui/material/colors';
import { Overlay } from '@sogebot/backend/src/database/entity/overlay';
import axios from 'axios';
import HTMLReactParser from 'html-react-parser';
import React from 'react';
import { useSessionstorageState } from 'rooks';
import shortid from 'shortid';
import { v4 } from 'uuid';

import { Overlay as RemoteOverlay } from '../../../../services/plugins/export';
import { dayjs } from '../../helpers/dayjsHelper';
import { getSocket } from '../../helpers/socket';

type Props = {
  onImport: (items: Overlay['items']) => void;
};

const endpoint = 'https://registry.sogebot.xyz';

export const ImportDialog: React.FC<Props> = ({ onImport }) => {
  const [ open, setOpen ] = React.useState(false);
  const [ loading, setLoading ] = React.useState(false);
  const [ importing, setImporting ] = React.useState<string[]>([]);
  const [ server ] = useSessionstorageState('server', 'https://demobot.sogebot.xyz');

  const [ remoteOverlays, setRemoteOverlays ] = React.useState<null | RemoteOverlay[]>(null);

  React.useEffect(() => {
    if (open) {
      setLoading(true);
      axios.get<RemoteOverlay[]>(endpoint + '/overlays', { headers: { authorization: `Bearer ${localStorage.code}` } })
        .then(res => setRemoteOverlays(res.data))
        .finally(() => setLoading(false));
    }
  }, [ open ]);

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
        const imageId = shortid();
        console.log({
          id:      imageId,
          folder:  '/overlays',
          b64data: String(item),
        });
        await new Promise((resolve) => {
          getSocket('/overlays/gallery').emit('gallery::upload', [
            `${data.name} #${i}`,
            {
              id:      imageId,
              folder:  '/overlays',
              b64data: String(item),
            }], resolve);
        });

        for (const it of items) {
          if (it.opts.typeId === 'html') {
            it.opts.html = it.opts.html.replaceAll(key, `${server}/gallery/${imageId}`);
            it.opts.css = it.opts.css.replaceAll(key, `${server}/gallery/${imageId}`);
            it.opts.javascript = it.opts.javascript.replaceAll(key, `${server}/gallery/${imageId}`);
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

  return <>
    <Tooltip title="Import">
      <IconButton onClick={() => setOpen(true)}><DownloadTwoTone/></IconButton>
    </Tooltip>
    <Dialog
      open={open}
      onClose={() => setOpen(false)}
      maxWidth='sm'
      fullWidth
      PaperProps={{ sx: { height: '100% !important' } }}
    >
      {loading && <LinearProgress />}
      <DialogTitle>
      Import Overlay
      </DialogTitle>
      <DialogContent>
        <TextField label="Search (TBD)" fullWidth/>
        { remoteOverlays?.map(o => <Card sx={{ my: 0.25 }} key={o.id}>
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
        <Button onClick={() => setOpen(false)}>Close</Button>
      </DialogActions>
    </Dialog>
  </>;
};