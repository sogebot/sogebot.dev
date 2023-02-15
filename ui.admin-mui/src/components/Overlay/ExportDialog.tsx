import { PublishTwoTone } from '@mui/icons-material';
import {
  LoadingButton,
  TabContext, TabList, TabPanel,
} from '@mui/lab';
import {
  Alert,
  Box, Button, Checkbox, Dialog , DialogActions, DialogContent, DialogTitle, FormControlLabel, FormGroup,
  FormLabel, IconButton, LinearProgress, Popover, Stack, Tab, TextField, Tooltip, Typography,
} from '@mui/material';
import { HTML } from '@sogebot/backend/dest/database/entity/overlay';
import { GalleryInterface } from '@sogebot/backend/src/database/entity/gallery';
import { Overlay } from '@sogebot/backend/src/database/entity/overlay';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import React from 'react';
import { useSelector } from 'react-redux';
import { useSessionstorageState } from 'rooks';

import { getSocket } from '../../helpers/socket';

type Props = {
  model: Overlay
};

export const ExportDialog: React.FC<Props> = ({ model }) => {
  const { currentVersion } = useSelector((s: any) => s.loader);
  const { enqueueSnackbar } = useSnackbar();
  const [ server ] = useSessionstorageState('server', 'https://demobot.sogebot.xyz');
  const [ loading, setLoading ] = React.useState(false);
  const [ saving, setSaving ] = React.useState(false);
  const [ open, setOpen ] = React.useState(false);
  const [ tab, setTab ] = React.useState('new');
  const [ name, setName ] = React.useState(model.name);
  const [ description, setDescription ] = React.useState('');
  const [ itemsToExport, setItemsToExport ] = React.useState<typeof model.items>(model.items);

  React.useEffect(() => {
    setItemsToExport(model.items);
  }, [model.items]);

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

  const save = React.useCallback(async () => {
    setSaving(true);
    const toSave = {
      name,
      description,
      items:          itemsToExport,
      data:           {},
      compatibleWith: currentVersion.split('-')[0],
    } as {
      name: string;
      description: string,
      items: typeof model.items,
      data: Record<string, string>
      compatibleWith: string,
    };

    // load images
    for (const item of gallery) {
      const image = await axios.get(item, { responseType: 'arraybuffer' });
      toSave.data[item] = Buffer.from(image.data, 'binary').toString('base64');
    }

    console.log({ toSave });
    try {
      await axios.post('http://localhost:3000/overlays', {
        ...toSave,
        items: JSON.stringify(toSave.items),
        data:  JSON.stringify(toSave.data),
      }, {
        headers: {
          authorization: `Bearer ${localStorage.code}`, 'Content-Type': 'application/json',
        },
      });
      enqueueSnackbar('New remote overlay was created on registry server.');
      setOpen(false);
    } catch (e) {
      console.error(e);
    }
    setSaving(false);

  }, [name, description, itemsToExport, gallery, enqueueSnackbar]);

  React.useEffect(() => {
    setName(model.name);
  }, [ model.name ]);

  return <>
    <Tooltip title="Export">
      <IconButton onClick={() => setOpen(true)}><PublishTwoTone/></IconButton>
    </Tooltip>
    <Dialog
      open={open}
      onClose={() => setOpen(false)}
      maxWidth='sm'
      fullWidth
      style={{ pointerEvents: 'none' }}
      PaperProps={{ style: { pointerEvents: 'auto' } }}
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
            </TabList>
          </Box>
          <TabPanel value="new"><Stack spacing={0.5}>
            <TextField label="Name" fullWidth value={name} onChange={(ev) => setName(ev.currentTarget.value)}/>
            <TextField label="Description" multiline fullWidth value={description} onChange={(ev) => setDescription(ev.currentTarget.value)}/>
          </Stack></TabPanel>
          <TabPanel value="update">Item Two</TabPanel>
        </TabContext>

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
      </DialogContent>
      <DialogActions>
        <LoadingButton onClick={save} disabled={loading} loading={saving}>Save on remote</LoadingButton>
        <Button onClick={() => setOpen(false)}>Close</Button>
      </DialogActions>
    </Dialog>
  </>;
};