import { CustomPaging, FilteringState, IntegratedSelection, PagingState, RowDetailState, SelectionState, Sorting, SortingState } from '@devexpress/dx-react-grid';
import { Grid as DataGrid, PagingPanel, Table, TableColumnVisibility, TableHeaderRow, TableRowDetail, TableSelection } from '@devexpress/dx-react-grid-material-ui';
import type { UserInterface } from '@entity/user';
import { Backdrop, CircularProgress, Grid, Stack, Typography } from '@mui/material';
import Chip from '@mui/material/Chip';
import { grey } from '@mui/material/colors';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import SimpleBar from 'simplebar-react';
import { v4 } from 'uuid';

import { ConfirmButton } from '../../components/Buttons/ConfirmButton';
import { ButtonsDeleteBulk } from '../../components/Buttons/DeleteBulk';
import { DeleteButton } from '../../components/Buttons/DeleteButton';
import { BoolTypeProvider } from '../../components/Table/BoolTypeProvider';
import { RowDetail } from '../../components/Table/Viewers/RowDetail';
import getAccessToken from '../../getAccessToken';
import { dayjs } from '../../helpers/dayjsHelper';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { useColumnMaker } from '../../hooks/useColumnMaker';
import { useFilter } from '../../hooks/useFilter';
import { setBulkCount } from '../../store/appbarSlice';

const PageManageViewers = () => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { enqueueSnackbar } = useSnackbar();
  const { configuration } = useAppSelector((state: any) => state.loader);
  const { userId } = useParams();

  React.useEffect(() => {
    if (userId) {
      setFilters([{
        columnName: 'userId',
        operation:  'equal',
        value:      Number(userId),
      }]);
      console.log({ userId });
    }
  }, [ userId ]);

  const [ items, setItems ] = useState<UserInterface[]>([]);
  const [ loading, setLoading ] = useState(true);
  const { bulkCount } = useAppSelector((state: any) => state.appbar);
  const [ selection, setSelection ] = useState<(string|number)[]>([]);

  const [pageSize, setPageSize] = useState(20);
  const [pageSizes] = useState([10, 20, 50, 100]);

  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const [sorting, setSorting] = useState<Sorting[]>([{
    columnName: 'userName', direction: 'asc',
  }]);

  type extension = {
    userIdAndName: string;
    level:         number;
    watchedTime:   number;
    sumBits:       number;
    sumTips:       number;
  };
  const { useFilterSetup, columns, tableColumnExtensions, sortingTableExtensions, defaultHiddenColumnNames } = useColumnMaker<UserInterface & extension>([
    {
      columnName: 'userName', filtering: { type: 'string' }, hidden: true, translationKey: 'username',
    },
    {
      columnName: 'userId', filtering: { type: 'string' }, hidden: true, translation: 'User ID',
    },
    {
      columnName:     'userIdAndName',
      translationKey: 'username',
      column:         {
        getCellValue: (row) => {
          return (
            <>
              <Typography>{row.userName}</Typography>
              <Typography variant="caption" color={grey[500]}>{row.userId}</Typography>
              <div>
                {!!row.isSubscriber && <Chip label="subscriber" color="success" size="small" variant="outlined"/>}
                {!!row.isVIP && <Chip label="VIP" color="success" size="small" variant="outlined" />}
              </div>
            </>);
        },
      },
    },
    {
      columnName: 'isSubscriber', filtering: { type: 'boolean' }, hidden: true, translation: 'Subscriber',
    },
    {
      columnName: 'isVIP', filtering: { type: 'boolean' }, hidden: true, translation: 'VIP',
    },
    {
      columnName: 'messages', filtering: { type: 'number' }, table: { align: 'right' },
    },
    {
      columnName: 'level', table: { align: 'right' },
    },
    {
      columnName: 'points', filtering: { type: 'number' }, table: { align: 'right' },
    },
    {
      columnName:     'watchedTime',
      translationKey: 'watched-time',
      filtering:      { type: 'number' },
      table:          { align: 'right' },
      column:         {
        getCellValue: (row) => {
          return (
            <span>{(row.watchedTime / 1000 / 60 / 60).toFixed(2)}h</span>
          );
        },
      },
    },
    {
      columnName:     'seenAt',
      translationKey: 'last-seen',
      column:         {
        getCellValue: (row) => {
          return (
            row.seenAt && <span>{ dayjs(row.seenAt).format('LL') } { dayjs(row.seenAt).format('LTS') }</span>
          );
        },
      },
    },
    {
      columnName:     'subscribedAt',
      translationKey: 'subscribed-since',
      column:         {
        getCellValue: (row) => {
          return (
            row.subscribedAt && <span>{ dayjs(row.subscribedAt).format('LL') } { dayjs(row.subscribedAt).format('LTS') }</span>
          );
        },
      },
    },
    {
      columnName:     'sumTips',
      table:          { align: 'right' },
      translationKey: 'tips',
      column:         {
        getCellValue: (row) => {
          return (
            <span>{ Intl.NumberFormat(configuration.lang, {
              style: 'currency', currency: configuration.currency,
            }).format(row.sumTips || 0) }</span>
          );
        },
      },
    },
    {
      columnName: 'sumBits', table: { align: 'right' }, translationKey: 'bits',
    },
    {
      columnName: 'giftedSubscribes', filtering: { type: 'number' }, table: { align: 'right' }, translationKey: 'subgifts',
    },
    {
      columnName: 'subscribeCumulativeMonths', filtering: { type: 'number' }, table: { align: 'right' }, translationKey: 'subCumulativeMonths',
    },
    {
      columnName: 'subscribeStreak', filtering: { type: 'number' }, table: { align: 'right' }, translationKey: 'subStreak',
    },
    {
      columnName:  'actions',
      table:       { width: 130 },
      sorting:     { sortingEnabled: false },
      translation: ' ',
      column:      {
        getCellValue: (row) => [
          <Stack direction="row" key="row">
            <DeleteButton key='delete' onDelete={() => deleteItem(row)} />
          </Stack>,
        ],
      },
    },
  ]);

  const { element: filterElement, filters, setFilters } = useFilter<UserInterface>(useFilterSetup);

  const refresh = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      new Promise<void>(resolve => {
        const sortTable = sorting.length > 0 ? {
          orderBy: sorting[0].columnName, sortOrder: sorting[0].direction.toUpperCase() as 'ASC' | 'DESC',
        } : undefined;

        if (sortTable && sortTable.orderBy === 'userIdAndName') {
          sortTable.orderBy = 'userName';
        }

        axios.get(`/api/core/users?state=${v4()}&order=${JSON.stringify(sortTable)}&page=${currentPage}&perPage=${pageSize}&filter=${JSON.stringify(filters)}`, {
          headers: {
            Authorization: `Bearer ${getAccessToken()}`
          }
        }).then(({ data }) => {
          setTotalCount(data.data.count);
          setItems(data.data.viewers);
          resolve();
        });
      }),
    ]);
    setLoading(false);
  }, [pageSize, currentPage, sorting, filters]);

  const deleteItem = useCallback((item: UserInterface) => {
    axios.delete(`/api/core/users/${item.userId}`, { headers: { 'Authorization': `Bearer ${getAccessToken()}` } }).finally(() => {
      enqueueSnackbar(`User ${item.userName}#${item.userId} deleted successfully.`, { variant: 'success' });
      refresh();
    });
  }, [ enqueueSnackbar, refresh ]);

  useEffect(() => {
    refresh().then(() => setLoading(false));
  }, [location.pathname, refresh]);

  useEffect(() => {
    refresh();
  }, [sorting, filters, currentPage, refresh]);

  useEffect(() => {
    setCurrentPage(0);
  }, [sorting, filters]);

  useEffect(() => {
    dispatch(setBulkCount(selection.length));
  }, [selection, dispatch]);

  const bulkDelete =  useCallback(async () => {
    for (const selected of selection) {
      const item = items.find(o => o.userId === selected);
      if (item) {
        await axios.delete(`/api/core/users/${item.userId}`, { headers: { 'Authorization': `Bearer ${getAccessToken()}` } });
      }
    }
    setItems(i => i.filter(item => !selection.includes(item.userId)));
    enqueueSnackbar(`Bulk operation deleted items.`, { variant: 'success' });
    setSelection([]);
  }, [ selection, enqueueSnackbar, items ]);

  const resetPoints = () => {
    axios.post('/core/users?_action=resetPointsAll', undefined, {
      headers: {
        Authorization: `Bearer ${getAccessToken()}`
      }
    }).then(() => {
      refresh();
    });
  };

  const resetWatchedTime = () => {
    axios.post('/core/users?_action=resetWatchedTimeAll', undefined, {
      headers: {
        Authorization: `Bearer ${getAccessToken()}`
      }
    }).then(() => {
      refresh();
    });
  };

  const resetMessages = () => {
    axios.post('/core/users?_action=resetMessagesAll', undefined, {
      headers: {
        Authorization: `Bearer ${getAccessToken()}`
      }
    }).then(() => {
      refresh();
    });
  };

  const resetBits = () => {
    axios.post('/core/users?_action=resetBitsAll', undefined, {
      headers: {
        Authorization: `Bearer ${getAccessToken()}`
      }
    }).then(() => {
      refresh();
    });
  };

  const resetTips = () => {
    axios.post('/core/users?_action=resetTipsAll', undefined, {
      headers: {
        Authorization: `Bearer ${getAccessToken()}`
      }
    }).then(() => {
      refresh();
    });
  };

  const resetSubgifts = () => {
    axios.post('/core/users?_action=resetSubgiftsAll', undefined, {
      headers: {
        Authorization: `Bearer ${getAccessToken()}`
      }
    }).then(() => {
      refresh();
    });
  };

  return (
    <>
      <Grid container sx={{ pb: 0.7 }} spacing={1} alignItems='center'>
        <Grid item>
          <ConfirmButton handleOk={() => resetTips()}>Reset Tips</ConfirmButton>
          <ConfirmButton handleOk={() => resetBits()}>Reset Bits</ConfirmButton>
          <ConfirmButton handleOk={() => resetSubgifts()}>Reset subgifts</ConfirmButton>
          <ConfirmButton handleOk={() => resetPoints()}>Reset Points</ConfirmButton>
          <ConfirmButton handleOk={() => resetWatchedTime()}>Reset Watched Time</ConfirmButton>
          <ConfirmButton handleOk={() => resetMessages()}>Reset Messages</ConfirmButton>
        </Grid>
        <Grid item>
          <ButtonsDeleteBulk disabled={bulkCount === 0} onDelete={bulkDelete}/>
        </Grid>
        <Grid item>{filterElement}</Grid>
        <Grid item>
          {bulkCount > 0 && <Typography variant="button" px={2}>{ bulkCount } selected</Typography>}
        </Grid>
      </Grid>

      <Backdrop open={loading} >
        <CircularProgress color="inherit"/>
      </Backdrop>

      <SimpleBar style={{ maxHeight: 'calc(100vh - 116px)', paddingBottom: '48px' }} autoHide={false}>
        <DataGrid
          rows={items}
          columns={columns}
          getRowId={row => row.userId}
        >
          <BoolTypeProvider
            for={['tickOffline', 'isEnabled']}
          />

          <RowDetailState/>
          <SortingState
            sorting={sorting}
            onSortingChange={setSorting}
            columnExtensions={sortingTableExtensions}
          />

          <FilteringState filters={filters}/>
          <SelectionState
            selection={selection}
            onSelectionChange={setSelection}
          />

          <IntegratedSelection/>

          <PagingState
            currentPage={currentPage}
            onCurrentPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            pageSize={pageSize}
          />
          <CustomPaging
            totalCount={totalCount}
          />

          <Table columnExtensions={tableColumnExtensions}/>

          <TableHeaderRow showSortingControls/>
          <TableRowDetail
            contentComponent={RowDetail}
          />
          <TableColumnVisibility
            defaultHiddenColumnNames={defaultHiddenColumnNames}
          />
          <TableSelection showSelectAll/>
          <PagingPanel
            pageSizes={pageSizes}
          />
        </DataGrid>
      </SimpleBar>
    </>
  );
};
export default PageManageViewers;
