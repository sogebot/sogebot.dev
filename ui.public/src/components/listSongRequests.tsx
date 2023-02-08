import * as React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import { getSocket } from '@sogebot/ui-helpers/socket';
import { useState } from 'react';
import { Alert, Backdrop, CircularProgress, Grid, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { dayjs } from '@sogebot/ui-helpers/dayjsHelper';
import LinkIcon from '@mui/icons-material/Link';

export default function ListSongRequests() {
  const [ items, setItems ] = useState<(any)[]>([])
  const [ loading, setLoading ] = useState<boolean>(true)

  React.useEffect(() => {
    const interval = setInterval(() => {
      getSocket('/systems/songs', true).emit('songs::getAllRequests', {}, (err, itemsGetAll) => {
        if (err) {
          console.error(err);
          return;
        }
        console.debug('Loaded', { itemsGetAll });
        setItems(itemsGetAll);
        setLoading(false);
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [])

  return (
    <Box sx={{ width: '100%' }}>
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer - 1 }}
        open={loading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>

      {!loading && items.length > 0 &&
        <TableContainer component={Paper} sx={{ maxHeight: 'calc(100vh - 64px - 33px)' }}>
        <Table sx={{ minWidth: 650 }} stickyHeader size='small'>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Requested by</TableCell>
                <TableCell>Added at</TableCell>
                <TableCell>videoID</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((row) => (
                <TableRow key={row.id}  >
                  <TableCell>{row.title}</TableCell>
                  <TableCell>{row.username}</TableCell>
                  <TableCell>{dayjs(row.addedAt).format('LL LTS')}</TableCell>
                  <TableCell component="th" scope="row" className='monospace'>{row.videoId}</TableCell>
                  <TableCell align='right'>
                    <IconButton target={'_blank'} href={`https://youtu.be/${row.videoId}`}>
                      <LinkIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      }

      {!loading && items.length === 0 &&
        <Grid container justifyContent={'center'}>
          <Alert severity="warning" variant="outlined" >
            No songs in song requests found.
          </Alert>
        </Grid>
      }
    </Box>
  );
}
