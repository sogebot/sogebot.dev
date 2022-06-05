import * as React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import type { QuotesInterface } from '@entity/quotes';
import { dayjs } from '@sogebot/ui-helpers/dayjsHelper';
import { getSocket } from '@sogebot/ui-helpers/socket';
import { useState } from 'react';
import { Alert, Backdrop, Card, CardActions, CardContent, CardHeader, Chip, CircularProgress, Divider, Grid, Pagination, Typography } from '@mui/material';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import { setTag, setTags } from '../store/quotesSlice'
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

      dispatch(setTags(Array.from(new Set([...itemsGetAll.map(o => o.tags)].flat()))))
      setLoading(false);
    });
  }, [dispatch])

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
            <Card key={key} sx={{ mb: 1 }}>
              <CardContent sx={{ pb: 0 }}>
                <Typography display="inline" gutterBottom variant="h5" component="div">
                  #{row.id}
                </Typography>
                <Typography variant="body2" display="inline" sx={{ ml:1, mr:1 }} fontWeight={'bold'} color="text.secondary">
                  {row.quotedByName}
                </Typography>
                <Typography variant="body2" display="inline" sx={{ mr:1 }} color="text.secondary">
                  {dayjs(row.createdAt).format('LL LTS')}
                </Typography>

                <Divider sx={{ mb: 1 }}/>
                <Typography variant="body1" gutterBottom>
                  {row.quote}
                </Typography>
                <Divider sx={{ mb: 1 }}/>
              </CardContent>

              <CardActions sx={{ pt:0, px: 2 }}>
                {row.tags.map((o, idx) => {
                  const key = `quote-${idx}`;
                  return (
                    <Chip label={o} key={key} color="primary" size='small' variant={tag === o ? "filled" : "outlined"} onClick={() => handleTagClick(o)} />
                    )
                  })}
              </CardActions>
            </Card>
          );
        })}

        {!loading && filteredItems().length > 0 &&
          <Grid container justifyContent={'center'}>
            <Pagination count={Math.ceil(filteredItems().length / rowsPerPage)} page={page} onChange={handleChangePage} />
          </Grid>
        }

        {!loading && filteredItems().length === 0 &&
          <Grid container justifyContent={'center'}>
            <Alert severity="warning" variant="outlined" >
              No quotes found.
            </Alert>
          </Grid>
        }
    </Box>
  );
}
