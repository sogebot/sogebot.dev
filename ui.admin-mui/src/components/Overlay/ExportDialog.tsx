import { ShareTwoTone } from '@mui/icons-material';
import { LoadingButton, TabContext, TabList, TabPanel } from '@mui/lab';
import { Alert, Autocomplete, Box, Button, Checkbox, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, FormGroup, FormLabel, IconButton, LinearProgress, Popover, Stack, Tab, TextField, Tooltip, Typography } from '@mui/material';
import { HTML } from '@sogebot/backend/dest/database/entity/overlay';
import { GalleryInterface } from '@sogebot/backend/src/database/entity/gallery';
import { Overlay } from '@sogebot/backend/src/database/entity/overlay';
import match from 'autosuggest-highlight/match';
import parse from 'autosuggest-highlight/parse';
import axios from 'axios';
import { IsNotEmpty, MinLength } from 'class-validator';
import { nanoid } from 'nanoid';
import { useSnackbar } from 'notistack';
import React from 'react';
import { useLocalstorageState } from 'rooks';

import type { Overlay as RemoteOverlay } from '../../../../services/plugins/export';
import { dayjs } from '../../helpers/dayjsHelper';
import { getSocket } from '../../helpers/socket';
import { useAppSelector } from '../../hooks/useAppDispatch';
import { useValidator } from '../../hooks/useValidator';
import theme from '../../theme';

type Props = {
  model: Overlay
};

class RemoteOverlayValidator {
  @IsNotEmpty()
  @MinLength(2)
    name: string;

  @MinLength(2)
  @IsNotEmpty()
    description: string;
}

const endpoint = 'https://registry.sogebot.xyz';

export const ExportDialog: React.FC<Props> = ({ model }) => {
  const { currentVersion } = useAppSelector(s => s.loader);
  const { enqueueSnackbar } = useSnackbar();
  const [ server ] = useLocalstorageState('server', 'https://demobot.sogebot.xyz');

  const [ loading, setLoading ] = React.useState(false);
  const [ saving, setSaving ] = React.useState(false);
  const [ open, setOpen ] = React.useState(false);

  const [ tab, setTab ] = React.useState('new');
  const [ name, setName ] = React.useState(model.name);
  const [ description, setDescription ] = React.useState('');
  const [ itemsToExport, setItemsToExport ] = React.useState<typeof model.items>(model.items);

  const [ remoteOverlay, setRemoteOverlay ] = React.useState<undefined | RemoteOverlay>(undefined);
  const [ remoteOverlays, setRemoteOverlays ] = React.useState<null | RemoteOverlay[]>(null);

  const { reset, haveErrors, validate, propsError } = useValidator();

  const getUserId = () => {
    return JSON.parse(localStorage['cached-logged-user']).id;
  };

  React.useEffect(() => {
    setItemsToExport(model.items);
  }, [model.items]);

  React.useEffect(() => {
    validate(RemoteOverlayValidator, {
      name, description,
    });
  }, [name, description]);

  React.useEffect(() => {
    reset();
    if (tab === 'update' || tab === 'remove' || open) {
      axios.get<RemoteOverlay[]>(endpoint + '/overlays', { headers: { authorization: `Bearer ${localStorage.code}` } }).then(res => setRemoteOverlays(res.data.filter(o => o.publisherId === getUserId())));
    } else {
      setRemoteOverlay(undefined);
    }
  }, [ tab, open ]);

  const [ gallery, setGallery ] = React.useState<string[]>([]);

  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const handlePopoverOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
  };

  React.useEffect(() => {
    setGallery([]);
    setLoading(true);

    new Promise<GalleryInterface[]>((resolve, reject) => getSocket('/overlays/gallery').emit('generic::getAll', (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    })).then((galleryItems) => {
      if (open) {
        // go through items and process all gallery, currently we can have gallery items only in html
        for (const item of itemsToExport.filter(o => o.opts.typeId === 'html')) {
          for (const gItem of galleryItems) {
            const url = `${server}/gallery/${gItem.id}`;
            const opts = (item.opts as HTML);
            if (opts.html.includes(url) || opts.javascript.includes(url) || opts.css.includes(url)) {
              setGallery(o => [...o, url]);
            }
          }
        }
      }
      setLoading(false);
    });
  }, [open, server, itemsToExport]);

  const remove = React.useCallback(async () => {
    if (remoteOverlay) {
      await axios.delete(endpoint + '/overlays/' + remoteOverlay.id, {
        headers: {
          authorization: `Bearer ${localStorage.code}`, 'Content-Type': 'application/json',
        },
      });
      axios.get<RemoteOverlay[]>(endpoint + '/overlays', { headers: { authorization: `Bearer ${localStorage.code}` } }).then(res => setRemoteOverlays(res.data.filter(o => o.publisherId === getUserId())));
      enqueueSnackbar('Remote overlay was DELETED from registry server.');
      setRemoteOverlay(undefined);
    }
  }, [enqueueSnackbar, remoteOverlay]);

  const save = React.useCallback(async () => {
    const toSave = {
      name,
      description,
      items:          itemsToExport,
      data:           {},
      compatibleWith: (currentVersion ?? '').split('-')[0],
    } as {
      name:           string;
      description:    string,
      items:          typeof model.items,
      data:           Record<string, string>
      compatibleWith: string,
    };

    const isValid = await validate(RemoteOverlayValidator, toSave, true);
    if (!isValid) {
      return;
    }

    setSaving(true);

    // load images
    const obfuscateItemServer = nanoid();
    for (const item of gallery) {
      const response = await axios.get(item, { responseType: 'arraybuffer' });
      toSave.data[item.replace(server, obfuscateItemServer)] = `data:${response.headers['content-type'].toLowerCase()};base64,${Buffer.from(response.data, 'binary').toString('base64')}`;
    }

    // obfuscate current server
    for (const item of toSave.items) {
      if (item.opts.typeId === 'html') {
        item.opts.html = item.opts.html.replaceAll(server, obfuscateItemServer);
        item.opts.css = item.opts.css.replaceAll(server, obfuscateItemServer);
        item.opts.javascript = item.opts.javascript.replaceAll(server, obfuscateItemServer);
      }
    }

    try {
      if (tab === 'new') {
        await axios.post(endpoint + '/overlays', {
          ...toSave,
          items: JSON.stringify(toSave.items),
          data:  JSON.stringify(toSave.data),
        }, {
          headers: {
            authorization: `Bearer ${localStorage.code}`, 'Content-Type': 'application/json',
          },
        });
        enqueueSnackbar('New remote overlay was created on registry server.');
      } else {
        if (remoteOverlay) {
          await axios.put(endpoint + '/overlays/' + remoteOverlay.id, {
            ...toSave,
            items: JSON.stringify(toSave.items),
            data:  JSON.stringify(toSave.data),
          }, {
            headers: {
              authorization: `Bearer ${localStorage.code}`, 'Content-Type': 'application/json',
            },
          });
          enqueueSnackbar('Remote overlay was updated on registry server.');
        }
      }
      setOpen(false);
    } catch (e) {
      console.error(e);
    }
    setSaving(false);

  }, [name, description, itemsToExport, gallery, enqueueSnackbar]);

  return <>
    <Tooltip title="Export & Manage remote overlays">
      <IconButton onClick={() => setOpen(true)}><ShareTwoTone/></IconButton>
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
      Export Overlay
      </DialogTitle>
      <DialogContent>
        <TabContext value={tab}>
          <Box sx={{
            borderBottom: 1, borderColor: 'divider',
          }}>
            <TabList onChange={(ev, newValue) => setTab(newValue)}>
              <Tab label="New overlay" value="new" />
              <Tab label="Update existing overlay" value="update" />
              <Tab label="Remove existing overlay" value="remove" />
            </TabList>
          </Box>
          <TabPanel value="update">
            <Autocomplete
              value={remoteOverlay}
              disableClearable
              onChange={(ev, value) => {
                setRemoteOverlay(value);
                setName(value.name);
                setDescription(value.description);
              }}
              disablePortal
              id="overlay.update.selector"
              options={remoteOverlays ?? []}
              filterOptions={(options, state) => {
                if (state.inputValue.trim().length === 0) {
                  return options;
                }
                return options.filter(o => o.name.toLowerCase().includes(state.inputValue.toLowerCase()) || o.description.toLowerCase().includes(state.inputValue.toLowerCase()));
              }}
              getOptionLabel={(option) => option.name}
              renderInput={(params) => <TextField {...params} label="Overlay" />}
              renderOption={(p, option, { inputValue }) => {
                const matches = match(option.name, inputValue, { insideWords: true });
                const parts = parse(option.name, matches);

                const matches2 = match(option.description, inputValue, { insideWords: true });
                const parts2 = parse(option.description, matches2);

                return (
                  <li {...p}>
                    <Stack spacing={0.1}>
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
                      {option.description.trim().length > 0 && <Typography variant={'body2'}>
                        {parts2.map((part, index) => (
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
                      </Typography>}
                      <Stack direction='row' spacing={2}>
                        <Chip size='small' label={<Typography variant='caption'>v{option.version}</Typography>}/>
                        <Typography variant='caption' sx={{ transform: 'translateY(3px)' }}>{dayjs(option.publishedAt).format('LL LTS')}</Typography>
                      </Stack>
                    </Stack>
                  </li>
                );
              }}
            />
            { !remoteOverlays && <LinearProgress/> }
          </TabPanel>
          <TabPanel value="remove">
            <Autocomplete
              value={remoteOverlay}
              disableClearable
              onChange={(ev, value) => {
                setRemoteOverlay(value);
                setName(value.name);
                setDescription(value.description);
              }}
              disablePortal
              id="overlay.update.selector"
              options={remoteOverlays ?? []}
              filterOptions={(options, state) => {
                if (state.inputValue.trim().length === 0) {
                  return options;
                }
                return options.filter(o => o.name.toLowerCase().includes(state.inputValue.toLowerCase()) || o.description.toLowerCase().includes(state.inputValue.toLowerCase()));
              }}
              getOptionLabel={(option) => option.name}
              renderInput={(params) => <TextField {...params} label="Overlay" />}
              renderOption={(p, option, { inputValue }) => {
                const matches = match(option.name, inputValue, { insideWords: true });
                const parts = parse(option.name, matches);

                const matches2 = match(option.description, inputValue, { insideWords: true });
                const parts2 = parse(option.description, matches2);

                return (
                  <li {...p}>
                    <Stack spacing={0.1}>
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
                      {option.description.trim().length > 0 && <Typography variant={'body2'}>
                        {parts2.map((part, index) => (
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
                      </Typography>}
                      <Stack direction='row' spacing={2}>
                        <Chip size='small' label={<Typography variant='caption'>v{option.version}</Typography>}/>
                        <Typography variant='caption' sx={{ transform: 'translateY(3px)' }}>{dayjs(option.publishedAt).format('LL LTS')}</Typography>
                      </Stack>
                    </Stack>
                  </li>
                );
              }}
            />
            { !remoteOverlays && <LinearProgress/> }
          </TabPanel>
        </TabContext>

        { tab !== 'remove' && <>
          <Stack spacing={0.5} sx={{
            pt: tab ==='new' ? 3 : 0, px: 3,
          }}>
            <TextField
              label="Name"
              fullWidth
              required
              value={name}
              onChange={(ev) => setName(ev.currentTarget.value)}
              {...propsError('name')}
            />
            <TextField
              label="Description"
              multiline
              fullWidth
              value={description}
              onChange={(ev) => setDescription(ev.currentTarget.value)}
              required
              {...propsError('description')}
            />
          </Stack>

          <Box sx={{ pt: 2 }}>
            <FormLabel>Export layers</FormLabel>
            <FormGroup>
              { model.items.map(o =>  <FormControlLabel
                key={o.id}
                onChange={(_ev, checked) => {
                  if (!checked) {
                    setItemsToExport(it => it.filter(x => x.id !== o.id));
                  } else {
                  // we need to add items in correct order (redoing from model.items)
                    setItemsToExport([...model.items.filter(m => itemsToExport.map(i => i.id).includes(m.id) || m.id === o.id)]);
                  }
                }}
                control={<Checkbox checked={!!itemsToExport.find(it => it.id === o.id)} />}
                label={<Typography>
                  {o.name && o.name.length > 0
                    ? <>
                      {o.name} <br/><small>{o.opts.typeId}</small>
                    </>
                    : o.opts.typeId}</Typography>} /> )}
            </FormGroup>
          </Box>

          <Box sx={{ pt: 2 }}>
            <FormLabel>Export gallery</FormLabel>
            {anchorEl?.dataset.url && <Popover
              id="mouse-over-popover"
              sx={{ pointerEvents: 'none' }}
              open={true}
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical:   'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical:   'bottom',
                horizontal: 'right',
              }}
              onClose={handlePopoverClose}
              disableRestoreFocus
            >
              <img src={anchorEl.dataset.url} style={{ maxWidth: '100px' }}/>
            </Popover>}
            <FormGroup>
              { gallery.map((o, idx) =>
                <Typography
                  sx={{ py: 1 }}
                  key={idx}
                  onMouseEnter={handlePopoverOpen}
                  onMouseLeave={handlePopoverClose}
                  data-url={o}
                >{o}</Typography>)}
            </FormGroup>

            <Alert sx={{ mt: 1 }} severity='info'>If export layer contains gallery items, they are added automatically into export.</Alert>
          </Box>
        </>}
      </DialogContent>
      <DialogActions>
        <LoadingButton onClick={() => tab === 'remove' ? remove() : save()} disabled={loading || ((tab === 'update' || tab === 'remove') && !remoteOverlay) || haveErrors} loading={saving}>
          { tab  === 'remove' ? 'Remove from remote' : 'Save on remote' }
        </LoadingButton>
        <Button onClick={() => setOpen(false)}>Close</Button>
      </DialogActions>
    </Dialog>
  </>;
};