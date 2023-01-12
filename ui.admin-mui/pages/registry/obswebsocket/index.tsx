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
import ContentPasteIcon from '@mui/icons-material/ContentPasteTwoTone';
import {
  CircularProgress,
  Dialog,
  Grid,
  IconButton,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { OBSWebsocket } from '@sogebot/backend/dest/database/entity/obswebsocket';
import HTMLReactParser from 'html-react-parser';
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

import { NextPageWithLayout } from '~/pages/_app';
import { ButtonsDeleteBulk } from '~/src/components/Buttons/DeleteBulk';
import { DeleteButton } from '~/src/components/Buttons/DeleteButton';
import EditButton from '~/src/components/Buttons/EditButton';
import LinkButton from '~/src/components/Buttons/LinkButton';
import { Layout } from '~/src/components/Layout/main';
import { OBSWebsocketEdit } from '~/src/components/RightDrawer/OBSWebsocketEdit';
import { getSocket } from '~/src/helpers/socket';
import { useColumnMaker } from '~/src/hooks/useColumnMaker';
import { useFilter } from '~/src/hooks/useFilter';
import { setBulkCount } from '~/src/store/appbarSlice';

const PageRegistryCustomVariables: NextPageWithLayout = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();

  const [ command ] = useState('!obsws run');
  const [ items, setItems ] = useState<OBSWebsocket[]>([]);

  const [ loading, setLoading ] = useState(true);
  const { bulkCount } = useSelector((state: any) => state.appbar);
  const [ selection, setSelection ] = useState<(string|number)[]>([]);

  const refresh = useCallback(async () => {
    await Promise.all([
      new Promise<void>(resolve => {
        getSocket('/').emit('integration::obswebsocket::generic::getAll', (_, data) => {
          setItems(data);
          resolve();
        });
      }),
    ]);
    setLoading(false);
  }, []);

  const copy = useCallback((id: string) => {
    navigator.clipboard.writeText(`${command} ${id}`);
    enqueueSnackbar(HTMLReactParser(`Command&nbsp;<strong>${command} ${id}</strong>&nbsp;copied to clipboard.`));
  }, [ command, enqueueSnackbar ]);

  const { useFilterSetup, columns, tableColumnExtensions, sortingTableExtensions, defaultHiddenColumnNames, filteringColumnExtensions } = useColumnMaker<OBSWebsocket & { command: string }>([
    {
      columnName:     'name',
      translationKey: 'timers.dialog.name',
      filtering:      { type: 'string' },
      table:          { wordWrapEnabled: true },
    },
    {
      columnName:     'command',
      translationKey: 'integrations.obswebsocket.command',
      filtering:      { type: 'string' },
      column:         { getCellValue: (row => `${command} ${row.id}`) },
    },
    {
      columnName:  'actions',
      table:       { width: 200 },
      sorting:     { sortingEnabled: false },
      translation: ' ',
      column:      {
        getCellValue: (row) => [
          <Stack direction="row" key="row">
            <EditButton
              href={'/registry/obswebsocket/edit/' + row.id}
            />
            <IconButton onClick={() => copy(row.id)}><ContentPasteIcon/></IconButton>
            <DeleteButton key='delete' onDelete={() => deleteItem(row)} />
          </Stack>,
        ],
      },
    },
  ]);

  const { element: filterElement, filters } = useFilter(useFilterSetup);

  const deleteItem = useCallback((item: OBSWebsocket) => {
    return new Promise((resolve, reject) => {
      getSocket('/').emit('integration::obswebsocket::generic::deleteById', item.id!, (err) => {
        if (err) {
          console.error(err);
          reject();
          return;
        }
        enqueueSnackbar(`Custom variable ${item.name} (${item.id}) deleted successfully.`, { variant: 'success' });
        refresh();
        resolve(true);
      });
    });
  }, [ enqueueSnackbar, refresh ]);

  useEffect(() => {
    refresh();
  }, [router, refresh]);

  useEffect(() => {
    dispatch(setBulkCount(selection.length));
  }, [selection, dispatch]);

  const bulkDelete =  useCallback(async () => {
    for (const selected of selection) {
      const item = items.find(o => o.id === selected);
      if (item) {
        await new Promise<void>((resolve) => {
          getSocket('/').emit('integration::obswebsocket::generic::deleteById', item.id!, (err) => {
            if (err) {
              console.error(err);
            }
            resolve();
          });
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
          <LinkButton variant="contained" href='/registry/obswebsocket/create/'>Create new OBSWebsocket script</LinkButton>
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
                  columnName: 'variableName', direction: 'asc',
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
        {router.query.params && <OBSWebsocketEdit id={router.query.params[1]} onSave={refresh}/>}
      </Dialog>
    </>
  );
};

PageRegistryCustomVariables.getLayout = function getLayout(page: ReactElement) {
  return (
    <Layout>
      {page}
    </Layout>
  );
};
export default PageRegistryCustomVariables;
