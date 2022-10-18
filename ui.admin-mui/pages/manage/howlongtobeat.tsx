import {
  FilteringState,
  IntegratedFiltering,
  IntegratedSelection,
  IntegratedSorting,
  RowDetailState,
  SelectionState,
  Sorting,
  SortingState,
} from '@devexpress/dx-react-grid';
import {
  Grid as DataGrid,
  TableColumnVisibility,
  TableHeaderRow,
  TableRowDetail,
  TableSelection,
  VirtualTable,
} from '@devexpress/dx-react-grid-material-ui';
import { CacheGamesInterface } from '@entity/cacheGames';
import { HowLongToBeatGame } from '@entity/howLongToBeatGame';
import EditIcon from '@mui/icons-material/Edit';
import {
  Button,
  CircularProgress,
  Grid,
  IconButton,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { timestampToObject } from '@sogebot/ui-helpers/getTime';
import axios from 'axios';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useSnackbar } from 'notistack';
import {
  ReactElement, useCallback, useEffect, useState,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { NextPageWithLayout } from '~/pages/_app';
import { ButtonsDeleteBulk } from '~/src/components/Buttons/DeleteBulk';
import { GridActionAliasMenu } from '~/src/components/GridAction/AliasMenu';
import { Layout } from '~/src/components/Layout/main';
import { HLTBEdit } from '~/src/components/RightDrawer/HLTBEdit';
import { DisabledAlert } from '~/src/components/System/DisabledAlert';
import { DateTypeProvider } from '~/src/components/Table/DateTypeProvider';
import { RowDetail } from '~/src/components/Table/HowLongToBeat/RowDetail';
import getAccessToken from '~/src/getAccessToken';
import { useColumnMaker } from '~/src/hooks/useColumnMaker';
import { useFilter } from '~/src/hooks/useFilter';
import { useTranslation } from '~/src/hooks/useTranslation';
import { setBulkCount } from '~/src/store/appbarSlice';
import { setOffset, setToggle } from '~/src/store/hltbSlice';

const PageManageHLTB: NextPageWithLayout = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const { translate } = useTranslation();

  const [ items, setItems ] = useState<HowLongToBeatGame[]>([]);
  const [ thumbnails, setThumbnails ] = useState<CacheGamesInterface[]>([]);
  const [ loading, setLoading ] = useState(true);
  const { bulkCount } = useSelector((state: any) => state.appbar);
  const [ selection, setSelection ] = useState<(string|number)[]>([]);

  const toggle = useSelector<any, null | { createdAt: string, type: 'main' | 'extra' | 'completionist', id: string}>(state => state.hltb.toggle);
  const offset = useSelector<any, null | { createdAt: string, value: number, id: string}>(state => state.hltb.offset);

  const timeToReadable = useCallback((data: { days: number; hours: number; minutes: number; seconds: number}) => {
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

  const getStreamsTimestamp = useCallback((item: HowLongToBeatGame, type: 'extra' | 'main' | 'completionist' | 'all') => {
    return item.streams
      .filter(o => (type === 'all' || (type === 'main' && o.isMainCounted) || (type === 'completionist' && o.isCompletionistCounted) || (type === 'extra' && o.isExtraCounted)))
      .reduce((a, b) => a + b.timestamp, 0);
  }, []);

  const getStreamsOffset = useCallback((item: HowLongToBeatGame, type: 'extra' | 'main' | 'completionist' | 'all') => {
    return item.streams
      .filter(o => (type === 'all' || (type === 'main' && o.isMainCounted) || (type === 'completionist' && o.isCompletionistCounted) || (type === 'extra' && o.isExtraCounted)))
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

          axios.post(`${localStorage.server}/api/systems/hltb/${item.id}`, item, { headers: { authorization: `Bearer ${localStorage.accessToken}` } });
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

          axios.post(`${localStorage.server}/api/systems/hltb/${item.id}`, item, { headers: { authorization: `Bearer ${localStorage.accessToken}` } });
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
    thumbnail: string;
    main: string;
    extra: string;
    completionist: string;
    time: string;
  };

  const getThumbnailURL = useCallback((game: string) => {
    return thumbnails.find(o => o.name === game)?.thumbnail?.replace('{width}', '46').replace('{height}', '60') || `https://static-cdn.jtvnw.net/ttv-boxart/./${encodeURI(game)}-46x60.jpg`;
  }, [thumbnails]);

  const deleteItem = useCallback((item: HowLongToBeatGame) => {
    axios.delete(`${localStorage.server}/api/systems/hltb/${item.id}`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
      .finally(() => {
        setItems(i => i.filter(o => o.id !== item.id));
        enqueueSnackbar(`Game ${item.game} deleted.`, { variant: 'success' });
      });
  }, [ enqueueSnackbar ]);

  const { useFilterSetup, columns, tableColumnExtensions, sortingTableExtensions, defaultHiddenColumnNames, filteringColumnExtensions } = useColumnMaker<HowLongToBeatGame & extension>([
    {
      columnName:  'thumbnail',
      translation: ' ',
      table:       {
        align: 'center', width: '62',
      },
      sorting: { sortingEnabled: false },
      column:  { getCellValue: (row) => <Image width={46} height={60} alt={row.game} key={row.game} src={getThumbnailURL(row.game)}/> },
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
          { timeToReadable(timestampToObject(Math.max(getStreamsTimestamp(row, 'extra') + +row.offset + getStreamsOffset(row, 'extra'), 0))) } {row.gameplayExtra > 0 && <span>/ { timeToReadable(timestampToObject(row.gameplayExtra * 3600000)) }</span>}
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
          { timeToReadable(timestampToObject(getStreamsTimestamp(row, 'all') + +row.offset + getStreamsOffset(row, 'all')))}
        </Typography>,
      },
    },
    {
      columnName:  'actions',
      table:       { width: 130 },
      sorting:     { sortingEnabled: false },
      translation: ' ',
      column:      {
        getCellValue: (row) => [
          <Stack direction="row" key="row">
            <IconButton
              size='small'
              onClick={() => {
                router.push('/manage/howlongtobeat/edit/' + row.id);
              }}><EditIcon/></IconButton>
            <GridActionAliasMenu key='delete' onDelete={() => deleteItem(row)} />
          </Stack>,
        ],
      },
    },
  ]);

  const { element: filterElement, filters } = useFilter<HowLongToBeatGame>(useFilterSetup);

  useEffect(() => {
    refresh().then(() => setLoading(false));
  }, [router]);

  const refresh = async () => {
    await Promise.all([
      new Promise<void>(resolve => {
        axios.get(`${localStorage.server}/api/systems/hltb`, { headers: { authorization: `Bearer ${localStorage.accessToken}` } })
          .then(({ data }) => {
            setItems(data.data);
            setThumbnails(data.thumbnails);
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
          axios.delete(`${localStorage.server}/api/systems/hltb/${item.id}`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
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

  const Cell = (props: any) => (
    <VirtualTable.Cell
      {...props}
      style={{
        padding: '0.5rem', height: '80px', margin: 0, lineHeight: 0,
      }}
    />
  );

  return (
    <>
      <Grid container sx={{ pb: 0.7 }} spacing={1} alignItems='center'>
        <DisabledAlert system='howlongtobeat'/>
        <Grid item>
          <Button sx={{ width: 250 }} variant="contained" onClick={() => {
            router.push('/manage/howlongtobeat/create/');
          }}>Add new tracked game</Button>
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

            <IntegratedSelection/>
            <VirtualTable columnExtensions={tableColumnExtensions} cellComponent={Cell} estimatedRowHeight={80} height='calc(100vh - 116px)'/>
            <TableHeaderRow showSortingControls/>
            <TableRowDetail
              contentComponent={RowDetail}
            />
            <TableColumnVisibility
              defaultHiddenColumnNames={defaultHiddenColumnNames}
            />
            <TableSelection showSelectAll/>
          </DataGrid>
        </Paper>}
      <HLTBEdit items={items}/>
    </>
  );
};

PageManageHLTB.getLayout = function getLayout(page: ReactElement) {
  return (
    <Layout>
      {page}
    </Layout>
  );
};

export default PageManageHLTB;
