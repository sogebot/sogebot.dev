import * as React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import type { QuotesInterface } from '@entity/quotes';
import { dayjs } from '@sogebot/ui-helpers/dayjsHelper';
import { getSocket } from '@sogebot/ui-helpers/socket';
import { useState } from 'react';
import { Backdrop, Chip, CircularProgress, Grid, Pagination, Typography } from '@mui/material';
import FormatQuoteTwoToneIcon from '@mui/icons-material/FormatQuoteTwoTone';
import { setTag } from '../store/quotesSlice'
import { useDispatch, useSelector } from 'react-redux';
import theme from '../theme';
import { orderBy } from 'lodash';

export default function ListQuotes() {
  const [page, setPage] = React.useState(1);
  const [rowsPerPage] = React.useState(10);

  const { tag } = useSelector((state: any) => state.quotes);
  const dispatch = useDispatch()

  const [ items, setItems ] = useState<(QuotesInterface & { quotedByName: string; })[]>([])
  const [ loading, setLoading ] = useState<boolean>(true)

  const filteredItems = () => {
    const filtered = tag ? items.filter(o => o.tags.includes(tag)): items;
    return orderBy(filtered, 'id', 'desc');
  }

  React.useEffect(() => {
    getSocket('/systems/quotes', true).emit('quotes:getAll', {}, (err, itemsGetAll) => {
      if (err) {
        console.error(err);
        return;
      }
      console.debug('Loaded', { itemsGetAll });
      setItems(itemsGetAll as any);
      setLoading(false);
    });
  }, [])

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleTagClick = (newTag: string) => {
    dispatch(setTag(newTag));
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer - 1 }}
        open={loading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>

      {!loading && filteredItems()
        .slice((page - 1) * rowsPerPage, (page - 1) * rowsPerPage + rowsPerPage)
        .map((row, index) => {
          const key = `quotes-${index}`;
          return (
            <Grid container justifyContent={index % 2 ? 'flex-end' : 'flex-start'} key={key}>
              {index % 2 === 0 && <FormatQuoteTwoToneIcon fontSize='large'/>}
              <Grid xs={8}>
                <Paper sx={{ p: 2, m: 2, alignContent: 'end' }}>
                  <Typography display="block" gutterBottom>
                    <Typography color={theme.palette.primary.dark} display="inline" sx={{ mr:1 }}>
                      #{row.id}
                    </Typography>
                    <Typography color={theme.palette.primary.dark} display="inline" sx={{ mr:1 }} fontWeight={'bold'}>
                      {row.quotedByName}
                    </Typography>
                    <Typography color={theme.palette.primary.dark} display="inline" sx={{ mr:1 }}>
                      {dayjs(row.createdAt).format('LL LTS')}
                    </Typography>
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {row.quote}
                  </Typography>

                  {row.tags.map((o, idx) => {
                    const key = `quote-${idx}`;
                    return (
                      <Chip sx={{ mt: 1, mr: 1 }} label={o} key={key} color="primary" variant={tag === o ? "filled" : "outlined"} onClick={() => handleTagClick(o)} />
                    )
                  })}
                </Paper>
              </Grid>
              {index % 2 !== 0 && <FormatQuoteTwoToneIcon fontSize='large'/>}
          </Grid>
          );
        })}

        {!loading &&
          <Grid container justifyContent={'center'}>
            <Pagination count={Math.ceil(filteredItems().length / rowsPerPage)} page={page} onChange={handleChangePage} />
          </Grid>
        }
    </Box>
  );
}
