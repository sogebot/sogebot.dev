import * as React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import { getSocket } from '@sogebot/ui-helpers/socket';
import { useState } from 'react';
import { Backdrop, CircularProgress, Table, TableBody, TableCell, TableContainer, TableFooter, TableHead, TablePagination, TableRow } from '@mui/material';
import type { SongPlaylistInterface } from '@entity/song';
import { useDispatch, useSelector } from 'react-redux';
import { setTag } from '../store/playlistSlice';
import Image from 'next/image';


const generateThumbnail = (videoId: string) => {
  return `https://img.youtube.com/vi/${videoId}/1.jpg`;
};

export default function ListPlaylist() {
  const { search } = useSelector((state: any) => state.search);
  const dispatch = useDispatch()

  const [ page, setPage ] = useState(1)
  const [ itemsPerPage, setItemsPerPage ] = useState(10)
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

      {!loading &&
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} size="small" padding='none'>
            <TableBody>
              {items.map((row) => (
                <TableRow
                  key={row.videoId}
                  sx={{
                    '&:last-child td, &:last-child th': { border: 0 }
                  }}
                >
                  <TableCell component="th" scope="row" width={110}>
                    <a href={'http://youtu.be/' + row.videoId} target="_blank" rel="noreferrer"><Image width={96} height={72} src={generateThumbnail(row.videoId)} alt="Thumbnail" /></a>
                  </TableCell>
                  <TableCell>{row.title}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TablePagination
                  count={count}
                  rowsPerPageOptions={[10, 25, 50]}
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
    </Box>
  );
}
