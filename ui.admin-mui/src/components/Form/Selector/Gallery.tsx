import { GalleryInterface } from '@entity/gallery';
import { CollectionsTwoTone, Folder } from '@mui/icons-material';
import { Box, Breadcrumbs, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormLabel, Grid, IconButton, Link, Skeleton, Stack, Typography } from '@mui/material';
import axios from 'axios';
import { uniq } from 'lodash';
import { enqueueSnackbar } from 'notistack';
import React from 'react';
import { useLocalstorageState } from 'rooks';

import getAccessToken from '../../../getAccessToken';
import theme from '../../../theme';
import { AudioButton } from '../../Audio/Button';
import defaultImage from '../../Overlay/assets/alerts/default.gif';
import defaultAudio from '../../Overlay/assets/alerts/default.mp3';

export const normalizePath = (path: string) => {
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

export const getDirectoriesOf = (items: GalleryInterface[], directories: string[]) => {
  const folders = items.map(o => o.folder.split('/').filter(Boolean));

  // get first level
  const firstLevelFolder: string[] = [];
  for (const f of folders) {
    // check if valid
    let valid = f.length > 0;
    for (let i = 0; i < directories.length; i++) {
      try {
        if (f[i] !== directories[i]) {
          valid = false;
        }
      } catch {
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

type Props = {
  label:     string
  type:      'audio' | 'image',
  value?:    string;
  volume?:   number;
  button?:   boolean;
  announce?: string;
  onChange(value: string | null, volume: number | null, type: string): void;
  onVolumeChange?(value: number | null): void;
};

export const FormSelectorGallery: React.FC<Props> = ({ label, type, value, onChange, volume, onVolumeChange, button, announce }) => {
  const [server] = useLocalstorageState('server', 'https://demobot.sogebot.xyz');

  const [ items, setItems ] = React.useState<GalleryInterface[]>([]);
  const [ folder, setFolder ] = React.useState('/');
  const [ loading, setLoading ] = React.useState(false);

  const [ open, setOpen ] = React.useState(false);

  const itemsInFolder = React.useMemo(() => {
    return items.filter(o => o.folder === folder);
  }, [ items, folder ]);

  const handleClick = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const refresh = () => {
    setFolder('/');

    setLoading(true);
    axios.get('/api/overlays/gallery', {
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
      }
    }).then(({ data }) => {
      const _items = data.data as GalleryInterface[];
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

      // go to selected item folder
      if (value) {
        const currentItem = _items.find(o => o.id === value);
        setFolder(currentItem?.folder ?? '/');
      }

      setLoading(false);
    });
  };

  React.useEffect(() => {
    if (open) {
      refresh();
    }
  }, [ open ]);
  React.useEffect(() => refresh(), []);

  const isDefaultImage = value === '%default%';
  const selectedItem = !isDefaultImage
    ? items.find(o => o.id === value)
    : {
      id:   '%default%',
      type: type,
    };

  return <Box sx={{ width: '100%' }}>
    { button ? <Button onClick={handleClick}>{label}</Button>
      : <Stack direction='column' alignItems={'center'}>
        <Stack direction='row'sx={{ width: '100% ' }} alignItems='center' spacing={2}>
          <FormLabel>{label}</FormLabel>
          <IconButton onClick={handleClick} sx={{ borderRadius: 0 }}>
            <CollectionsTwoTone/>
          </IconButton>
        </Stack>
        { selectedItem ? <Box sx={{ pb: 0 }}>
          {selectedItem.type.includes('image') && <img
            alt=''
            src={isDefaultImage
              ? defaultImage
              : `${server}/gallery/${selectedItem.id}`}
            style={{
              height: '150px', maxWidth: '266px', objectFit: 'contain',
            }}
          />}
          {selectedItem.type.includes('video') && <video
            controls
            onLoadedData={(ev) => ev.currentTarget.volume = volume ? volume / 100 : 0.2}
            onVolumeChange={(ev) => {
              onChange(selectedItem.id!, ev.currentTarget.volume * 100, selectedItem.type! as any);
              onVolumeChange && onVolumeChange(ev.currentTarget.volume * 100);
            }}
            src={`${server}/gallery/${selectedItem.id}`}
            style={{
              height: '150px', maxWidth: '266px', objectFit: 'contain',
            }}
          />}
          {selectedItem.type.includes('audio') && <audio
            controls
            onLoadedData={(ev) => ev.currentTarget.volume = volume ? volume / 100 : 0.2}
            onVolumeChange={(ev) => {
              onChange(selectedItem.id!, ev.currentTarget.volume * 100, selectedItem.type! as any);
              onVolumeChange && onVolumeChange(ev.currentTarget.volume * 100);
            }}
            src={isDefaultImage
              ? defaultAudio
              : `${server}/gallery/${selectedItem.id}`}
            style={{ height: '20px' }}
          />}
        </Box> : <Typography>No item selected</Typography>}
      </Stack>
    }
    <Dialog
      maxWidth={false}
      PaperProps={{
        sx: {
          width: '70%', height: '70%',
        },
      }}
      hideBackdrop
      key={String(loading)}
      open={open}
      onClose={handleClose}
    >
      {loading
        ? <>
          <DialogTitle sx={{
            backgroundColor: 'rgba(0,0,0,0.5)', padding: '0 24px',
          }}>
            <Box sx={{ p: '16px' }}>
              <Skeleton width={200}/>
            </Box>
          </DialogTitle>
          <DialogContent dividers>
            <Grid container>
              {[...Array(9).keys()].map((_, idx) => <Grid key={idx} xs={4} sx={{ p: 0.5 }}>
                <Skeleton variant='rectangular' width='100%' height='100%' sx={{ aspectRatio: '1.5/1' }}/>
              </Grid>)}
            </Grid>
          </DialogContent>
        </>
        : <>
          <DialogTitle sx={{
            backgroundColor: 'rgba(0,0,0,0.5)', padding: '0 24px',
          }}>
            <Stack direction='row' sx={{
              p: 2, width: '100%',
            }} spacing={2}>
              <Folder/>
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
          </DialogTitle>

          <DialogContent dividers>
            <Grid container>
              {getDirectoriesOf(items, folder.split('/').filter(Boolean) ).map(directory => <Grid key={directory} xs={4} sx={{ p: 0.5 }}>
                <IconButton sx={{
                  borderRadius: 0,
                  width:        '100%',
                  height:       '100%',
                  aspectRatio:  '1.5/1',
                }} onClick={() => setFolder(`${folder}/${directory}`.replace(/\/\//g, '/'))}>
                  <Stack alignItems='center'>
                    <Folder sx={{ fontSize: '80px' }}/>
                    <Typography variant='caption'>{directory}</Typography>
                  </Stack>
                </IconButton>
              </Grid>)}
              {itemsInFolder.map(item => <Grid key={item.id} xs={4} sx={{
                p: 0.5, aspectRatio: '1.5/1',
              }}>
                <IconButton sx={{
                  '&:hover':       { backgroundColor: value === item.id ? `${theme.palette.primary.main}66` : undefined },
                  borderRadius:    0,
                  width:           '100%',
                  height:          '100%',
                  p:               1,
                  pb:              4,
                  backgroundColor: value === item.id ? `${theme.palette.primary.main}55` : undefined,
                }} onClick={() => {
                  if (value === item.id!) {
                    onChange(null, null, 'image');
                    onVolumeChange && onVolumeChange(null);
                  } else {
                    console.log(item.id!, 20, item.type! as any);
                    onChange(item.id!, 20, item.type! as any);
                    if (announce) {
                      enqueueSnackbar(announce);
                    }
                    onVolumeChange && onVolumeChange(20); //set default volume to 20%
                  }
                }}>
                  <Box alignItems='center' sx={{
                    height: '100%', width: '100%', position: 'relative',
                  }}>
                    {item.type.includes('image') && <img
                      alt=''
                      src={`${server}/gallery/${item.id}`}
                      style={{
                        objectFit: 'contain', width: '100%', height: '100%',
                      }}
                    />}
                    {item.type.includes('video') && <video
                      controls
                      onLoadedData={(ev) => ev.currentTarget.volume = 0.2}
                      src={`${server}/gallery/${item.id}`}
                      style={{
                        objectFit: 'contain', width: '100%', height: '100%',
                      }}
                    />}
                    {item.type.includes('audio') && <AudioButton src={`${server}/gallery/${item.id}`}/>}
                    <Typography variant='caption' sx={{
                      position:   'absolute',
                      width:      '100%',
                      left:       '50%',
                      transform:  'translateX(-50%)',
                      bottom:     '-1.5rem',
                      textShadow: '0px 0px 2px #000000, 0px 0px 5px #000000, 0px 0px 10px #000000',
                    }}>{item.name}</Typography>
                  </Box>
                </IconButton>
              </Grid>)}
            </Grid>
          </DialogContent>
        </>}
      <DialogActions>
        <Button sx={{
          width: '200px', ml: 2,
        }} variant='contained' onClick={() => setOpen(false)}>Close</Button>
      </DialogActions>
    </Dialog>

  </Box>;
};