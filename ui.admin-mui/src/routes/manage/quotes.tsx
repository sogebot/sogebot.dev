import { FilteringState, IntegratedFiltering, IntegratedSelection, IntegratedSorting, SelectionState, SortingState } from '@devexpress/dx-react-grid';
import { Grid as DataGrid, Table, TableColumnVisibility, TableHeaderRow, TableSelection } from '@devexpress/dx-react-grid-material-ui';
import { Button, CircularProgress, Dialog, Grid, Link, Stack, Typography } from '@mui/material';
import { grey } from '@mui/material/colors';
import { Quotes } from '@sogebot/backend/dest/database/entity/quotes';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import React, { useCallback, useEffect, useState } from 'react';
import { Link as RouterLink, useLocation , useParams } from 'react-router-dom';
import { useLocalstorageState } from 'rooks';
import SimpleBar from 'simplebar-react';

import { ButtonsDeleteBulk } from '../../components/Buttons/DeleteBulk';
import { DeleteButton } from '../../components/Buttons/DeleteButton';
import EditButton from '../../components/Buttons/EditButton';
import { DisabledAlert } from '../../components/DisabledAlert';
import { QuotesEdit } from '../../components/Form/QuotesEdit';
import { ListTypeProvider } from '../../components/Table/ListTypeProvider';
import getAccessToken from '../../getAccessToken';
import { dayjs } from '../../helpers/dayjsHelper';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { ColumnMakerProps, useColumnMaker } from '../../hooks/useColumnMaker';
import { useFilter } from '../../hooks/useFilter';
import { useScope } from '../../hooks/useScope';
import { setBulkCount } from '../../store/appbarSlice';

const PageManageQuotes = () => {
  const scope = useScope('systems:quotes');

  const [server] = useLocalstorageState('server', 'https://demobot.sogebot.xyz');
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { type, id } = useParams();
  const { enqueueSnackbar } = useSnackbar();

  const [ items, setItems ] = useState<Quotes[]>([]);
  const [ loading, setLoading ] = useState(true);
  const { bulkCount } = useAppSelector(state => state.appbar);
  const [ selection, setSelection ] = useState<(string|number)[]>([]);

  const columnsTpl: ColumnMakerProps<Quotes> = [
    {
      columnName:  'id',
      translation: '#',
      filtering:   { type: 'number' },
      hidden:      true,
    },
    {
      columnName:  'idWithCreatedAt',
      translation: '#',
      column:      {
        getCellValue: (row) => [
          <Stack key="row">
            <Typography>{row.id}</Typography>
            <Typography color={grey[200]} variant="caption">{ dayjs(row.createdAt).format('LL') } { dayjs(row.createdAt).format('LTS') }</Typography>
          </Stack>,
        ],
      },
    },
    {
      columnName:     'quote',
      translationKey: 'systems.quotes.quote.name',
      filtering:      { type: 'string' },
    },
    {
      columnName:     'tags',
      translationKey: 'systems.quotes.tags.name',
      filtering:      {
        type:    'list',
        options: { listValues: Array.from(new Set(items.map(o => o.tags).flat())) },
      },
    },
    {
      columnName:     'quotedByUserName',
      translationKey: 'systems.quotes.by.name',
      filtering:      {
        type:    'list',
        options: { listValues: Array.from(new Set(items.map(it => it.quotedByUserName ?? 'unknown user' ))) },
      },
      hidden: true,
      // column: { getCellValue: (row) => (users.find(o => o[0] === row.quotedBy) || ['', 'unknown user'])[1] },
    },
    {
      columnName:     'quotedBy',
      translationKey: 'systems.quotes.by.name',
      column:         {
        getCellValue: (row) => [
          <Stack direction="row" key="row" sx={{ alignItems: 'baseline' }}>
            {row.quotedByUserName
              ? <Link component={RouterLink} to={`/manage/viewers/${row.quotedBy}?server=${server}`}>{row.quotedByUserName}#{row.quotedBy}</Link>
              : <Typography>{row.quotedByUserName ?? 'unknown user'}#{row.quotedBy}</Typography>}
          </Stack>,
        ],
      },
    },
    {
      columnName:     'createdAt',
      translationKey: 'time',
      hidden:         true,
    },
  ];

  if (scope.manage) {
    columnsTpl.push({
      columnName: 'actions',
      translation: ' ',
      table: { width: 130 },
      column: {
        getCellValue: (row) => [
          <Stack direction="row" key="row">
            <EditButton href={'/manage/quotes/edit/' + row.id}/>
            <DeleteButton key='delete' onDelete={() => deleteItem(row)} />
          </Stack>,
        ],
      },
    });
  }

  const { useFilterSetup, columns, tableColumnExtensions, sortingTableExtensions, defaultHiddenColumnNames, filteringColumnExtensions } = useColumnMaker<Quotes & { idWithCreatedAt: string }>(columnTpl);

  const { element: filterElement, filters } = useFilter<Quotes>(useFilterSetup);

  const deleteItem = useCallback((item: Quotes) => {
    axios.delete(`/api/systems/quotes/${item.id}`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
      .finally(() => {
        enqueueSnackbar(`Quote ${item.id} deleted successfully.`, { variant: 'success' });
        refresh();
      });
  }, [ enqueueSnackbar ]);

  useEffect(() => {
    refresh().then(() => setLoading(false));
  }, [location.pathname]);

  const refresh = async () => {
    await Promise.all([
      new Promise<void>(resolve => {
        axios.get(`/api/systems/quotes`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
          .then(({ data }) => {
            setItems(data.data);
            resolve();
          });
      }),
    ]);
  };

  useEffect(() => {
    dispatch(setBulkCount(selection.length));
  }, [selection, dispatch]);

  const bulkDelete =  useCallback(async () => {
    for (const selected of selection) {
      const item = items.find(o => o.id === selected);
      if (item) {
        await new Promise<void>((resolve) => {
          axios.delete(`/api/systems/quotes/${item.id}`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
            .finally(() => {
              resolve();
            });
        });
      }
    }
    setItems(i => i.filter(item => !selection.includes(item.id)));
    enqueueSnackbar(`Bulk operation deleted items.`, { variant: 'success' });
    setSelection([]);
  }, [ selection, enqueueSnackbar, items ]);

  const open = React.useMemo(() => !!(type
    && (
      (type === 'edit' && id)
      || type === 'create'
    )
  ), [type, id]);

  return (
    <>
      <Grid container sx={{ pb: 0.7 }} spacing={1} alignItems='center'>
        <DisabledAlert system='quotes'/>
        {scope.manage && <>
          <Grid item>
            <Button variant="contained" href='/manage/quotes/create/'>Create new quote</Button>
          </Grid>
          <Grid item>
            <ButtonsDeleteBulk disabled={bulkCount === 0} onDelete={bulkDelete}/>
          </Grid>
        </>}
        <Grid item>{filterElement}</Grid>
        <Grid item>
          {bulkCount > 0 && <Typography variant="button" px={2}>{ bulkCount } selected</Typography>}
        </Grid>
      </Grid>

      {loading
        ? <CircularProgress color="inherit" sx={{
          position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, 0)',
        }} />
        : <SimpleBar style={{ maxHeight: 'calc(100vh - 116px)' }} autoHide={false}>
          <DataGrid
            rows={items}
            columns={columns}
            getRowId={row => row.id}
          >
            <ListTypeProvider for={['tags']}/>

            <SortingState
              defaultSorting={[{
                columnName: 'id', direction: 'asc',
              }]}
              columnExtensions={sortingTableExtensions}
            />
            <IntegratedSorting />

            <FilteringState filters={filters}/>
            <IntegratedFiltering columnExtensions={filteringColumnExtensions}/>

            <SelectionState
              selection={selection}
              onSelectionChange={setSelection}
            />
            <IntegratedSelection/>
            <Table columnExtensions={tableColumnExtensions}/>
            <TableHeaderRow showSortingControls/>
            <TableColumnVisibility
              defaultHiddenColumnNames={defaultHiddenColumnNames}
            />
            <TableSelection showSelectAll/>
          </DataGrid>
        </SimpleBar>}

      <Dialog
        open={open}
        fullWidth
        maxWidth='md'>
        {open && <QuotesEdit items={items}/>}
      </Dialog>
    </>
  );
};
export default PageManageQuotes;