import {
  FilteringState,
  IntegratedFiltering,
  IntegratedSelection,
  IntegratedSorting,
  SelectionState,
  SortingState,
} from '@devexpress/dx-react-grid';
import {
  Grid as DataGrid,
  Table,
  TableColumnVisibility,
  TableHeaderRow,
  TableSelection,
} from '@devexpress/dx-react-grid-material-ui';
import { Quotes } from '@entity/quotes';
import { Edit } from '@mui/icons-material';
import {
  Button,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { grey } from '@mui/material/colors';
import axios from 'axios';
import { useRouter } from 'next/router';
import { useSnackbar } from 'notistack';
import {
  ReactElement, useCallback, useEffect, useState,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import SimpleBar from 'simplebar-react';

import { DisabledAlert } from '@/components/System/DisabledAlert';
import { NextPageWithLayout } from '~/pages/_app';
import { ButtonsDeleteBulk } from '~/src/components/Buttons/DeleteBulk';
import { GridActionAliasMenu } from '~/src/components/GridAction/AliasMenu';
import { Layout } from '~/src/components/Layout/main';
import { QuotesEdit } from '~/src/components/RightDrawer/QuotesEdit';
import { ListTypeProvider } from '~/src/components/Table/ListTypeProvider';
import getAccessToken from '~/src/getAccessToken';
import { dayjs } from '~/src/helpers/dayjsHelper';
import { useColumnMaker } from '~/src/hooks/useColumnMaker';
import { useFilter } from '~/src/hooks/useFilter';
import { setBulkCount } from '~/src/store/appbarSlice';

const PageManageQuotes: NextPageWithLayout = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();

  const [ items, setItems ] = useState<Quotes[]>([]);
  const [ users, setUsers ] = useState<[userId: string, userName: string][]>([]);
  const [ loading, setLoading ] = useState(true);
  const { bulkCount } = useSelector((state: any) => state.appbar);
  const [ selection, setSelection ] = useState<(string|number)[]>([]);

  const { useFilterSetup, columns, tableColumnExtensions, sortingTableExtensions, defaultHiddenColumnNames, filteringColumnExtensions } = useColumnMaker<Quotes & { quotedByName: string, idWithCreatedAt: string }>([
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
      columnName:     'quotedByName',
      translationKey: 'systems.quotes.by.name',
      filtering:      {
        type:    'list',
        options: { listValues: Array.from(new Set(items.map(it => (users.find(o => o[0] === it.quotedBy) || ['', 'unknown user'])[1] ))) },
      },
      hidden: true,
      column: { getCellValue: (row) => (users.find(o => o[0] === row.quotedBy) || ['', 'unknown user'])[1] },
    },
    {
      columnName:     'quotedBy',
      translationKey: 'systems.quotes.by.name',
      column:         {
        getCellValue: (row) => [
          <Stack direction="row" key="row" sx={{ alignItems: 'baseline' }}>
            <Typography sx={{ pr: 0.5 }}>{(users.find(o => o[0] === row.quotedBy) || ['', 'unknown user'])[1]}</Typography>
            <Typography variant="caption">({ row.quotedBy })</Typography>
          </Stack>,
        ],
      },
    },
    {
      columnName:     'createdAt',
      translationKey: 'time',
      hidden:         true,
    },
    {
      columnName:  'actions',
      translation: ' ',
      table:       { width: 130 },
      column:      {
        getCellValue: (row) => [
          <Stack direction="row" key="row">
            <Button
              size='small'
              variant="contained"
              startIcon={<Edit/>}
              onClick={() => {
                router.push('/manage/quotes/edit/' + row.id);
              }}>Edit</Button>
            <GridActionAliasMenu key='delete' onDelete={() => deleteItem(row)} />
          </Stack>,
        ],
      },
    }]);

  const { element: filterElement, filters } = useFilter<Quotes>(useFilterSetup);

  const deleteItem = useCallback((item: Quotes) => {
    axios.delete(`${JSON.parse(localStorage.server)}/api/systems/quotes/${item.id}`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
      .finally(() => {
        enqueueSnackbar(`Quote ${item.id} deleted successfully.`, { variant: 'success' });
        refresh();
      });
  }, [ enqueueSnackbar ]);

  useEffect(() => {
    refresh().then(() => setLoading(false));
  }, [router]);

  const refresh = async () => {
    await Promise.all([
      new Promise<void>(resolve => {
        axios.get(`${JSON.parse(localStorage.server)}/api/systems/quotes`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
          .then(({ data }) => {
            setUsers(data.users);
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
          axios.delete(`${JSON.parse(localStorage.server)}/api/systems/quotes/${item.id}`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
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

  return (
    <>
      <Grid container sx={{ pb: 0.7 }} spacing={1} alignItems='center'>
        <DisabledAlert system='quotes'/>
        <Grid item>
          <Button variant="contained" onClick={() => {
            router.push('/manage/quotes/create/');
          }}>Create new quote</Button>
        </Grid>
        <Grid item>
          <ButtonsDeleteBulk disabled={bulkCount === 0} onDelete={bulkDelete}/>
        </Grid>
        <Grid item>{filterElement}</Grid>
        <Grid item>
          {bulkCount > 0 && <Typography variant="button" px={2}>{ bulkCount } selected</Typography>}
        </Grid>
      </Grid>

      {loading
        ? <CircularProgress color="inherit" sx={{
          position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, 0)',
        }} />
        : <Paper>
          <SimpleBar style={{ maxHeight: 'calc(100vh - 116px)' }} autoHide={false}>
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
          </SimpleBar>
        </Paper>}
      <QuotesEdit items={items} users={users}/>
    </>
  );
};

PageManageQuotes.getLayout = function getLayout(page: ReactElement) {
  return (
    <Layout>
      {page}
    </Layout>
  );
};

export default PageManageQuotes;
