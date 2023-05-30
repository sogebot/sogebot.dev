import { FolderTwoTone } from '@mui/icons-material';
import {
  Box, Button, CircularProgress, Grid,
  IconButton, Stack, Typography,
} from '@mui/material';
import { GalleryInterface } from '@sogebot/backend/dest/database/entity/gallery';
import React from 'react';
import { useLocalstorageState } from 'rooks';
import SimpleBar from 'simplebar-react';

import { getDirectoriesOf, normalizePath } from '../../components/Form/Selector/Gallery';
import { getSocket } from '../../helpers/socket';
import theme from '../../theme';

const PageRegistryGallery = () => {
  const [server] = useLocalstorageState('server', 'https://demobot.sogebot.xyz');

  const [ selectedItem, setSelectedItem ] = React.useState<string | null>(null);

  const [ items, setItems ] = React.useState<GalleryInterface[]>([]);
  const [ folder, setFolder ] = React.useState('/');
  const [ loading, setLoading ] = React.useState(false);

  React.useEffect(() => {
    setSelectedItem(null);
  }, [folder ]);

  const itemsInFolder = React.useMemo(() => {
    return items.filter(o => o.folder === folder);
  }, [ items, folder ]);

  React.useEffect(() => {
    setFolder('/');

    setLoading(true);
    getSocket('/overlays/gallery').emit('generic::getAll', (err, _items: GalleryInterface[]) => {
      if (err) {
        console.error(err);
        return;
      }
      console.debug('Loaded', _items);
      setItems(_items
        .map(item => ({
          ...item,
          folder: normalizePath(item.folder),
        })));

      setLoading(false);
    });
  }, []);

  return <>
    {loading
      ? <CircularProgress color="inherit" sx={{
        position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, 0)',
      }} />
      :  <>
        <Grid container sx={{ pb: 0.7 }} spacing={1} alignItems='center'>
          <Grid item>
            <Button sx={{ width: 200 }} variant="contained">Upload new file</Button>
          </Grid>
          {selectedItem && <Grid item>
            <Button sx={{ width: 200 }} color='error' variant="contained">Delete file</Button>
          </Grid>}
          {selectedItem && <Grid item>
            <Button sx={{ width: 250 }} color='dark' variant="contained">Copy link to clipboard</Button>
          </Grid>}
        </Grid>
        <SimpleBar style={{
          maxHeight: 'calc(100vh - 50px - 64px - 2px)', paddingRight: '15px',
        }} autoHide={false}>
          <Grid container>
            {folder !== '/' && <Grid xs={12} sm={6} md={4} lg={3} xl={2} sx={{ p: 0.5 }}>
              <IconButton sx={{
                borderRadius: 0,
                width:        '100%',
                height:       '100%',
                aspectRatio:  '1.5/1',
              }} onClick={() => {
                const folders = folder.split('/').slice(0, folder.split('/').length - 1).join('/');
                setFolder(`${folders.length === 0 ? '/' : folders}`.replace(/\/\//g, '/'));
              }}>
                <Stack alignItems='center'>
                  <FolderTwoTone sx={{ fontSize: '80px' }}/>
                  <Typography variant='caption'>..</Typography>
                </Stack>
              </IconButton>
            </Grid>}
            {getDirectoriesOf(items, folder.split('/').filter(Boolean) ).map(directory => <Grid key={directory} xs={12} sm={6} md={4} lg={3} xl={2} sx={{ p: 0.5 }}>
              <IconButton sx={{
                borderRadius: 0,
                width:        '100%',
                height:       '100%',
                aspectRatio:  '1.5/1',
              }} onClick={() => setFolder(`${folder}/${directory}`.replace(/\/\//g, '/'))}>
                <Stack alignItems='center'>
                  <FolderTwoTone sx={{ fontSize: '80px' }}/>
                  <Typography variant='caption'>{directory}</Typography>
                </Stack>
              </IconButton>
            </Grid>)}
            {itemsInFolder.map(item => <Grid key={item.id} xs={12} sm={6} md={4} lg={3} xl={2} sx={{
              p: 0.5, aspectRatio: '1.5/1',
            }}>
              <IconButton sx={{
                '&:hover':       { backgroundColor: selectedItem === item.id ? `${theme.palette.primary.main}66` : undefined },
                borderRadius:    0,
                width:           '100%',
                height:          '100%',
                p:               1,
                pb:              4,
                backgroundColor: selectedItem === item.id ? `${theme.palette.primary.main}55` : undefined,
              }}
              onClick={() => {
                setSelectedItem(selectedItem === item.id ? null : item.id!);
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
                  {item.type.includes('audio') && <audio
                    controls
                    onLoadedData={(ev) => ev.currentTarget.volume = 0.2}
                    src={`${server}/gallery/${item.id}`}
                    style={{
                      objectFit: 'contain', width: '100%', height: '100%',
                    }}
                  />}
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
        </SimpleBar>
      </>}
  </>;
};
export default PageRegistryGallery;
