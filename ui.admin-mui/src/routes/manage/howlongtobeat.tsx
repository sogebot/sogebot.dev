import { FilteringState, IntegratedFiltering, IntegratedSelection, IntegratedSorting, RowDetailState, SelectionState, Sorting, SortingState } from '@devexpress/dx-react-grid';
import { Grid as DataGrid, Table, TableColumnVisibility, TableHeaderRow, TableRowDetail, TableSelection } from '@devexpress/dx-react-grid-material-ui';
import { Button, CircularProgress, Dialog, Grid, Stack, Typography } from '@mui/material';
import { HowLongToBeatGame } from '@sogebot/backend/dest/database/entity/howLongToBeatGame';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import SimpleBar from 'simplebar-react';

import { ButtonsDeleteBulk } from '../../components/Buttons/DeleteBulk';
import { DeleteButton } from '../../components/Buttons/DeleteButton';
import EditButton from '../../components/Buttons/EditButton';
import { DisabledAlert } from '../../components/DisabledAlert';
import { HLTBEdit } from '../../components/Form/HLTBEdit';
import { DateTypeProvider } from '../../components/Table/DateTypeProvider';
import { RowDetail } from '../../components/Table/HowLongToBeat/RowDetail';
import getAccessToken from '../../getAccessToken';
import { timestampToObject } from '../../helpers/getTime';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { ColumnMakerProps, useColumnMaker } from '../../hooks/useColumnMaker';
import { useFilter } from '../../hooks/useFilter';
import { useScope } from '../../hooks/useScope';
import { useTranslation } from '../../hooks/useTranslation';
import { setBulkCount } from '../../store/appbarSlice';
import { setOffset, setToggle } from '../../store/hltbSlice';

const PageManageHLTB = () => {
  const scope = useScope('howlongtobeat');
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { type, id } = useParams();
  const { enqueueSnackbar } = useSnackbar();
  const { translate } = useTranslation();

  const [ items, setItems ] = useState<(HowLongToBeatGame & { thumbnail?: string | null })[]>([]);
  const [ loading, setLoading ] = useState(true);
  const { bulkCount } = useAppSelector(state => state.appbar);
  const [ selection, setSelection ] = useState<(string|number)[]>([]);

  const toggle = useAppSelector(state => state.hltb.toggle);
  const offset = useAppSelector(state => state.hltb.offset);

  const timeToReadable = useCallback((data: { days: number; hours: number; minutes: number; seconds: number }) => {
    const output = [];
    if (data.days) {
      output.push(`${data.days}d`);
    }
    if (data.hours) {
      output.push(`${data.hours}h`);
    }
    if (data.minutes) {
      output.push(`${data.minutes}m`);
    }
    if (data.seconds || output.length === 0) {
      output.push(`${data.seconds}s`);
    }
    return output.join(' ');
  }, []);

  const getStreamsTimestamp = useCallback((item: HowLongToBeatGame, itemType: 'extra' | 'main' | 'completionist' | 'all') => {
    return item.streams
      .filter(o => (itemType === 'all' || (itemType === 'main' && o.isMainCounted) || (itemType === 'completionist' && o.isCompletionistCounted) || (itemType === 'extra' && o.isExtraCounted)))
      .reduce((a, b) => a + b.timestamp, 0);
  }, []);

  const getStreamsOffset = useCallback((item: HowLongToBeatGame, itemType: 'extra' | 'main' | 'completionist' | 'all') => {
    return item.streams
      .filter(o => (itemType === 'all' || (itemType === 'main' && o.isMainCounted) || (itemType === 'completionist' && o.isCompletionistCounted) || (itemType === 'extra' && o.isExtraCounted)))
      .reduce((a, b) => a + b.offset, 0);
  }, []);

  const minutesFormatter = useCallback((value: number) => {
    return (value < 0 ? '- ' : '+ ') + timeToReadable(timestampToObject(Math.abs(value)));
  }, [timeToReadable]);

  useEffect(() => {
    if (offset) {
      const item = items.find(o => o.id === offset.id);
      if (item) {
        const stream = item.streams.find(o => o.createdAt === offset.createdAt);
        if (stream) {
          stream.offset = offset.value;

          axios.post(`/api/systems/howlongtobeat/${item.id}`, item, { headers: { authorization: `Bearer ${getAccessToken()}` } });
          setItems(i => {
            const it = i.filter(o => o.id !== offset.id);
            it.push(item);
            return it;
          });
        }
      }
      dispatch(setOffset(null));
    }
  }, [offset, dispatch, items]);

  useEffect(() => {
    if (toggle) {
      const item = items.find(o => o.id === toggle.id);
      if (item) {
        const stream = item.streams.find(o => o.createdAt === toggle.createdAt);
        if (stream) {
          if (toggle.type === 'main') {
            stream.isMainCounted = !stream.isMainCounted;
          } else if (toggle.type === 'extra') {
            stream.isExtraCounted = !stream.isExtraCounted;
          } else if (toggle.type === 'completionist') {
            stream.isCompletionistCounted = !stream.isCompletionistCounted;
          }

          axios.post(`/api/systems/howlongtobeat/${item.id}`, item, { headers: { authorization: `Bearer ${getAccessToken()}` } });
          setItems(i => {
            const it = i.filter(o => o.id !== toggle.id);
            it.push(item);
            return it;
          });
        }
      }
      dispatch(setToggle(null));
    }
  }, [toggle, dispatch, items]);

  const [sorting, setSorting] = useState<Sorting[]>([{
    columnName: 'updatedAt', direction: 'desc',
  }]);

  type extension = {
    thumbnail:     string;
    main:          string;
    extra:         string;
    completionist: string;
    time:          string;
  };

  const getThumbnailURL = (item: typeof items[number]) => {
    return item.thumbnail?.replace('{width}', '46').replace('{height}', '60') || `https://static-cdn.jtvnw.net/ttv-boxart/./${encodeURI(item.game)}-46x60.jpg`;
  };

  const deleteItem = useCallback((item: HowLongToBeatGame) => {
    axios.delete(`/api/systems/howlongtobeat/${item.id}`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
      .finally(() => {
        setItems(i => i.filter(o => o.id !== item.id));
        enqueueSnackbar(`Game ${item.game} deleted.`, { variant: 'success' });
      });
  }, [ enqueueSnackbar ]);

  const columnTpl: ColumnMakerProps<HowLongToBeatGame & extension> = [{
    columnName:  'thumbnail',
    translation: ' ',
    table:       {
      align: 'center', width: '62',
    },
    sorting: { sortingEnabled: false },
    column:  { getCellValue: (row) => <img width={46} height={60} alt={row.game} key={row.game} src={getThumbnailURL(row)}/> },
  }, {
    columnName:  'game',
    translation: translate('systems.howlongtobeat.game'),
    filtering:   { type: 'string' },
  }, {
    columnName:  'startedAt',
    translation: translate('systems.howlongtobeat.startedAt'),
    table:       { align: 'right' },
  }, {
    columnName:  'updatedAt',
    translation: translate('systems.howlongtobeat.updatedAt'),
    table:       { align: 'right' },
  }, {
    columnName:  'main',
    translation: translate('systems.howlongtobeat.main'),
    table:       { align: 'right' },
    sorting:     { sortingEnabled: false },
    column:      {
      getCellValue: (row) => <Typography>
        { timeToReadable(timestampToObject(Math.max(getStreamsTimestamp(row, 'main') + +row.offset + getStreamsOffset(row, 'main'), 0))) } {row.gameplayMain > 0 && <span>/ { timeToReadable(timestampToObject(row.gameplayMain * 3600000)) }</span>}
      </Typography>,
    },
  }, {
    columnName:  'extra',
    translation: translate('systems.howlongtobeat.extra'),
    table:       { align: 'right' },
    sorting:     { sortingEnabled: false },
    column:      {
      getCellValue: (row) => <Typography>
        { timeToReadable(timestampToObject(Math.max(getStreamsTimestamp(row, 'extra') + +row.offset + getStreamsOffset(row, 'extra'), 0))) } {row.gameplayMainExtra > 0 && <span>/ { timeToReadable(timestampToObject(row.gameplayMainExtra * 3600000)) }</span>}
      </Typography>,
    },
  }, {
    columnName:  'completionist',
    translation: translate('systems.howlongtobeat.completionist'),
    table:       { align: 'right' },
    sorting:     { sortingEnabled: false },
    column:      {
      getCellValue: (row) => <Typography>
        { timeToReadable(timestampToObject(Math.max(getStreamsTimestamp(row, 'completionist') + +row.offset + getStreamsOffset(row, 'completionist'), 0))) } {row.gameplayCompletionist > 0 && <span>/ { timeToReadable(timestampToObject(row.gameplayCompletionist * 3600000)) }</span>}
      </Typography>,
    },
  }, {
    columnName:  'offset',
    translation: translate('systems.howlongtobeat.offset'),
    table:       { align: 'right' },
    sorting:     { sortingEnabled: false },
    column:      {
      getCellValue: (row) => <Typography>
        { minutesFormatter(row.offset) }
      </Typography>,
    },
  }, {
    columnName:  'time',
    translation: translate('systems.howlongtobeat.overallTime'),
    table:       { align: 'right' },
    sorting:     { sortingEnabled: false },
    column:      {
      getCellValue: (row) => <Typography>
        { timeToReadable(timestampToObject(Math.max(getStreamsTimestamp(row, 'all') + +row.offset + getStreamsOffset(row, 'all'), 0)))}
      </Typography>,
    },
  }];

  if (scope.manage) {
    columnTpl.push({
      columnName:  'actions',
      table:       { width: 130 },
      sorting:     { sortingEnabled: false },
      translation: ' ',
      column:      {
        getCellValue: (row) => [
          <Stack direction="row" key="row">
            <EditButton href={'/manage/howlongtobeat/edit/' + row.id}/>
            <DeleteButton key='delete' onDelete={() => deleteItem(row)} />
          </Stack>,
        ],
      },
    });
  }

  const { useFilterSetup, columns, tableColumnExtensions, sortingTableExtensions, defaultHiddenColumnNames, filteringColumnExtensions } = useColumnMaker<HowLongToBeatGame & extension>(columnTpl);
  const { element: filterElement, filters } = useFilter<HowLongToBeatGame>(useFilterSetup);

  useEffect(() => {
    refresh().then(() => setLoading(false));
  }, [location.pathname]);

  const refresh = async () => {
    await Promise.all([
      new Promise<void>(resolve => {
        axios.get(`/api/systems/howlongtobeat`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
          .then(({ data }) => {
            setItems(data.data);
            console.debug('Loaded', { data });
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
        await new Promise<void>(resolve => {
          axios.delete(`/api/systems/hltb/${item.id}`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
            .then(() => {
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
        <DisabledAlert system='howlongtobeat'/>
        {scope.manage && <>
          <Grid item>
            <Button sx={{ width: 250 }} variant="contained" href='/manage/howlongtobeat/create/'>Add new tracked game</Button>
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
            <DateTypeProvider
              for={['startedAt', 'updatedAt']}
            />

            <RowDetailState/>
            <SortingState
              sorting={sorting}
              onSortingChange={setSorting}
              columnExtensions={sortingTableExtensions}
            />
            <IntegratedSorting />

            <FilteringState filters={filters}/>
            <IntegratedFiltering columnExtensions={filteringColumnExtensions}/>

            <SelectionState
              selection={selection}
              onSelectionChange={setSelection}
            />

            {scope.manage && <IntegratedSelection/>}
            <Table columnExtensions={tableColumnExtensions}/>
            <TableHeaderRow showSortingControls/>
            <TableRowDetail
              contentComponent={RowDetail}
            />
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
        {open && <HLTBEdit items={items}/>}
      </Dialog>
    </>
  );
};
export default PageManageHLTB;
