import * as React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import { getSocket } from '@sogebot/ui-helpers/socket';
import { useState } from 'react';
import { Backdrop, CircularProgress, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import type { SongRequestInterface } from '@entity/song';
import { dayjs } from '@sogebot/ui-helpers/dayjsHelper';
import Link from 'next/link';
import Image from 'next/image';

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
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="simple table">
            <TableHead>
              <TableRow>
                <TableCell></TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Requested by</TableCell>
                <TableCell>Added at</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((row) => (
                <TableRow
                  key={row.id}
                  sx={{
                    '&, & .MuiTableCell-root': { padding: 0, },
                    '&:last-child td, &:last-child th': { border: 0 }
                  }}
                >
                  <TableCell component="th" scope="row" width={110}>
                   <a href={'http://youtu.be/' + row.videoId} target="_blank" rel="noreferrer"><Image width={96} height={72} src={generateThumbnail(row.videoId)} alt="Thumbnail" /></a>
                  </TableCell>
                  <TableCell>{row.title}</TableCell>
                  <TableCell>{row.username}</TableCell>
                  <TableCell>{dayjs(row.addedAt).format('LL LTS')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      }

      {!loading && items.length === 0 &&
        <Grid container justifyContent={'center'}>
          <Typography>No songs in song requests found</Typography>
        </Grid>
      }
    </Box>
  );
}
