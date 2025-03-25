import { FilteringState, IntegratedFiltering, IntegratedSelection, IntegratedSorting, SelectionState, SortingState } from '@devexpress/dx-react-grid';
import { Grid as DataGrid, Table, TableColumnVisibility, TableHeaderRow, TableSelection } from '@devexpress/dx-react-grid-material-ui';
import { Rank } from '@entity/rank';
import { Button, CircularProgress, Dialog, Grid, Stack, Typography } from '@mui/material';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import SimpleBar from 'simplebar-react';

import { ButtonsDeleteBulk } from '../../components/Buttons/DeleteBulk';
import { DeleteButton } from '../../components/Buttons/DeleteButton';
import EditButton from '../../components/Buttons/EditButton';
import { DisabledAlert } from '../../components/DisabledAlert';
import { RankEdit } from '../../components/Form/RankEdit';
import getAccessToken from '../../getAccessToken';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { ColumnMakerProps, useColumnMaker } from '../../hooks/useColumnMaker';
import { useFilter } from '../../hooks/useFilter';
import { useScope } from '../../hooks/useScope';
import { setBulkCount } from '../../store/appbarSlice';

const PageCommandsKeywords = () => {
  const scope = useScope('ranks');

  const dispatch = useAppDispatch();
  const location = useLocation();
  const { type, id } = useParams();
  const { enqueueSnackbar } = useSnackbar();

  const [ items, setItems ] = useState<Rank[]>([]);
  const [ loading, setLoading ] = useState(true);
  const { bulkCount } = useAppSelector(state => state.appbar);
  const [ selection, setSelection ] = useState<(string|number)[]>([]);

  const columnsTpl: ColumnMakerProps<Rank> = [
    {
      columnName: 'value', filtering: { type: 'number' }, table: { align: 'right' }, translationKey: 'responses.variable.value',
    },{
      columnName: 'rank', filtering: { type: 'string' },
    },{
      columnName: 'type',
      filtering:  {
        type:    'list',
        options: { listValues: ['Watch time', 'Subscriber months'].sort() },
      },
      column: { getCellValue: (row) => row.type === 'viewer' ? 'Watch time' : 'Subcriber months' },
    },
  ];

  if (scope.manage) {
    columnsTpl.push({
      columnName: 'actions',
      table: { width: 130 },
      sorting: { sortingEnabled: false },
      translation: ' ',
      column: {
        getCellValue: (row) => [
          <Stack direction="row" key="row">
            <EditButton href={'/manage/ranks/edit/' + row.id}/>
            <DeleteButton key='delete' onDelete={() => deleteItem(row)} />
          </Stack>,
        ],
      },
    });
  }

  const { useFilterSetup, columns, tableColumnExtensions, sortingTableExtensions, defaultHiddenColumnNames, filteringColumnExtensions } = useColumnMaker<Rank>(columnsTpl);

  const deleteItem = useCallback((item: Rank) => {
    axios.delete(`/api/systems/ranks/${item.id}`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
      .finally(() => {
        enqueueSnackbar(`Rank ${item.value} deleted successfully.`, { variant: 'success' });
        refresh();
      });
  }, [ enqueueSnackbar ]);

  const { element: filterElement, filters } = useFilter(useFilterSetup);

  useEffect(() => {
    refresh().then(() => setLoading(false));
  }, [location.pathname]);

  const refresh = async () => {
    await Promise.all([
      new Promise<void>(resolve => {
        axios.get(`/api/systems/ranks`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
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
          axios.delete(`/api/systems/ranks/${item.id}`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
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
        <DisabledAlert system='ranks'/>
        {scope.manage && <>
          <Grid item>
            <Button sx={{ width: 200 }} variant="contained" href='/manage/ranks/create/'>Create new rank</Button>
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
                columnName: 'value', direction: 'asc',
              }, {
                columnName: 'type', direction: 'asc',
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
        {open && <RankEdit items={items}/>}
      </Dialog>
    </>
  );
};

export default PageCommandsKeywords;
