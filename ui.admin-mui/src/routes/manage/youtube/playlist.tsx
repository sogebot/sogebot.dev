import { CustomPaging, FilteringState, IntegratedSelection, IntegratedSorting, PagingState, SelectionState, SortingState } from '@devexpress/dx-react-grid';
import { Grid as DataGrid, PagingPanel, Table, TableColumnVisibility, TableHeaderRow, TableSelection } from '@devexpress/dx-react-grid-material-ui';
import { LinkTwoTone, MusicNoteTwoTone, SkipNextTwoTone, SkipPreviousTwoTone, VolumeUpTwoTone } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import { Backdrop, Button, CircularProgress, Dialog, Grid, IconButton, Stack, TextField, Typography } from '@mui/material';
import Popover from '@mui/material/Popover';
import { SongPlaylist } from '@sogebot/backend/dest/database/entity/song';
import axios from 'axios';
import PopupState, { bindPopover, bindTrigger } from 'material-ui-popup-state';
import { useSnackbar } from 'notistack';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useWindowSize } from 'rooks';
import SimpleBar from 'simplebar-react';

import { ButtonsDeleteBulk } from '../../../components/Buttons/DeleteBulk';
import { DeleteButton } from '../../../components/Buttons/DeleteButton';
import EditButton from '../../../components/Buttons/EditButton';
import { ButtonsTagBulk } from '../../../components/Buttons/TagBulk';
import { DisabledAlert } from '../../../components/DisabledAlert';
import { PlaylistEdit } from '../../../components/Form/PlaylistEdit';
import getAccessToken from '../../../getAccessToken';
import { dayjs } from '../../../helpers/dayjsHelper';
import { useAppDispatch, useAppSelector } from '../../../hooks/useAppDispatch';
import { ColumnMakerProps, useColumnMaker } from '../../../hooks/useColumnMaker';
import { useFilter } from '../../../hooks/useFilter';
import { useScope } from '../../../hooks/useScope';
import { setBulkCount } from '../../../store/appbarSlice';

const PageCommandsSongPlaylist = () => {
  const scope = useScope('integrations');
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { type, id } = useParams();
  const { enqueueSnackbar } = useSnackbar();

  const [ items, setItems ] = useState<SongPlaylist[]>([]);
  const [ loading, setLoading ] = useState(true);
  const { bulkCount } = useAppSelector(state => state.appbar);
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
    data:      string;
  };

  const columnsTpl: ColumnMakerProps<SongPlaylist & extension> = [
    {
      columnName:  'thumbnail',
      translation: ' ',
      table:       {
        align: 'center', width: 80,
      },
      sorting: { sortingEnabled: false },
      column:  { getCellValue: (row) => <img width={80} height={60} alt={row.title} key={row.videoId} src={`https://img.youtube.com/vi/${row.videoId}/1.jpg`}/> },
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
            <EditButton href={'/manage/songs/playlist/edit/' + row.videoId}/>
            <IconButton LinkComponent='a' href={`https://youtu.be/${row.videoId}`} target="_blank"><LinkTwoTone/></IconButton>
            <DeleteButton key='delete' onDelete={() => deleteItem(row)} />
          </Stack>,
        ],
      },
    },
  ];

  if (!scope.manage) {
    // remove actions column
    columnsTpl.pop();
  }

  const { useFilterSetup, columns, tableColumnExtensions, sortingTableExtensions, defaultHiddenColumnNames } = useColumnMaker<SongPlaylist & extension>(columnsTpl);

  const bulkToggleAttribute = useCallback(async <T extends keyof SongPlaylist>(attribute: T, value: SongPlaylist[T]) => {
    for (const selected of selection) {
      const item = items.find(o => o.videoId === selected);
      if (item && item[attribute] !== value) {
        await new Promise<void>((resolve) => {
          item[attribute] = value;
          axios.post(`/api/systems/songs/playlist`,
            item,
            { headers: { authorization: `Bearer ${getAccessToken()}` } })
            .finally(resolve);
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
      new Promise<void>((resolve) => {
        axios.get('/api/systems/songs/playlist/tag/current').then(({ data }) => {
          setCurrentTag(data.data);
          resolve();
        });
      }),
      new Promise<void>((resolve) => {
        axios.get('/api/systems/songs/playlist/tags').then(({ data }) => {
          setTags(data.data);
          resolve();
        });
      }),
      new Promise<void>(resolve => {
        axios.get(`/api/systems/songs/playlist?page=${currentPage}&perPage=${pageSize}&filter=${JSON.stringify(filters)}`).then(({ data }) => {
          setItems(data.data);
          setTotalCount(data.total);
          resolve();
        });
      }),
    ]);
    setLoading(false);
  }, [ currentPage, pageSize, filters, enqueueSnackbar ]);

  const deleteItem = useCallback((item: SongPlaylist) => {
    axios.delete(`/api/systems/songs/playlist/${item.videoId}`)
      .finally(() => {
        enqueueSnackbar(`Song ${item.title} deleted successfully.`, { variant: 'success' });
        refresh();
      });
  }, [ enqueueSnackbar, refresh ]);

  useEffect(() => {
    refresh();
  }, [location.pathname, currentPage, filters, refresh]);

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
          axios.delete(`/api/systems/songs/playlist/${item.videoId}`).finally(resolve);
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
        axios.post(`/api/systems/songs/import/${value.includes('playlist') ? 'playlist' : 'video'}`, { playlist: value, forcedTag: currentTag }).then(() => {
          enqueueSnackbar('Song added to playlist.', { variant: 'success' });
          refresh();
          close();
        }).catch((err) => {
          enqueueSnackbar(String(err), { variant: 'error' });
        }).finally(() => setIsSaving(false));
      }
    }
  }, [ input, enqueueSnackbar, currentTag, refresh ]);

  const open = React.useMemo(() => !!(type
    && (
      (type === 'edit' && id)
      || type === 'create'
    )
  ), [type, id]);

  return (
    <>
      <Grid container sx={{ pb: 0.7 }} spacing={1} alignItems='center'>
        <DisabledAlert system='songs'/>
        {scope.manage && <>
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
        </>}
        <Grid item>{filterElement}</Grid>
        <Grid item>
          {bulkCount > 0 && <Typography variant="button" px={2}>{ bulkCount } selected</Typography>}
        </Grid>
      </Grid>

      <Backdrop open={loading} >
        <CircularProgress color="inherit"/>
      </Backdrop>

      <SimpleBar style={{ maxHeight: 'calc(100vh - 160px)' }} autoHide={false}>
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
          <Table columnExtensions={tableColumnExtensions}/>
          <TableHeaderRow showSortingControls/>
          <TableColumnVisibility
            defaultHiddenColumnNames={defaultHiddenColumnNames}
          />
          {scope.manage && <TableSelection showSelectAll/>}
          <PagingPanel/>
        </DataGrid>
      </SimpleBar>

      <Dialog
        open={open}
        fullWidth
        maxWidth='md'>
        {open &&  <PlaylistEdit tags={tags}/>}
      </Dialog>
    </>
  );
};

export default PageCommandsSongPlaylist;
