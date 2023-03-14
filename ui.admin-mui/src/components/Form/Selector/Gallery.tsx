import { FolderTwoTone } from '@mui/icons-material';
import {
  Box,
  Breadcrumbs, Button, Grid, IconButton, LinearProgress, Link, Popover, Stack, Toolbar, Typography,
} from '@mui/material';
import { GalleryInterface } from '@sogebot/backend/dest/database/entity/gallery';
import { uniq } from 'lodash';
import React from 'react';
import { useLocalstorageState } from 'rooks';

import { getSocket } from '../../../helpers/socket';

type Props = {
  label: string
  type: 'audio' | 'image'
};

const normalizePath = (path: string) => {
  // remove . if path is empty
  if (path[0] === '.') {
    path = path.replace('.', '');
  }

  // remove trailing slash
  path = path.replace(/\/+$/, '');

  // add leading slash
  if (path[0] !== '/') {
    path = '/' + path;
  }
  return path;
};

const getDirectoriesOf = (items: GalleryInterface[], directories: string[]) => {
  const folders = items.map(o => o.folder.split('/').filter(Boolean));

  // get first level
  const firstLevelFolder = [];
  for (const f of folders) {
    // check if valid
    let valid = f.length > 0;
    for (let i = 0; i < directories.length; i++) {
      try {
        if (f[i] !== directories[i]) {
          valid = false;
        }
      } catch (e) {
        valid = false;
        break;
      }
    }
    if (valid && f[directories.length]) {
      firstLevelFolder.push(f[directories.length]);
    }
  }
  return (uniq(firstLevelFolder)).sort();
};

export const FormSelectorGallery: React.FC<Props> = ({ label, type }) => {
  const [server] = useLocalstorageState('server', 'https://demobot.sogebot.xyz');

  const [ items, setItems ] = React.useState<GalleryInterface[]>([]);
  const [ folder, setFolder ] = React.useState('/');
  const [ loading, setLoading ] = React.useState(false);

  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null);

  const open = Boolean(anchorEl);
  const id = open ? 'simple-popover' : undefined;

  const itemsInFolder = React.useMemo(() => {
    return items.filter(o => o.folder === folder);
  }, [ items, folder ]);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  React.useEffect(() => {
    if (anchorEl) {
      setFolder('/');

      setLoading(true);
      getSocket('/overlays/gallery').emit('generic::getAll', (err, _items: GalleryInterface[]) => {
        if (err) {
          console.error(err);
          return;
        }
        console.debug('Loaded', _items);
        setItems(_items
          .filter(item => {
            if (type === 'audio') {
              return item.type.includes('audio') || item.type.includes('video');
            } else {
              return item.type.includes('image') || item.type.includes('video');
            }
          })
          .map(item => ({
            ...item,
            folder: normalizePath(item.folder),
          })));

        setLoading(false);
      });
    }
  }, [ anchorEl ]);

  return <>
    <Button aria-describedby={id} variant="contained" onClick={handleClick}>
      {label}
    </Button>
    <Popover
      id={id}
      key={String(loading)}
      open={open}
      anchorEl={anchorEl}
      onClose={handleClose}
      anchorOrigin={{
        vertical:   'bottom',
        horizontal: 'left',
      }}
    >
      {loading && <LinearProgress />}
      <Toolbar variant='dense'  sx={{
        backgroundColor: 'rgba(0,0,0,0.5)', height: '20px', mb: 2,
      }}>
        <Stack direction='row' sx={{ p: 2 }} spacing={2}>
          <FolderTwoTone/>
          <Breadcrumbs aria-label="breadcrumb">
            <Link component='span' underline="hover" color="text.primary" onClick={() => setFolder('/')}>
              root
            </Link>
            {folder.split('/').filter(o => o.length > 0).map((item, idx) => <Link
              key={item + idx}
              component='span'
              underline="hover"
              color="text.primary"
              onClick={() => {
                // build folder
                let expectedFolder = '';
                for (let i = 0; i <= idx + 1; i++){
                  expectedFolder += '/' + folder.split('/')[i];
                }
                expectedFolder = expectedFolder.replace(/\/\//g, '/');
                setFolder(expectedFolder);
              }}>
              {item}
            </Link>,
            )}
          </Breadcrumbs>
        </Stack>
      </Toolbar>

      <Box sx={{ width: '50vw' }}>
        <Grid container>
          {getDirectoriesOf(items, folder.split('/').filter(Boolean) ).map(directory => <Grid key={directory} xs={4}>
            <IconButton sx={{
              borderRadius: 0, width: '100%', height: '100%',
            }} onClick={() => setFolder(`${folder}/${directory}`.replace(/\/\//g, '/'))}>
              <Stack alignItems='center'>
                <FolderTwoTone sx={{ fontSize: '80px' }}/>
                <Typography variant='caption'>{directory}</Typography>
              </Stack>
            </IconButton>
          </Grid>)}
          {itemsInFolder.map(item => <Grid key={item.id} xs={4}>
            <IconButton sx={{
              borderRadius: 0, width: '100%', height: '100%',
            }}>
              <Stack alignItems='center'>

                {item.type.includes('image') && <img
                  alt=''
                  src={`${server}/gallery/${item.id}`}
                  style={{
                    maxWidth: '100%', maxHeight: '200px',
                  }}
                />}
                {item.type.includes('video') && <video
                  controls
                  onLoadedData={(ev) => ev.currentTarget.volume = 0.2}
                  src={`${server}/gallery/${item.id}`}
                  style={{
                    maxWidth: '100%', maxHeight: '200px',
                  }}
                />}
                {item.type.includes('audio') && <audio
                  controls
                  onLoadedData={(ev) => ev.currentTarget.volume = 0.2}
                  src={`${server}/gallery/${item.id}`}
                  style={{
                    maxWidth: '100%', maxHeight: '200px',
                  }}
                />}
                <Typography variant='caption'>{item.name}</Typography>
              </Stack>
            </IconButton>
          </Grid>)}
        </Grid>
      </Box>
    </Popover>

  </>;
};