import { PublishTwoTone } from '@mui/icons-material';
import {
  TabContext, TabList, TabPanel,
} from '@mui/lab';
import {
  Box, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel,
  FormGroup, FormLabel, IconButton, Stack, Tab, TextField, Tooltip, Typography,
} from '@mui/material';
import { HTML } from '@sogebot/backend/dest/database/entity/overlay';
import { GalleryInterface } from '@sogebot/backend/src/database/entity/gallery';
import { Overlay } from '@sogebot/backend/src/database/entity/overlay';
import React from 'react';
import { useSessionstorageState } from 'rooks';

import { getSocket } from '../../helpers/socket';

type Props = {
  model: Overlay
};

export const ExportDialog: React.FC<Props> = ({ model }) => {
  const [ server ] = useSessionstorageState('server', 'https://demobot.sogebot.xyz');
  const [ open, setOpen ] = React.useState(false);
  const [ tab, setTab ] = React.useState('new');
  const [ name, setName ] = React.useState(model.name);
  const [ description, setDescription ] = React.useState('');

  const [ gallery, setGallery ] = React.useState<string[]>([]);

  React.useEffect(() => {
    setGallery([]);

    new Promise<GalleryInterface[]>((resolve, reject) => getSocket('/overlays/gallery').emit('generic::getAll', (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    })).then((galleryItems) => {
      if (open) {
        // go through items and process all gallery, currently we can have gallery items only in html
        for (const item of model.items.filter(o => o.opts.typeId === 'html')) {
          for (const gItem of galleryItems) {
            const url = `${server}/gallery/${gItem.id}`;
            const opts = (item.opts as HTML);
            if (opts.html.includes(url) || opts.javascript.includes(url) || opts.css.includes(url)) {
              setGallery(o => [...o, url]);
            }
          }
        }
      }
    });
  }, [open, server]);

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
              control={<Checkbox defaultChecked />}
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
          <FormGroup>
            { gallery.map((o, idx) =>  <FormControlLabel
              key={idx}
              control={<Checkbox defaultChecked />}
              label={<Typography>{o}</Typography>} /> )}
          </FormGroup>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpen(false)}>Close</Button>
      </DialogActions>
    </Dialog>
  </>;
};