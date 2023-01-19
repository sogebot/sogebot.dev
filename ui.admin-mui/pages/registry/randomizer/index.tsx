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
import { Randomizer } from '@entity/randomizer';
import {
  PlayArrowTwoTone, VisibilityOffTwoTone, VisibilityTwoTone,
} from '@mui/icons-material';
import ContentCopyTwoToneIcon from '@mui/icons-material/ContentCopyTwoTone';
import {
  CircularProgress,
  Dialog,
  Grid,
  IconButton,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import axios from 'axios';
import parse from 'html-react-parser';
import { useRouter } from 'next/router';
import { useSnackbar } from 'notistack';
import {
  ReactElement,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import SimpleBar from 'simplebar-react';
import { v4 } from 'uuid';

import { NextPageWithLayout } from '~/pages/_app';
import { ButtonsDeleteBulk } from '~/src/components/Buttons/DeleteBulk';
import { DeleteButton } from '~/src/components/Buttons/DeleteButton';
import EditButton from '~/src/components/Buttons/EditButton';
import LinkButton from '~/src/components/Buttons/LinkButton';
import { Layout } from '~/src/components/Layout/main';
import { PermissionTypeProvider } from '~/src/components/Table/PermissionTypeProvider';
import getAccessToken from '~/src/getAccessToken';
import { getPermissionName } from '~/src/helpers/getPermissionName';
import { useColumnMaker } from '~/src/hooks/useColumnMaker';
import { useFilter } from '~/src/hooks/useFilter';
import { usePermissions } from '~/src/hooks/usePermissions';
import { setBulkCount } from '~/src/store/appbarSlice';

const PageRegistryRandomizer: NextPageWithLayout = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const { permissions } = usePermissions();

  const [ items, setItems ] = useState<Randomizer[]>([]);

  const [ loading, setLoading ] = useState(true);
  const { bulkCount } = useSelector((state: any) => state.appbar);
  const [ selection, setSelection ] = useState<(string|number)[]>([]);

  const refresh = useCallback(async () => {
    await Promise.all([
      new Promise<void>(resolve => {
        axios.get(`${JSON.parse(localStorage.server)}/api/registries/randomizer`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
          .then(({ data }) => {
            setItems(data.data);
            resolve();
          });
      }),
    ]);
  }, []);

  const visibility = useCallback((item: Randomizer) => {
    item.isShown = !item.isShown;

    setItems(v => v.map(o => ({
      ...o, isShown: item.id === o.id ? item.isShown : false,
    })) as Randomizer[],
    );

    axios.post(`${JSON.parse(localStorage.server)}/api/registries/randomizer/${item.isShown ? `${item.id}/show` : 'hide'}`,
      null,
      { headers: { authorization: `Bearer ${getAccessToken()}` } },
    )
      .then(() => {
        enqueueSnackbar(parse(`Randomizer&nbsp;<strong>${item.name}</strong>&nbsp;was set to be ${item.isShown ? 'visible' : 'hidden'}.`));
      });
  }, [ enqueueSnackbar ]);

  const trigger = useCallback((item: Randomizer) => {
    axios.post(`${JSON.parse(localStorage.server)}/api/registries/randomizer/${item.id}/spin`,
      null,
      { headers: { authorization: `Bearer ${getAccessToken()}` } },
    )
      .then(() => {
        enqueueSnackbar(parse(`Randomizer&nbsp;<strong>${item.name}</strong>&nbsp;was triggered.`));
      });
  }, [ enqueueSnackbar ]);

  const clone = useCallback((item: Randomizer) => {
    const clonedItem = {
      ...item,
      isShown: false, // forcefully hide
      id:      v4(),
      name:    item.name + ' (clone)',
      command: `!${Math.random().toString(36).substr(2, 5)}`,
    };

    axios.post(`${JSON.parse(localStorage.server)}/api/registries/randomizer`,
      clonedItem,
      { headers: { authorization: `Bearer ${getAccessToken()}` } },
    )
      .then(() => {
        enqueueSnackbar('Randomizer cloned.');
        refresh();
      });
  }, [ enqueueSnackbar, refresh ]);

  const { useFilterSetup, columns, tableColumnExtensions, sortingTableExtensions, defaultHiddenColumnNames, filteringColumnExtensions } = useColumnMaker<Randomizer>([
    {
      columnName: 'name',
      filtering:  { type: 'string' },
      table:      { width: '150px' },
    },{
      columnName: 'command',
      filtering:  { type: 'string' },
      table:      { width: '150px' },
    },
    {
      columnName:     'permissionId',
      translationKey: 'permission',
      filtering:      { type: 'permission' },
      column:         { getCellValue: (row) => row.permissionId === null ? '_disabled' : getPermissionName(row.permissionId, permissions || []) },

      table: { width: '150px' },
    },
    {
      columnName:     'items',
      translationKey: 'registry.randomizer.form.options',
      filtering:      { type: 'string' },
      column:         { getCellValue: (row) => row.items.map(o => o.name).join(', ') },
      table:          { wordWrapEnabled: true },
    },
    {
      columnName:  'actions',
      table:       { width: 5 * 43 },
      sorting:     { sortingEnabled: false },
      translation: ' ',
      column:      {
        getCellValue: (row) => [
          <Stack direction="row" key="row">
            <EditButton
              href={'/registry/randomizer/edit/' + row.id}
            />
            <IconButton
              onClick={() => clone(row)}
            ><ContentCopyTwoToneIcon/></IconButton>
            <IconButton
              onClick={() => visibility(row)}
            >
              {row.isShown
                ? <VisibilityTwoTone/>
                : <VisibilityOffTwoTone/>
              }
            </IconButton>
            <IconButton
              onClick={() => trigger(row)}
            ><PlayArrowTwoTone/></IconButton>
            <DeleteButton key='delete' onDelete={() => deleteItem(row)} />
          </Stack>,
        ],
      },
    },
  ]);

  const { element: filterElement, filters } = useFilter(useFilterSetup);

  const deleteItem = useCallback((item: Randomizer) => {
    axios.delete(`${JSON.parse(localStorage.server)}/api/registries/randomizer/${item.id}`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
      .finally(() => {
        enqueueSnackbar(`Price ${item.command} deleted successfully.`, { variant: 'success' });
        refresh();
      });
  }, [ enqueueSnackbar, refresh ]);

  useEffect(() => {
    refresh().then(() => setLoading(false));
  }, [router, refresh]);

  useEffect(() => {
    dispatch(setBulkCount(selection.length));
  }, [selection, dispatch]);

  const bulkDelete =  useCallback(async () => {
    for (const selected of selection) {
      const item = items.find(o => o.id === selected);
      if (item) {
        await new Promise<void>((resolve) => {
          axios.delete(`${JSON.parse(localStorage.server)}/api/systems/price/${item.id}`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
            .finally(() => resolve());
        });
      }
    }
    setItems(i => i.filter(item => !selection.includes(item.id!)));
    enqueueSnackbar(`Bulk operation deleted items.`, { variant: 'success' });
    setSelection([]);
  }, [ selection, enqueueSnackbar, items ]);

  return (
    <>
      <Grid container sx={{ pb: 0.7 }} spacing={1} alignItems='center'>
        <Grid item>
          <LinkButton variant="contained" href='/registry/randomizer/create/'>Create new randomizer</LinkButton>
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
            >
              <PermissionTypeProvider
                for={['permissionId']}
              />
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

      <Dialog
        open={!!(router.query.params
          && (
            (router.query.params[0] === 'edit' && router.query.params[1])
            || router.query.params[0] === 'create'
          )
        )}
        fullWidth
        PaperProps={{ sx: { height: '100% !important' } }}
        maxWidth='md'>
        {/*router.query.params && <CustomVariablesEdit id={router.query.params[1]} onSave={refresh}/>*/}
      </Dialog>
    </>
  );
};

PageRegistryRandomizer.getLayout = function getLayout(page: ReactElement) {
  return (
    <Layout>
      {page}
    </Layout>
  );
};
export default PageRegistryRandomizer;
