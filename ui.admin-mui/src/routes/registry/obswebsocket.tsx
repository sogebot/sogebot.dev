import { FilteringState, IntegratedFiltering, IntegratedSelection, IntegratedSorting, SelectionState, SortingState } from '@devexpress/dx-react-grid';
import { Grid as DataGrid, Table, TableColumnVisibility, TableHeaderRow, TableSelection } from '@devexpress/dx-react-grid-material-ui';
import { OBSWebsocket } from '@entity/obswebsocket';
import ContentPasteIcon from '@mui/icons-material/ContentPasteTwoTone';
import { CircularProgress, Dialog, Grid, IconButton, Stack, Typography } from '@mui/material';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import SimpleBar from 'simplebar-react';

import { ButtonsDeleteBulk } from '../../components/Buttons/DeleteBulk';
import { DeleteButton } from '../../components/Buttons/DeleteButton';
import EditButton from '../../components/Buttons/EditButton';
import LinkButton from '../../components/Buttons/LinkButton';
import { OBSWebsocketEdit } from '../../components/Form/OBSWebsocketEdit';
import getAccessToken from '../../getAccessToken';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { ColumnMakerProps, useColumnMaker } from '../../hooks/useColumnMaker';
import { useFilter } from '../../hooks/useFilter';
import { useScope } from '../../hooks/useScope';
import { setBulkCount } from '../../store/appbarSlice';

const PageRegistryCustomVariables = () => {
  const scope = useScope('integrations');
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { type, id } = useParams();
  const { enqueueSnackbar } = useSnackbar();

  const [ command ] = useState('!obsws run');
  const [ items, setItems ] = useState<OBSWebsocket[]>([]);

  const [ loading, setLoading ] = useState(true);
  const { bulkCount } = useAppSelector(state => state.appbar);
  const [ selection, setSelection ] = useState<(string|number)[]>([]);

  const refresh = useCallback(async () => {
    await Promise.all([
      new Promise<void>(resolve => {
        axios.get('/api/integrations/obswebsocket', {
          headers: {
            Authorization: `Bearer ${getAccessToken()}`
          }
        }).then(({ data }) => {
          setItems(data.data);
          resolve();
        });
      }),
    ]);
    setLoading(false);
  }, []);

  const copy = useCallback((idc: string) => {
    navigator.clipboard.writeText(`${command} ${idc}`);
    enqueueSnackbar(<div>Command&nbsp;<strong>{command} {idc}</strong>&nbsp;copied to clipboard.</div>);
  }, [ command, enqueueSnackbar ]);

  const columnTpl: ColumnMakerProps<OBSWebsocket & { command: string }> = [
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
  ];

  if (!scope.manage) {
    columnTpl.splice(columnTpl.length - 1, 1);
  }

  const { useFilterSetup, columns, tableColumnExtensions, sortingTableExtensions, defaultHiddenColumnNames, filteringColumnExtensions } = useColumnMaker<OBSWebsocket & { command: string }>(columnTpl);

  const { element: filterElement, filters } = useFilter(useFilterSetup);

  const deleteItem = useCallback((item: OBSWebsocket) => {
    return new Promise((resolve, reject) => {
      axios.delete(`/api/integrations/obswebsocket/${item.id}`, {
        headers: {
          Authorization: `Bearer ${getAccessToken()}`
        }
      }).then(() => {
        enqueueSnackbar(`Custom variable ${item.name} (${item.id}) deleted successfully.`, { variant: 'success' });
        refresh();
        resolve(true);
      }).catch(reject);
    });
  }, [ enqueueSnackbar, refresh ]);

  useEffect(() => {
    refresh();
  }, [location.pathname, refresh]);

  useEffect(() => {
    dispatch(setBulkCount(selection.length));
  }, [selection, dispatch]);

  const bulkDelete =  useCallback(async () => {
    for (const selected of selection) {
      const item = items.find(o => o.id === selected);
      if (item) {
        await new Promise<void>((resolve) => {
          axios.delete(`/api/integrations/obswebsocket/${item.id}`, {
            headers: {
              Authorization: `Bearer ${getAccessToken()}`
            }
          }).then(() => resolve());
        });
      }
    }
    setItems(i => i.filter(item => !selection.includes(item.id!)));
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
        {scope.manage && <>
          <Grid item>
            <LinkButton variant="contained" href='/registry/obswebsocket/create/'>Create new OBSWebsocket script</LinkButton>
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
            {scope.manage && <TableSelection showSelectAll/>}
          </DataGrid>
        </SimpleBar>}

      <Dialog
        open={open}
        fullWidth
        maxWidth='md'>
        {open && <OBSWebsocketEdit id={id} onSave={refresh}/>}
      </Dialog>
    </>
  );
};
export default PageRegistryCustomVariables;
