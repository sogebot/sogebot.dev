import { FilteringState, IntegratedFiltering, IntegratedSelection, IntegratedSorting, SelectionState, SortingState } from '@devexpress/dx-react-grid';
import { Grid as DataGrid, Table, TableColumnVisibility, TableHeaderRow, TableSelection } from '@devexpress/dx-react-grid-material-ui';
import { Timer } from '@entity/timer';
import { CheckBoxTwoTone, DisabledByDefaultTwoTone, TimerOffTwoTone, TimerTwoTone } from '@mui/icons-material';
import { Button, CircularProgress, Dialog, Grid, Stack, Tooltip, Typography } from '@mui/material';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import SimpleBar from 'simplebar-react';

import { ButtonsDeleteBulk } from '../../components/Buttons/DeleteBulk';
import { DeleteButton } from '../../components/Buttons/DeleteButton';
import EditButton from '../../components/Buttons/EditButton';
import { DisabledAlert } from '../../components/DisabledAlert';
import { TimerEdit } from '../../components/Form/TimerEdit';
import { BoolTypeProvider } from '../../components/Table/BoolTypeProvider';
import getAccessToken from '../../getAccessToken';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { useColumnMaker } from '../../hooks/useColumnMaker';
import { useFilter } from '../../hooks/useFilter';
import { setBulkCount } from '../../store/appbarSlice';

const PageManageTimers = () => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { type, id } = useParams();
  const { enqueueSnackbar } = useSnackbar();

  const [ items, setItems ] = useState<Timer[]>([]);
  const [ loading, setLoading ] = useState(true);
  const { bulkCount } = useAppSelector(state => state.appbar);
  const [ selection, setSelection ] = useState<(string|number)[]>([]);

  const { useFilterSetup, columns, tableColumnExtensions, sortingTableExtensions, defaultHiddenColumnNames, filteringColumnExtensions } = useColumnMaker<Timer>([
    {
      columnName: 'name', filtering: { type: 'string' },
    },
    {
      columnName: 'isEnabled', filtering: { type: 'boolean' }, translationKey: 'enabled', table: { align: 'center' },
    },
    {
      columnName: 'tickOffline', filtering: { type: 'boolean' }, translationKey: 'timers.dialog.tickOffline', table: { align: 'center' },
    },
    {
      columnName: 'triggerEveryMessage', filtering: { type: 'number' }, translationKey: 'messages', table: { align: 'right' },
    },
    {
      columnName: 'triggerEverySecond', filtering: { type: 'number' }, translationKey: 'seconds', table: { align: 'right' },
    },
    {
      columnName:  'actions',
      table:       { width: 130 },
      sorting:     { sortingEnabled: false },
      translation: ' ',
      column:      {
        getCellValue: (row) => [
          <Stack direction="row" key="row">
            <EditButton href={'/manage/timers/edit/' + row.id}/>
            <DeleteButton key='delete' onDelete={() => deleteItem(row)} />
          </Stack>,
        ],
      },
    },
  ]);

  const { element: filterElement, filters } = useFilter<Timer>(useFilterSetup);

  const deleteItem = useCallback((item: Timer) => {
    axios.delete(`/api/systems/timers/${item.id}`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
      .finally(() => {
        enqueueSnackbar(`Timer ${item.name} deleted successfully.`, { variant: 'success' });
        refresh();
      });
  }, [ enqueueSnackbar ]);

  useEffect(() => {
    refresh().then(() => setLoading(false));
  }, [location.pathname]);

  const refresh = async () => {
    await Promise.all([
      new Promise<void>(resolve => {
        axios.get(`/api/systems/timers`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
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

  const bulkCanEnableCount = useMemo(() => {
    for (const itemId of selection) {
      const item = items.find(o => o.id === itemId);
      if (item && !item.tickOffline) {
        return true;
      }
    }
    return false;
  }, [ selection, items ]);

  const bulkCanDisableCount = useMemo(() => {
    for (const itemId of selection) {
      const item = items.find(o => o.id === itemId);
      if (item && item.tickOffline) {
        return true;
      }
    }
    return false;
  }, [ selection, items ]);

  const bulkCanEnable = useMemo(() => {
    for (const itemId of selection) {
      const item = items.find(o => o.id === itemId);
      if (item && !item.isEnabled) {
        return true;
      }
    }
    return false;
  }, [ selection, items ]);

  const bulkCanDisable = useMemo(() => {
    for (const itemId of selection) {
      const item = items.find(o => o.id === itemId);
      if (item && item.isEnabled) {
        return true;
      }
    }
    return false;
  }, [ selection, items ]);

  const bulkToggleAttribute = useCallback(async <T extends keyof Timer>(attribute: T, value: Timer[T]) => {
    for (const selected of selection) {
      const item = items.find(o => o.id === selected);
      if (item && item[attribute] !== value) {
        await new Promise<void>((resolve) => {
          item[attribute] = value;
          axios.post(`/api/systems/timers`, item, { headers: { authorization: `Bearer ${getAccessToken()}` } })
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

    if (attribute === 'isEnabled') {
      enqueueSnackbar(`Bulk operation set ${value ? 'enabled' : 'disabled'}.`, { variant: 'success' });
    } else if (attribute === 'tickOffline') {
      enqueueSnackbar(`Bulk operation set timer to ${value ? '' : 'not '} tick when stream is offline.`, { variant: 'success' });
    }

    refresh();
  }, [ enqueueSnackbar, items, selection ]);

  const bulkDelete =  useCallback(async () => {
    for (const selected of selection) {
      const item = items.find(o => o.id === selected);
      if (item) {
        await new Promise<void>((resolve) => {
          axios.delete(`/api/systems/timers/${item.id}`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
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
        <DisabledAlert system='timers'/>
        <Grid item>
          <Button variant="contained" href='/manage/timers/create/'>Create new timer</Button>
        </Grid>
        <Grid item>
          <Tooltip arrow title="Enable">
            <Button disabled={!bulkCanEnable} variant="contained" color="secondary" sx={{
              minWidth: '36px', width: '36px',
            }} onClick={() => bulkToggleAttribute('isEnabled', true)}><CheckBoxTwoTone/></Button>
          </Tooltip>
        </Grid>
        <Grid item>
          <Tooltip arrow title="Disable">
            <Button disabled={!bulkCanDisable} variant="contained" color="secondary" sx={{
              minWidth: '36px', width: '36px',
            }} onClick={() => bulkToggleAttribute('isEnabled', false)}><DisabledByDefaultTwoTone/></Button>
          </Tooltip>
        </Grid>
        <Grid item>
          <Tooltip arrow title="Enable countdown on offline stream">
            <Button disabled={!bulkCanEnableCount} variant="contained" color="secondary" sx={{
              minWidth: '36px', width: '36px',
            }} onClick={() => bulkToggleAttribute('tickOffline', true)}><TimerTwoTone/></Button>
          </Tooltip>
        </Grid>
        <Grid item>
          <Tooltip arrow title="Disable countdown on offline stream">
            <Button disabled={!bulkCanDisableCount} variant="contained" color="secondary" sx={{
              minWidth: '36px', width: '36px',
            }} onClick={() => bulkToggleAttribute('tickOffline', false)}><TimerOffTwoTone/></Button>
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
        : <SimpleBar style={{ maxHeight: 'calc(100vh - 116px)' }} autoHide={false}>
          <DataGrid
            rows={items}
            columns={columns}
            getRowId={row => row.id}
          >
            <BoolTypeProvider
              for={['tickOffline', 'isEnabled']}
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
        </SimpleBar>}

      <Dialog
        open={open}
        fullWidth
        maxWidth='md'>
        {open && <TimerEdit items={items} />}
      </Dialog>
    </>
  );
};

export default PageManageTimers;
