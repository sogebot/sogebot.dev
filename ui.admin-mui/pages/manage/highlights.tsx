import {
  IntegratedSorting,
  Sorting,
  SortingState,
} from '@devexpress/dx-react-grid';
import {
  Grid as DataGrid,
  TableColumnVisibility,
  TableHeaderRow,
  VirtualTable,
} from '@devexpress/dx-react-grid-material-ui';
import { Highlight } from '@entity/highlight';
import { Link } from '@mui/icons-material';
import {
  CircularProgress,
  Grid,
  IconButton,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { red } from '@mui/material/colors';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useSnackbar } from 'notistack';
import {
  ReactElement, useEffect, useState,
} from 'react';

import { NextPageWithLayout } from '~/pages/_app';
import { ConfirmButton } from '~/src/components/Buttons/ConfirmButton';
import { Layout } from '~/src/components/Layout/main';
import { DateTypeProvider } from '~/src/components/Table/DateTypeProvider';
import DenseCell from '~/src/components/Table/DenseCell';
import { getSocket } from '~/src/helpers/socket';
import { timestampToString } from '~/src/helpers/timestampToString';
import { useColumnMaker } from '~/src/hooks/useColumnMaker';

const PageManageViewers: NextPageWithLayout = () => {
  const router = useRouter();
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
        align: 'center', width: '60',
      },
      sorting: { sortingEnabled: false },
      column:  {
        getCellValue: (row: Highlight) => {
          return (
            <Image src={generateThumbnail(row.game)} width={46} height={60} alt={row.game}/>
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
  }, [router]);

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
        : <Paper>
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

            <VirtualTable columnExtensions={tableColumnExtensions} cellComponent={DenseCell} estimatedRowHeight={80} height='calc(100vh - 116px)'/>
            <TableHeaderRow showSortingControls/>
            <TableColumnVisibility
              defaultHiddenColumnNames={defaultHiddenColumnNames}
            />
          </DataGrid>
        </Paper>}
    </>
  );
};

PageManageViewers.getLayout = function getLayout(page: ReactElement) {
  return (
    <Layout>
      {page}
    </Layout>
  );
};

export default PageManageViewers;
