import { Folder } from '@mui/icons-material';
import LoadingButton from '@mui/lab/LoadingButton';
import {
  Box, Button, CircularProgress, Grid,
  IconButton, Stack, Typography,
} from '@mui/material';
import { GalleryInterface } from '@sogebot/backend/dest/database/entity/gallery';
import { useSnackbar } from 'notistack';
import React from 'react';
import { useLocalstorageState , useRefElement } from 'rooks';
import shortid from 'shortid';
import SimpleBar from 'simplebar-react';

import { AudioButton } from '../../components/Audio/Button';
import { getDirectoriesOf, normalizePath } from '../../components/Form/Selector/Gallery';
import { getBase64FromUrl } from '../../helpers/getBase64FromURL';
import { getSocket } from '../../helpers/socket';
import theme from '../../theme';

const PageRegistryGallery = () => {
  const [server] = useLocalstorageState('server', 'https://demobot.sogebot.xyz');
  const { enqueueSnackbar } = useSnackbar();

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

  const copy = React.useCallback(() => {
    if (!selectedItem) {
      return;
    }
    const link = `${server}/gallery/${selectedItem}`;
    navigator.clipboard.writeText(`${link}`);
    enqueueSnackbar(<div>Gallery link &nbsp;<strong>{link}</strong>&nbsp;copied to clipboard.</div>);
  }, [ enqueueSnackbar, selectedItem, server ]);

  const remove = React.useCallback(() => {
    if (!selectedItem) {
      return;
    }
    getSocket('/overlays/gallery').emit('generic::deleteById', selectedItem, () => {
      const item = items.find(o => o.id === selectedItem);
      if (!item) {
        return;
      }
      enqueueSnackbar(<div>File <strong>{item.name}</strong> was removed successfully</div>, { variant: 'success' });
      setSelectedItem(null);
      refresh();
    });
  }, [ enqueueSnackbar, selectedItem, server ]);

  const [ uploading, setUploading ] = React.useState(false);
  const [refUploadInput, elementUploadInput]  = useRefElement<HTMLElement>();

  const filesChange = React.useCallback(async (filesUpload: HTMLInputElement['files']) => {
    if (!filesUpload) {
      return;
    }
    setUploading(true);

    for (const file of filesUpload) {
      try {
        const b64data = (await getBase64FromUrl(URL.createObjectURL(file)));
        await new Promise((resolve) => {
          getSocket('/overlays/gallery').emit('gallery::upload', [
            file.name,
            {
              folder, b64data, id: shortid(),
            }], resolve);
        });
        enqueueSnackbar(<div>File <strong>{file.name}</strong> was uploaded successfully to folder <strong>{folder}</strong></div>, { variant: 'success' });
      } catch (e) {
        if (e instanceof Error) {
          enqueueSnackbar(e.message, { variant: 'error' });
          console.error(e);
        }
      }
    }

    refresh();
    setUploading(false);
  }, [ enqueueSnackbar, folder ]);

  const refresh = () => {
    // refresh
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
    });
  };

  return <>
    {loading
      ? <CircularProgress color="inherit" sx={{
        position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, 0)',
      }} />
      :  <>
        <Grid container sx={{ pb: 0.7 }} spacing={1} alignItems='center'>
          <Grid item>
            <LoadingButton sx={{ width: 200 }} variant="contained" loading={uploading} onClick={() => elementUploadInput?.click()}>Upload new file</LoadingButton>
            <input
              ref={refUploadInput}
              type="file"
              multiple
              style={{ display: 'none' }}
              accept="audio/*, video/*, image/*"
              onChange={(event) => filesChange(event.target.files)}
            />
          </Grid>
          {selectedItem && <Grid item>
            <Button sx={{ width: 200 }} color='error' variant="contained" onClick={remove}>Delete file</Button>
          </Grid>}
          {selectedItem && <Grid item>
            <Button sx={{ width: 250 }} color='dark' variant="contained" onClick={copy}>Copy link to clipboard</Button>
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
                  <Folder sx={{ fontSize: '80px' }}/>
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
                  <Folder sx={{ fontSize: '80px' }}/>
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
                  {item.type.includes('audio') && <>
                    <AudioButton src={`${server}/gallery/${item.id}`}/>
                  </>}
                  <Typography variant='caption' sx={{
                    position:     'absolute',
                    width:        '100%',
                    left:         '50%',
                    transform:    'translateX(-50%)',
                    bottom:       '-1.5rem',
                    overflowWrap: 'break-word',
                    textShadow:   '0px 0px 2px #000000, 0px 0px 5px #000000, 0px 0px 10px #000000',
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
