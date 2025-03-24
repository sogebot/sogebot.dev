import { FilteringState, IntegratedFiltering, IntegratedSelection, IntegratedSorting, SelectionState, SortingState } from '@devexpress/dx-react-grid';
import { Grid as DataGrid, Table, TableColumnVisibility, TableHeaderRow, TableSelection } from '@devexpress/dx-react-grid-material-ui';
import { SongBan } from '@entity/song';
import { Link } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import { Button, CircularProgress, Grid, IconButton, Stack, TextField, Typography } from '@mui/material';
import Popover from '@mui/material/Popover';
import axios from 'axios';
import PopupState, { bindPopover, bindTrigger } from 'material-ui-popup-state';
import { useSnackbar } from 'notistack';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import SimpleBar from 'simplebar-react';

import { ButtonsDeleteBulk } from '../../../components/Buttons/DeleteBulk';
import { DeleteButton } from '../../../components/Buttons/DeleteButton';
import { DisabledAlert } from '../../../components/DisabledAlert';
import getAccessToken from '../../../getAccessToken';
import { useAppDispatch, useAppSelector } from '../../../hooks/useAppDispatch';
import { ColumnMakerProps, useColumnMaker } from '../../../hooks/useColumnMaker';
import { useFilter } from '../../../hooks/useFilter';
import { useScope } from '../../../hooks/useScope';
import { setBulkCount } from '../../../store/appbarSlice';

const PageCommandsSongBan = () => {
  const scope = useScope('integrations');
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { enqueueSnackbar } = useSnackbar();

  const [ items, setItems ] = useState<SongBan[]>([]);
  const [ loading, setLoading ] = useState(true);
  const { bulkCount } = useAppSelector(state => state.appbar);
  const [ selection, setSelection ] = useState<(string|number)[]>([]);
  const [ isSaving, setIsSaving ] = useState(false);

  const input = useRef<null | HTMLDivElement >(null);

  type extension = {
    thumbnail: string;
  };

  const columntTpl: ColumnMakerProps<SongBan & extension> = [
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
    },
    {
      columnName:  'actions',
      translation: ' ',
      table:       { width: 130 },
      sorting:     { sortingEnabled: false },
      column:      {
        getCellValue: (row) => [
          <Stack direction="row" key="row">
            <IconButton LinkComponent='a' href={`https://youtu.be/${row.videoId}`} target="_blank"><Link/></IconButton>
            <DeleteButton key='delete' onDelete={() => deleteItem(row)} />
          </Stack>,
        ],
      },
    },
  ];

  if (!scope.manage) {
    columntTpl.pop();
  }
  const { useFilterSetup, columns, tableColumnExtensions, sortingTableExtensions, defaultHiddenColumnNames, filteringColumnExtensions } = useColumnMaker<SongBan & extension>(columntTpl);

  const { element: filterElement, filters } = useFilter<SongBan>(useFilterSetup);

  const deleteItem = useCallback((item: SongBan) => {
    axios.delete('/api/systems/songs/ban/' + item.videoId, {
      headers: {
        Authorization: `Bearer ${getAccessToken()}`
      }
    }).then(() => {
      enqueueSnackbar(`Song ${item.title} deleted successfully.`, { variant: 'success' });
      refresh();
    });
  }, [ enqueueSnackbar ]);

  useEffect(() => {
    refresh().then(() => setLoading(false));
  }, [location.pathname]);

  const refresh = async () => {
    await Promise.all([
      new Promise<void>(resolve => {
        axios.get('/api/systems/songs/ban', {
          headers: {
            Authorization: `Bearer ${getAccessToken()}`
          }
        }).then(({ data }) => {
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
      const item = items.find(o => o.videoId === selected);
      if (item) {
        await new Promise<void>((resolve) => {
          axios.delete('/api/systems/songs/ban/' + item.videoId, {
            headers: {
              Authorization: `Bearer ${getAccessToken()}`
            }
          }).then(() => {
            resolve();
          });
        });
      }
    }
    setItems(i => i.filter(item => !selection.includes(item.videoId)));
    enqueueSnackbar(`Bulk operation deleted items.`, { variant: 'success' });
    setSelection([]);
  }, [ selection, enqueueSnackbar, items ]);

  const handleBanSongAdd = useCallback((close: () => void) => {
    if (input.current) {
      const value = (input.current.children[1].children[0] as HTMLInputElement).value || '';

      if (value === '') {
        enqueueSnackbar('Cannot add empty song to ban list.', { variant: 'error' });
      } else {
        setIsSaving(true);
        axios.post('/api/systems/songs/import/ban', { url: value }, {
          headers: {
            Authorization: `Bearer ${getAccessToken()}`
          }
        }).then(() => {
          enqueueSnackbar('Song added to ban list.', { variant: 'success' });
          refresh();
          close();
        }).catch((err) => {
          enqueueSnackbar(String(err), { variant: 'error' });
        }).finally(() => setIsSaving(false));
      }
    }
  }, [ input, enqueueSnackbar ]);

  return (
    <>
      <Grid container sx={{ pb: 0.7 }} spacing={1} alignItems='center'>
        <DisabledAlert system='songs'/>
        {scope.manage && <>
          <Grid item>
            <PopupState variant="popover" popupId="demo-popup-popover">
              {(popupState) => (
                <div>
                  <Button sx={{ width: 200 }} variant="contained" {...bindTrigger(popupState)}>
                  Add new song to ban
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
                      id="add-song-ban-input"
                      label="VideoID or video URL"
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
                      onClick={() => handleBanSongAdd(popupState.close)}>Add</LoadingButton>
                  </Popover>
                </div>
              )}
            </PopupState>
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
            getRowId={row => row.videoId}
          >
            <SortingState
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
    </>
  );
};

export default PageCommandsSongBan;
