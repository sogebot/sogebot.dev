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
import { Plugin } from '@entity/plugins';
import { CheckBoxTwoTone, DisabledByDefaultTwoTone } from '@mui/icons-material';
import EditIcon from '@mui/icons-material/Edit';
import {
  Button,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import axios from 'axios';
import { useRouter } from 'next/router';
import { useSnackbar } from 'notistack';
import {
  ReactElement, useCallback, useEffect, useMemo, useState,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import SimpleBar from 'simplebar-react';

import { NextPageWithLayout } from '~/pages/_app';
import { ButtonsDeleteBulk } from '~/src/components/Buttons/DeleteBulk';
import { GridActionAliasMenu } from '~/src/components/GridAction/AliasMenu';
import { Layout } from '~/src/components/Layout/main';
import getAccessToken from '~/src/getAccessToken';
import { useColumnMaker } from '~/src/hooks/useColumnMaker';
import { useFilter } from '~/src/hooks/useFilter';
import { setBulkCount } from '~/src/store/appbarSlice';

const PageRegistryPlugins: NextPageWithLayout = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();

  const [ items, setItems ] = useState<Plugin[]>([]);
  const [ loading, setLoading ] = useState(true);
  const { bulkCount } = useSelector((state: any) => state.appbar);
  const [ selection, setSelection ] = useState<(string|number)[]>([]);

  const { useFilterSetup, columns, tableColumnExtensions, sortingTableExtensions, defaultHiddenColumnNames, filteringColumnExtensions } = useColumnMaker<Plugin>([
    {
      columnName:  'actions',
      table:       { width: 130 },
      sorting:     { sortingEnabled: false },
      translation: ' ',
      column:      {
        getCellValue: (row) => [
          <Stack direction="row" key="row">
            <Button
              size='small'
              variant="contained"
              startIcon={<EditIcon/>}
              onClick={() => {
                router.push('/registry/plugins/edit/' + row.id);
              }}>Edit</Button>
            <GridActionAliasMenu key='delete' onDelete={() => deleteItem(row)} />
          </Stack>,
        ],
      },
    },
  ]);

  const { element: filterElement, filters } = useFilter(useFilterSetup);

  const deleteItem = useCallback((item: Plugin) => {
    axios.delete(`${localStorage.server}/api/registry/plugins/${item.id}`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
      .finally(() => {
        enqueueSnackbar(`Plugin ${item.name} (${item.id}) deleted successfully.`, { variant: 'success' });
        refresh();
      });
  }, [ enqueueSnackbar ]);

  useEffect(() => {
    refresh().then(() => setLoading(false));
  }, [router]);

  const refresh = async () => {
    await Promise.all([
      new Promise<void>(resolve => {
        axios.get(`${localStorage.server}/api/registry/plugins`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
          .then(({ data }) => {
            setItems(data.data);
            resolve();
          });
      }),
      new Promise<void>(resolve => {
        axios.get(`https://plugins.sogebot.xyz/plugins`, { headers: { authorization: `Bearer ${localStorage.code}` } })
          .then(({ data }) => {
            console.log({ remotePlugins: data });
          })
          .finally(resolve);
      }),
    ]);
  };

  useEffect(() => {
    dispatch(setBulkCount(selection.length));
  }, [selection, dispatch]);

  const bulkCanEnable = useMemo(() => {
    for (const itemId of selection) {
      const item = items.find(o => o.id === itemId);
      if (item && !item.enabled) {
        return true;
      }
    }
    return false;
  }, [ selection, items ]);

  const bulkCanDisable = useMemo(() => {
    for (const itemId of selection) {
      const item = items.find(o => o.id === itemId);
      if (item && item.enabled) {
        return true;
      }
    }
    return false;
  }, [ selection, items ]);

  const bulkToggleAttribute = useCallback(async <T extends keyof Plugin>(attribute: T, value: Plugin[T]) => {
    for (const selected of selection) {
      const item = items.find(o => o.id === selected);
      if (item && item[attribute] !== value) {
        await new Promise<void>((resolve) => {
          item[attribute] = value;
          axios.post(`${localStorage.server}/api/registry/plugins`, item, { headers: { authorization: `Bearer ${getAccessToken()}` } })
            .then(() => {
              resolve();
            });
        });
      }
    }

    setItems(i => i.map((item) => {
      if (selection.includes(item.id)) {
        item[attribute] = value;
      }
      return item;
    }));

    if (attribute === 'enabled') {
      enqueueSnackbar(`Bulk operation set ${value ? 'enabled' : 'disabled'}.`, { variant: 'success' });
    }

    refresh();
  }, [ enqueueSnackbar, items, selection ]);

  const bulkDelete =  useCallback(async () => {
    for (const selected of selection) {
      const item = items.find(o => o.id === selected);
      if (item) {
        await new Promise<void>((resolve) => {
          axios.delete(`${localStorage.server}/api/registry/plugins/${item.id}`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
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
        <Grid item>
          <Button variant="contained" onClick={() => {
            router.push('/registry/plugins/create/');
          }}>Create new plugin</Button>
        </Grid>
        <Grid item>
          <Tooltip arrow title="Enable">
            <Button disabled={!bulkCanEnable} variant="contained" color="secondary" sx={{
              minWidth: '36px', width: '36px',
            }} onClick={() => bulkToggleAttribute('enabled', true)}><CheckBoxTwoTone/></Button>
          </Tooltip>
        </Grid>
        <Grid item>
          <Tooltip arrow title="Disable">
            <Button disabled={!bulkCanDisable} variant="contained" color="secondary" sx={{
              minWidth: '36px', width: '36px',
            }} onClick={() => bulkToggleAttribute('enabled', false)}><DisabledByDefaultTwoTone/></Button>
          </Tooltip>
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

              <SortingState
                defaultSorting={[{
                  columnName: 'name', direction: 'asc',
                }]}
                columnExtensions={sortingTableExtensions}
              />
              <IntegratedSorting columnExtensions={sortingTableExtensions} />

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
    </>
  );
};

PageRegistryPlugins.getLayout = function getLayout(page: ReactElement) {
  return (
    <Layout>
      {page}
    </Layout>
  );
};

export default PageRegistryPlugins;
