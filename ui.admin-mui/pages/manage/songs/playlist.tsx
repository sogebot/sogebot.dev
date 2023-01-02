import {
  CustomPaging,
  FilteringState,
  IntegratedSelection,
  IntegratedSorting,
  PagingState,
  SelectionState,
  SortingState,
} from '@devexpress/dx-react-grid';
import {
  Grid as DataGrid,
  PagingPanel,
  TableColumnVisibility,
  TableHeaderRow,
  TableSelection,
  VirtualTable,
} from '@devexpress/dx-react-grid-material-ui';
import { SongPlaylist } from '@entity/song';
import {
  LinkTwoTone, MusicNoteTwoTone, SkipNextTwoTone, SkipPreviousTwoTone, VolumeUpTwoTone,
} from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Backdrop,
  Button,
  CircularProgress,
  Grid,
  IconButton,
  Paper,
  Stack,
  TextField, Typography,
} from '@mui/material';
import Popover from '@mui/material/Popover';
import PopupState, { bindPopover, bindTrigger } from 'material-ui-popup-state';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useSnackbar } from 'notistack';
import {
  ReactElement, useCallback, useEffect, useRef, useState,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useWindowSize } from 'rooks';

import { DisabledAlert } from '@/components/System/DisabledAlert';
import { NextPageWithLayout } from '~/pages/_app';
import { ButtonsDeleteBulk } from '~/src/components/Buttons/DeleteBulk';
import { DeleteButton } from '~/src/components/Buttons/DeleteButton';
import EditButton from '~/src/components/Buttons/EditButton';
import { ButtonsTagBulk } from '~/src/components/Buttons/TagBulk';
import { Layout } from '~/src/components/Layout/main';
import { PlaylistEdit } from '~/src/components/RightDrawer/PlaylistEdit';
import DenseCell from '~/src/components/Table/DenseCell';
import { dayjs } from '~/src/helpers/dayjsHelper';
import { getSocket } from '~/src/helpers/socket';
import { useColumnMaker } from '~/src/hooks/useColumnMaker';
import { useFilter } from '~/src/hooks/useFilter';
import { setBulkCount } from '~/src/store/appbarSlice';

const PageCommandsSongPlaylist: NextPageWithLayout = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();

  const [ items, setItems ] = useState<SongPlaylist[]>([]);
  const [ loading, setLoading ] = useState(true);
  const { bulkCount } = useSelector((state: any) => state.appbar);
  const [ selection, setSelection ] = useState<(string|number)[]>([]);
  const [ isSaving, setIsSaving ] = useState(false);

  const [ currentTag, setCurrentTag ] = useState<string | null>(null);
  const [ tags, setTags ] = useState<string[]>([]);

  const { innerHeight } = useWindowSize();
  const [pageSize, setPageSize] = useState(Math.floor((Math.max(innerHeight ?? 0, 400) - 64 - 50 - 60) / 80));
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const input = useRef<null | HTMLDivElement >(null);

  useEffect(() => {
    setPageSize(Math.floor((Math.max(innerHeight ?? 0, 400) - 64 - 50 - 60) / 80));
  }, [ innerHeight ]);

  type extension = {
    thumbnail: string;
    data: string;
  };
  const { useFilterSetup, columns, tableColumnExtensions, sortingTableExtensions, defaultHiddenColumnNames } = useColumnMaker<SongPlaylist & extension>([
    {
      columnName:  'thumbnail',
      translation: ' ',
      table:       {
        align: 'center', width: 80,
      },
      sorting: { sortingEnabled: false },
      column:  { getCellValue: (row) => <Image width={80} height={60} alt={row.title} key={row.videoId} src={`https://img.youtube.com/vi/${row.videoId}/1.jpg`}/> },
    }, {
      filtering:      { type: 'string' },
      table:          { width: 120 },
      columnName:     'videoId',
      translationKey: 'responses.variable.id',
    }, {
      filtering:  { type: 'string' },
      columnName: 'title',
    }, {
      columnName:  'data',
      translation: ' ',
      column:      {
        getCellValue: row => <Stack direction="row" spacing={1} alignSelf='center'>
          <Typography>{ dayjs.duration(row.length * 1000).format('HH:mm:ss').replace('00:0', '').replace('00:', '') }</Typography>
          <Typography><VolumeUpTwoTone sx={{
            fontSize: '16px', position: 'relative', top: '2px',
          }}/> { row.volume }%</Typography>
          <Typography>
            <SkipPreviousTwoTone sx={{
              fontSize: '16px', position: 'relative', top: '2px',
            }}/>
            { dayjs.duration(row.startTime * 1000).format('HH:mm:ss').replace('00:0', '').replace('00:', '') }
            &nbsp;-&nbsp;
            { dayjs.duration(row.endTime * 1000).format('HH:mm:ss').replace('00:0', '').replace('00:', '') }
            <SkipNextTwoTone sx={{
              fontSize: '16px', position: 'relative', top: '2px',
            }}/>
          </Typography>
          <Typography>
            <MusicNoteTwoTone sx={{
              fontSize: '16px', position: 'relative', top: '2px',
            }}/>
            { dayjs(row.lastPlayedAt).format('LLL') }
          </Typography>
        </Stack>,
      },
    }, {
      filtering: {
        type:    'list',
        options: { listValues: tags },
      },
      translationKey: 'systems.quotes.tags.name',
      columnName:     'tags',
      column:         {
        getCellValue: (row) => <Stack>
          {row.tags.map(o => o === currentTag ? `${o} (current)` : o).join(', ')}
        </Stack>,
      },
    },
    {
      columnName:  'actions',
      translation: ' ',
      table:       { width: 130 },
      sorting:     { sortingEnabled: false },
      column:      {
        getCellValue: (row) => [
          <Stack direction="row" key="row">
            <PlaylistEdit item={row} tags={tags} open={row.videoId === router.query.id} onSave={() => refresh()} />
            <EditButton href={'/manage/songs/playlist/edit/' + row.videoId}/>
            <IconButton href={`https://youtu.be/${row.videoId}`} target="_blank"><LinkTwoTone/></IconButton>
            <DeleteButton key='delete' onDelete={() => deleteItem(row)} />
          </Stack>,
        ],
      },
    },
  ]);

  const bulkToggleAttribute = useCallback(async <T extends keyof SongPlaylist>(attribute: T, value: SongPlaylist[T]) => {
    for (const selected of selection) {
      const item = items.find(o => o.videoId === selected);
      if (item && item[attribute] !== value) {
        await new Promise<void>((resolve) => {
          item[attribute] = value;
          getSocket('/systems/songs').emit('songs::save', item, () => {
            resolve();
          });
        });
      }
    }

    setItems(i => i.map((item) => {
      if (selection.includes(item.videoId)) {
        item[attribute] = value;
      }
      return item;
    }));

    if (attribute === 'tags') {
      enqueueSnackbar(`Bulk operation set items tags to ${(value as string[]).join(', ')}.`, { variant: 'success' });
    }
  }, [items, selection, enqueueSnackbar]);

  const { element: filterElement, filters } = useFilter<SongPlaylist>(useFilterSetup);

  const refresh = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      new Promise<void>((resolve, reject) => {
        getSocket('/systems/songs').emit('current.playlist.tag', (err, tag: string) => {
          if (err) {
            enqueueSnackbar(String(err), { variant: 'error' });
            reject(err);
          }
          setCurrentTag(tag);
          resolve();
        });
      }),
      new Promise<void>((resolve, reject) => {
        getSocket('/systems/songs').emit('get.playlist.tags', (err, _tags) => {
          if (err) {
            enqueueSnackbar(String(err), { variant: 'error' });
            reject(err);
          }
          setTags(_tags);
          resolve();
        });
      }),
      new Promise<void>(resolve => {
        getSocket('/systems/songs').emit('find.playlist', {
          page: currentPage, perPage: pageSize, filters,
        }, (err, res, count) => {
          if (err) {
            resolve();
            return console.error(err);
          }
          setItems(res);
          setTotalCount(count);
          resolve();
        });
      }),
    ]);
    setLoading(false);
  }, [ currentPage, pageSize, filters, enqueueSnackbar ]);

  const deleteItem = useCallback((item: SongPlaylist) => {
    getSocket('/systems/songs').emit('delete.playlist', item.videoId, () => {
      enqueueSnackbar(`Song ${item.title} deleted successfully.`, { variant: 'success' });
      refresh();
    });
  }, [ enqueueSnackbar, refresh ]);

  useEffect(() => {
    refresh();
  }, [router, currentPage, filters, refresh]);

  useEffect(() => {
    setCurrentPage(0);
  }, [ filters ]);

  useEffect(() => {
    dispatch(setBulkCount(selection.length));
  }, [selection, dispatch]);

  const bulkDelete =  useCallback(async () => {
    for (const selected of selection) {
      const item = items.find(o => o.videoId === selected);
      if (item) {
        await new Promise<void>((resolve) => {
          getSocket('/systems/songs').emit('delete.playlist', item.videoId, () => {
            resolve();
          });
        });
      }
    }
    setItems(i => i.filter(item => !selection.includes(item.videoId)));
    enqueueSnackbar(`Bulk operation deleted items.`, { variant: 'success' });
    setSelection([]);
  }, [ selection, enqueueSnackbar, items ]);

  const handleSongAdd = useCallback((close: () => void) => {
    if (input.current) {
      const value = (input.current.children[1].children[0] as HTMLInputElement).value || '';

      if (value === '') {
        enqueueSnackbar('Cannot add empty song to playlist.', { variant: 'error' });
      } else {
        setIsSaving(true);
        getSocket('/systems/songs').emit(value.includes('playlist') ? 'import.playlist' : 'import.video', {
          playlist: value, forcedTag: currentTag,
        }, (err) => {
          setIsSaving(false);
          if (err) {
            enqueueSnackbar(String(err), { variant: 'error' });
          } else {
            enqueueSnackbar('Song added to playlist.', { variant: 'success' });
            refresh();
            close();
          }
        });
      }
    }
  }, [ input, enqueueSnackbar, currentTag, refresh ]);

  return (
    <>
      <Grid container sx={{ pb: 0.7 }} spacing={1} alignItems='center'>
        <DisabledAlert system='songs'/>
        <Grid item>
          <PopupState variant="popover" popupId="demo-popup-popover">
            {(popupState) => (
              <div>
                <Button sx={{ width: 250 }} variant="contained" {...bindTrigger(popupState)}>
                  Add new song to playlist
                </Button>
                <Popover
                  {...bindPopover(popupState)}
                  anchorOrigin={{
                    vertical:   'bottom',
                    horizontal: 'left',
                  }}
                  transformOrigin={{
                    vertical:   'top',
                    horizontal: 'left',
                  }}
                >
                  <TextField
                    ref={input}
                    id="add-song-playlist-input"
                    label="VideoID, video URL or playlist URL"
                    variant="filled"
                    sx={{
                      minWidth:               '400px',
                      '& .MuiInputBase-root': { borderRadius: 0 },
                    }}/>
                  <LoadingButton
                    color="primary"
                    loading={isSaving}
                    variant="contained"
                    sx={{
                      height:       '56px',
                      borderRadius: 0,
                    }}
                    onClick={() => handleSongAdd(popupState.close)}>Add</LoadingButton>
                </Popover>
              </div>
            )}
          </PopupState>
        </Grid>
        <Grid item>
          <ButtonsTagBulk disabled={bulkCount === 0} onSelect={groupId => bulkToggleAttribute('tags', groupId)} tags={tags} forceTags={['general']}/>
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

      <Paper>
        <DataGrid
          rows={items}
          columns={columns}
          getRowId={row => row.videoId}
        >
          <SortingState
            columnExtensions={sortingTableExtensions}
          />
          <IntegratedSorting columnExtensions={sortingTableExtensions} />

          <FilteringState filters={filters}/>

          <SelectionState
            selection={selection}
            onSelectionChange={setSelection}
          />
          <IntegratedSelection/>

          <PagingState
            currentPage={currentPage}
            onCurrentPageChange={setCurrentPage}
            pageSize={pageSize}
          />
          <CustomPaging
            totalCount={totalCount}
          />
          <VirtualTable columnExtensions={tableColumnExtensions} height='calc(100vh - 165px)' cellComponent={DenseCell}/>
          <TableHeaderRow showSortingControls/>
          <TableColumnVisibility
            defaultHiddenColumnNames={defaultHiddenColumnNames}
          />
          <TableSelection showSelectAll/>
          <PagingPanel/>
        </DataGrid>
      </Paper>
    </>
  );
};

PageCommandsSongPlaylist.getLayout = function getLayout(page: ReactElement) {
  return (
    <Layout>
      {page}
    </Layout>
  );
};

export default PageCommandsSongPlaylist;
