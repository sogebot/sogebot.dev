import * as React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import { getSocket } from '@sogebot/ui-helpers/socket';
import { useState } from 'react';
import { Alert, AlertTitle, Backdrop, CircularProgress, Grid, IconButton, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import type { SongRequestInterface } from '@entity/song';
import { dayjs } from '@sogebot/ui-helpers/dayjsHelper';
import Link from 'next/link';
import Image from 'next/image';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import LinkIcon from '@mui/icons-material/Link';

const generateThumbnail = (videoId: string) => {
  return `https://img.youtube.com/vi/${videoId}/1.jpg`;
};

export default function ListSongRequests() {
  const [ items, setItems ] = useState<(SongRequestInterface)[]>([])
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
                <TableCell></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((row) => (
                <TableRow key={row.id}  >
                  <TableCell>{row.title}</TableCell>
                  <TableCell>{row.username}</TableCell>
                  <TableCell>{dayjs(row.addedAt).format('LL LTS')}</TableCell>
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
