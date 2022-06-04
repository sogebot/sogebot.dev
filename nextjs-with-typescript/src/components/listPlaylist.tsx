import * as React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import { getSocket } from '@sogebot/ui-helpers/socket';
import { useState } from 'react';
import { Alert, Backdrop, CircularProgress, Grid, IconButton, Pagination, Table, TableBody, TableCell, TableContainer, TableFooter, TableHead, TablePagination, TableRow, Typography } from '@mui/material';
import type { SongPlaylistInterface } from '@entity/song';
import { useDispatch, useSelector } from 'react-redux';
import { setTag } from '../store/playlistSlice';
import LinkIcon from '@mui/icons-material/Link';

export default function ListPlaylist() {
  const { search } = useSelector((state: any) => state.search);
  const dispatch = useDispatch()

  const [ page, setPage ] = useState(1)
  const [ itemsPerPage, setItemsPerPage ] = useState(15)
  const [ count, setCount ] = useState(0)

  const [ items, setItems ] = useState<(SongPlaylistInterface)[]>([])
  const [ loading, setLoading ] = useState<boolean>(true)

  React.useEffect(() => {
    setLoading(true);
    getSocket('/systems/songs', true).emit('current.playlist.tag', (err1, tag) => {
      if (err1) {
        return console.error(err1);
      }

      dispatch(setTag(tag));

      getSocket('/systems/songs', true).emit('find.playlist', {
        perPage: (itemsPerPage ?? 25),
        page:    ((page ?? 0)),
        tag,
        search:  search,
      }, (err, itemsFromServer, countOfItems) => {
        if (err) {
          return console.error(err);
        }
        setCount(countOfItems);
        setItems(itemsFromServer);
        setLoading(false)
      });
    });
  }, [page, itemsPerPage, search, dispatch])

  React.useEffect(() => {
    setPage(0);
  }, [search])

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setItemsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

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
          <Table sx={{ minWidth: 650 }} size="small" >
            <TableBody>
              {items.map((row) => (
                <TableRow
                  key={row.videoId}
                >
                  <TableCell component="th" scope="row">{row.videoId}</TableCell>
                  <TableCell>{row.title}</TableCell>
                  <TableCell align='right'>
                    <IconButton target={'_blank'} href={`https://youtu.be/${row.videoId}`}>
                      <LinkIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TablePagination
                  count={count}
                  rowsPerPageOptions={[15, 50, 100, { value: -1, label: 'All' }]}
                  page={page}
                  rowsPerPage={itemsPerPage}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  />
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>
      }

      {!loading && items.length === 0 &&
        <Grid container justifyContent={'center'}>
          <Alert severity="warning" variant="outlined" >
            No songs in playlist found.
          </Alert>
        </Grid>
      }
    </Box>
  );
}
