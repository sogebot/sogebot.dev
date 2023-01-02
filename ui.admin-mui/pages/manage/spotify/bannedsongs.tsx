import {
  FilteringState,
  IntegratedFiltering,
  IntegratedSelection,
  IntegratedSorting,
  SelectionState,
  SortingState,
} from '@devexpress/dx-react-grid';
import {
  Grid as DataGrid,
  TableColumnVisibility,
  TableHeaderRow,
  TableSelection,
  VirtualTable,
} from '@devexpress/dx-react-grid-material-ui';
import { SpotifySongBan } from '@entity/spotify';
import { Link } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Button,
  CircularProgress,
  Grid,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import Popover from '@mui/material/Popover';
import PopupState, { bindPopover, bindTrigger } from 'material-ui-popup-state';
import { useRouter } from 'next/router';
import { useSnackbar } from 'notistack';
import {
  ReactElement, useCallback, useEffect, useRef, useState,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { DisabledAlert } from '@/components/System/DisabledAlert';
import { NextPageWithLayout } from '~/pages/_app';
import { ButtonsDeleteBulk } from '~/src/components/Buttons/DeleteBulk';
import { DeleteButton } from '~/src/components/Buttons/DeleteButton';
import { Layout } from '~/src/components/Layout/main';
import DenseCell from '~/src/components/Table/DenseCell';
import { getSocket } from '~/src/helpers/socket';
import { useColumnMaker } from '~/src/hooks/useColumnMaker';
import { useFilter } from '~/src/hooks/useFilter';
import { setBulkCount } from '~/src/store/appbarSlice';

const PageCommandsSpotifySongBan: NextPageWithLayout = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();

  const [ items, setItems ] = useState<SpotifySongBan[]>([]);
  const [ loading, setLoading ] = useState(true);
  const { bulkCount } = useSelector((state: any) => state.appbar);
  const [ selection, setSelection ] = useState<(string|number)[]>([]);
  const [ isSaving, setIsSaving ] = useState(false);

  const input = useRef<null | HTMLDivElement >(null);

  type extension = {
    thumbnail: string;
  };
  const { useFilterSetup, columns, tableColumnExtensions, sortingTableExtensions, defaultHiddenColumnNames, filteringColumnExtensions } = useColumnMaker<SpotifySongBan & extension>([
    {
      filtering:  { type: 'string' },
      columnName: 'title',
    }, {
      filtering:      { type: 'string' },
      columnName:     'artists',
      sorting:        { sortingEnabled: false },
      translationKey: 'integrations.spotify.artists',
      column:         { getCellValue: (row) => row.artists.join(', ') },
    },
    {
      columnName:  'actions',
      translation: ' ',
      table:       { width: 130 },
      sorting:     { sortingEnabled: false },
      column:      {
        getCellValue: (row) => [
          <Stack direction="row" key="row">
            <IconButton href={`${row.spotifyUri}`} target="_blank"><Link/></IconButton>
            <DeleteButton key='delete' onDelete={() => deleteItem(row)} />
          </Stack>,
        ],
      },
    },
  ]);

  const { element: filterElement, filters } = useFilter<SpotifySongBan>(useFilterSetup);

  const deleteItem = useCallback((item: SpotifySongBan) => {
    getSocket('/integrations/spotify').emit('spotify::deleteBan', item.spotifyUri, () => {
      enqueueSnackbar(`Song ${item.title} deleted successfully.`, { variant: 'success' });
      refresh();
    });
  }, [ enqueueSnackbar ]);

  useEffect(() => {
    refresh().then(() => setLoading(false));
  }, [router]);

  const refresh = async () => {
    await Promise.all([
      new Promise<void>(resolve => {
        getSocket('/integrations/spotify').emit('spotify::getAllBanned', {}, (err, res) => {
          if (err) {
            resolve();
            return console.error(err);
          }
          setItems(res);
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
      const item = items.find(o => o.spotifyUri === selected);
      if (item) {
        await new Promise<void>((resolve) => {
          getSocket('/integrations/spotify').emit('spotify::deleteBan', item.spotifyUri, () => {
            resolve();
          });
        });
      }
    }
    setItems(i => i.filter(item => !selection.includes(item.spotifyUri)));
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
        getSocket('/integrations/spotify').emit('spotify::addBan', value, (err) => {
          setIsSaving(false);
          if (err) {
            enqueueSnackbar(String(err), { variant: 'error' });
          } else {
            enqueueSnackbar('Song added to ban list.', { variant: 'success' });
            refresh();
            close();
          }
        });
      }
    }
  }, [ input, enqueueSnackbar ]);

  return (
    <>
      <Grid container sx={{ pb: 0.7 }} spacing={1} alignItems='center'>
        <DisabledAlert integration='spotify'/>
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
                    label="spotifyUri"
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
            getRowId={row => row.spotifyUri}
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
            <VirtualTable columnExtensions={tableColumnExtensions} height='calc(100vh - 116px)' cellComponent={DenseCell}/>
            <TableHeaderRow showSortingControls/>
            <TableColumnVisibility
              defaultHiddenColumnNames={defaultHiddenColumnNames}
            />
            <TableSelection showSelectAll/>
          </DataGrid>
        </Paper>}
    </>
  );
};

PageCommandsSpotifySongBan.getLayout = function getLayout(page: ReactElement) {
  return (
    <Layout>
      {page}
    </Layout>
  );
};

export default PageCommandsSpotifySongBan;
