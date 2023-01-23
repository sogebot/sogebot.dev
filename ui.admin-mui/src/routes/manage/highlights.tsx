import {
  IntegratedSorting,
  Sorting,
  SortingState,
} from '@devexpress/dx-react-grid';
import {
  Grid as DataGrid,
  Table,
  TableColumnVisibility,
  TableHeaderRow,
} from '@devexpress/dx-react-grid-material-ui';
import { Link } from '@mui/icons-material';
import {
  CircularProgress,
  Grid,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import { red } from '@mui/material/colors';
import { Highlight } from '@sogebot/backend/dest/database/entity/highlight';
import { useSnackbar } from 'notistack';
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import SimpleBar from 'simplebar-react';

import { ConfirmButton } from '../../components/Buttons/ConfirmButton';
import { DateTypeProvider } from '../../components/Table/DateTypeProvider';
import { getSocket } from '../../helpers/socket';
import { timestampToString } from '../../helpers/timestampToString';
import { useColumnMaker } from '../../hooks/useColumnMaker';

const PageManageViewers = () => {
  const location = useLocation();
  const { enqueueSnackbar } = useSnackbar();

  const [ items, setItems ] = useState<Highlight[]>([]);
  const [ loading, setLoading ] = useState(true);

  const [sorting, setSorting] = useState<Sorting[]>([{
    columnName: 'createdAt', direction: 'desc',
  }]);

  type extension = {
    thumbnail: string;
  };

  const generateThumbnail = (game: string) => {
    const template = 'https://static-cdn.jtvnw.net/ttv-boxart/./%{game}-60x80.jpg';
    return template.replace('%{game}', encodeURI(game));
  };

  const { columns, tableColumnExtensions, sortingTableExtensions, defaultHiddenColumnNames } = useColumnMaker<Highlight & extension>([
    {
      columnName:  'thumbnail',
      translation: ' ',
      table:       {
        align: 'center', width: '62',
      },
      sorting: { sortingEnabled: false },
      column:  {
        getCellValue: (row: Highlight) => {
          return (
            <img src={generateThumbnail(row.game)} width={46} height={60} alt={row.game}/>
          );
        },
      },
    },
    {
      columnName: 'game', translation: 'Game',
    },
    {
      columnName: 'title', translation: 'Title',
    },
    {
      columnName:  'createdAt',
      translation: 'Created At',
    },
    {
      columnName:  'timestamp',
      translation: 'Timestamp',
      column:      {
        getCellValue: (row: Highlight) => {
          return (
            <>
              <Typography>{ timestampToString(row.timestamp) }</Typography>
            </>);
        },
      },
    },
    {
      columnName:  'actions',
      table:       { width: 130 },
      sorting:     { sortingEnabled: false },
      translation: ' ',
      column:      {
        getCellValue: (row: Highlight) => [
          row.expired
            ? <Typography color={red[500]}>Expired</Typography>
            : <Stack direction="row" key="row">
              <IconButton href={'https://www.twitch.tv/videos/' + row.videoId + '?t=' + timestampToString(row.timestamp)} target="_blank"><Link/></IconButton>
            </Stack>
          ,
        ],
      },
    },
  ]);

  useEffect(() => {
    refresh().then(() => setLoading(false));
  }, [location.pathname]);

  const refresh = async () => {
    return new Promise((resolve, reject) => {
      getSocket('/systems/highlights').emit('generic::getAll', (err, _items) => {
        if (err) {
          return reject(err);
        }
        console.debug({ _items });
        setItems(_items);
        resolve(true);
      });
    });
  };

  const deleteExpired = async () => {
    await Promise.all(
      items.filter(o => o.expired).map((item) => {
        console.debug('Deleting', item);
        return new Promise((resolve, reject) => {
          if (!item.id) {
            reject('Missing item id');
            return;
          }
          getSocket('/systems/highlights').emit('generic::deleteById', item.id, (err) => {
            if (err) {
              reject(err);
            }
            resolve(true);
          });
        });
      }),
    );
    enqueueSnackbar('Expired highlights were removed.');
    refresh();
  };

  return (
    <>
      <Grid container sx={{ pb: 0.7 }} spacing={1} alignItems='center'>
        <Grid item>
          <ConfirmButton handleOk={() => deleteExpired()} variant='contained' color='error'>Delete Expired</ConfirmButton>
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
              for={['createdAt']}
            />

            <SortingState
              sorting={sorting}
              onSortingChange={setSorting}
              columnExtensions={sortingTableExtensions}
            />
            <IntegratedSorting />

            <Table columnExtensions={tableColumnExtensions}/>
            <TableHeaderRow showSortingControls/>
            <TableColumnVisibility
              defaultHiddenColumnNames={defaultHiddenColumnNames}
            />
          </DataGrid>
        </SimpleBar>}
    </>
  );
};

export default PageManageViewers;
