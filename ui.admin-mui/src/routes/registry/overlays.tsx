import { Buffer } from 'buffer';

import { FilteringState, IntegratedFiltering, IntegratedSelection, IntegratedSorting, SelectionState, SortingState } from '@devexpress/dx-react-grid';
import { Grid as DataGrid, Table, TableColumnVisibility, TableHeaderRow, TableSelection } from '@devexpress/dx-react-grid-material-ui';
import { ContentCopyTwoTone, ContentPasteTwoTone, LinkTwoTone } from '@mui/icons-material';
import { CircularProgress, Dialog, Grid, IconButton, Stack, Typography } from '@mui/material';
import { Overlay } from '@sogebot/backend/dest/database/entity/overlay';
import { useSnackbar } from 'notistack';
import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useLocalstorageState } from 'rooks';
import SimpleBar from 'simplebar-react';

import { ButtonsDeleteBulk } from '../../components/Buttons/DeleteBulk';
import { DeleteButton } from '../../components/Buttons/DeleteButton';
import EditButton from '../../components/Buttons/EditButton';
import LinkButton from '../../components/Buttons/LinkButton';
import { OverlayEdit } from '../../components/Form/OverlayEdit';
import { cloneIncrementName } from '../../helpers/cloneIncrementName';
import { getSocket } from '../../helpers/socket';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { useColumnMaker } from '../../hooks/useColumnMaker';
import { useFilter } from '../../hooks/useFilter';
import { useTranslation } from '../../hooks/useTranslation';
import { setBulkCount } from '../../store/appbarSlice';

const generateLinkId = (server: string, id: string) => {
  return Buffer.from(JSON.stringify({
    server, id,
  })).toString('base64');
};

const PageRegistryOverlays = () => {
  const dispatch = useAppDispatch();
  const [ server ] = useLocalstorageState('server', 'https://demobot.sogebot.xyz');
  const location = useLocation();
  const { type, id } = useParams();
  const { enqueueSnackbar } = useSnackbar();
  const { translate } = useTranslation();

  const [ items, setItems ] = useState<Overlay[]>([]);
  const [ cloningItems, setCloningItems ] = useState<string[]>([]);

  const [ loading, setLoading ] = useState(true);
  const { bulkCount } = useAppSelector(state => state.appbar);
  const [ selection, setSelection ] = useState<(number|string)[]>([]);

  const refresh = useCallback(async () => {
    await Promise.all([
      new Promise<void>(resolve => {
        getSocket('/registries/overlays').emit('generic::getAll', (err, data) => {
          if (err) {
            console.error(err);
          } else {
            setItems(data);
            resolve();
          }
        });
      }),
    ]);
  }, []);

  const { useFilterSetup, columns, tableColumnExtensions, sortingTableExtensions, defaultHiddenColumnNames, filteringColumnExtensions } = useColumnMaker<Overlay>([
    {
      columnName: 'name',
      filtering:  { type: 'string' },
    },
    {
      columnName:  'items',
      translation: `# ${translate('menu.overlays')}`,
      column:      { getCellValue: row => row.items.length },
      table:       { align: 'center' },
    },
    {
      columnName:  'actions',
      table:       { width: 5.5 * 43 },
      sorting:     { sortingEnabled: false },
      translation: ' ',
      column:      {
        getCellValue: (row) => [
          <Stack direction="row" key="row">
            <EditButton
              href={'/registry/overlays/edit/' + row.id}
            />
            <IconButton
              LinkComponent={'a'}
              href={`${window.location.origin}/overlays/${generateLinkId(server, row.id)}`} target="_blank">
              <LinkTwoTone/>
            </IconButton>
            {cloningItems.includes(row.id)
              ? <CircularProgress size={24}/>
              : <IconButton onClick={() => clone(row)}><ContentCopyTwoTone/></IconButton>
            }
            <IconButton onClick={() => copy(`${window.location.origin}/overlays/${generateLinkId(server, row.id)}`)}><ContentPasteTwoTone/></IconButton>
            <DeleteButton key='delete' onDelete={() => deleteItem(row)} />
          </Stack>,
        ],
      },
    },
  ]);

  const { element: filterElement, filters } = useFilter(useFilterSetup);

  const deleteItem = useCallback((item: Overlay) => {
    getSocket('/registries/overlays').emit('generic::deleteById', item.id, (err) => {
      if (err) {
        console.error(err);
      } else {
        enqueueSnackbar(`Overlay ${item.name} deleted successfully.`, { variant: 'success' });
        refresh();
      }
    });
  }, [ enqueueSnackbar, refresh ]);

  useEffect(() => {
    refresh().then(() => setLoading(false));
  }, [location.pathname, refresh]);

  useEffect(() => {
    dispatch(setBulkCount(selection.length));
  }, [selection, dispatch]);

  const bulkDelete =  useCallback(async () => {
    for (const selected of selection) {
      const item = items.find(o => o.id === selected);
      if (item) {
        await new Promise<void>((resolve) => {
          getSocket('/registries/overlays').emit('generic::deleteById', item.id, () => resolve());
        });
      }
    }
    setItems(i => i.filter(item => !selection.includes(item.id!)));
    enqueueSnackbar(`Bulk operation deleted items.`, { variant: 'success' });
    setSelection([]);
  }, [ selection, enqueueSnackbar, items ]);

  const copy = useCallback((link: string) => {
    navigator.clipboard.writeText(`${link}`);
    enqueueSnackbar(<div>Overlay link copied to clipboard.</div>);
  }, [ enqueueSnackbar, server ]);

  const clone = useCallback((item: Overlay) => {
    const clonedItem = {
      ...item,
      name: cloneIncrementName(item.name, items.map(o => o.name)),
      id:   crypto.randomUUID(),
    };

    setCloningItems(it => [...it, item.id]);

    getSocket('/registries/overlays').emit('generic::save', clonedItem, (err, data) => {
      setCloningItems(it => it.filter(o => o !== item.id));
      if (err || !data) {
        enqueueSnackbar('Something went wrong during save. Check Chrome logs for more errors.', { variant: 'error' });
        return console.error(err);
      }
      enqueueSnackbar(<div>Overlay <strong>{item.name}</strong> was successfully cloned into <strong>{clonedItem.name}</strong>.</div>, { variant: 'success' });
      refresh();
    });
  }, [ enqueueSnackbar, refresh, items ]);

  const open = React.useMemo(() => !!(type
    && (
      (type === 'edit' && id)
      || type === 'create'
    )
  ), [type, id]);

  return (
    <>
      <Grid container sx={{ pb: 0.7 }} spacing={1} alignItems='center'>
        <Grid item>
          <LinkButton variant="contained" href='/registry/overlays/create/'>Create new overlay</LinkButton>
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
        : <SimpleBar style={{ maxHeight: 'calc(100vh - 116px)' }} autoHide={false}>
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
        </SimpleBar>}

      <Dialog
        open={open}
        fullScreen>
        {open && <OverlayEdit/>}
      </Dialog>
    </>
  );
};
export default PageRegistryOverlays;
