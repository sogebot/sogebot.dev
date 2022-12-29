import {
  FilteringState,
  IntegratedFiltering,
  IntegratedPaging,
  IntegratedSorting,
  PagingState,
  SortingState,
} from '@devexpress/dx-react-grid';
import {
  Grid as DataGrid,
  PagingPanel,
  TableColumnVisibility,
  TableHeaderRow,
  VirtualTable,
} from '@devexpress/dx-react-grid-material-ui';
import { EditTwoTone } from '@mui/icons-material';
import {
  Backdrop,
  CircularProgress,
  Grid,
  Paper,
  Stack,
} from '@mui/material';
import IconButton from '@mui/material/IconButton/IconButton';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  ReactElement, useEffect, useRef, useState,
} from 'react';

import { NextPageWithLayout } from '~/pages/_app';
import { Layout } from '~/src/components/Layout/main';
import { TranslationsEdit } from '~/src/components/RightDrawer/TranslationsEdit';
import DenseCellOneLine from '~/src/components/Table/DenseCellOneLine';
import { getSocket } from '~/src/helpers/socket';
import { useColumnMaker } from '~/src/hooks/useColumnMaker';
import { useFilter } from '~/src/hooks/useFilter';

const PageSettingsTranslations: NextPageWithLayout = () => {
  const router = useRouter();

  const [ items, setItems ] = useState<{ name: string; current: string; default: string; }[]>([]);
  const [ loading, setLoading ] = useState(true);

  const table = useRef<HTMLDivElement>(null);
  const cellSize = 57;
  const [pageSize, setPageSize] = useState(0);

  useEffect(() => {
    if (table.current) {
      setPageSize(Math.floor(Math.max(400, table.current.clientHeight - 57.3) / cellSize));
    }
  }, [ table ]);

  const { useFilterSetup, columns, tableColumnExtensions, sortingTableExtensions, defaultHiddenColumnNames, filteringColumnExtensions } = useColumnMaker<(typeof items)[number]>([
    {
      columnName: 'name', filtering: { type: 'string' }, translation: 'Key',
    },{
      columnName: 'current', filtering: { type: 'string' }, translation: 'Value',
    },
    {
      columnName:  'actions',
      table:       { width: 130 },
      sorting:     { sortingEnabled: false },
      translation: ' ',
      column:      {
        getCellValue: (row) => [
          <Stack direction="row" key="row">
            <TranslationsEdit item={row} open={row.name === router.query.translationKey} onSave={() => refresh()} />
            <Link passHref href={`/settings/translations/${row.name}`}>
              <IconButton><EditTwoTone/></IconButton>
            </Link>
          </Stack>,
        ],
      },
    },
  ]);

  const { element: filterElement, filters } = useFilter(useFilterSetup);

  useEffect(() => {
    refresh();
  }, [router]);

  const refresh = async () => {
    setLoading(true);
    await Promise.all([
      new Promise<void>(resolve => {
        getSocket('/').emit('responses.get', null, (data) => {
          console.groupCollapsed('translations::responses.get');
          console.log(data);
          console.groupEnd();
          setItems(Object
            .entries(data)
            .map((o) => {
              if ((o[1] as any).current.startsWith('{missing')) {
                console.debug(`${o[0]} have missing translation`);
              }
              return {
                name:    o[0] as string,
                current: (o[1] as any).current as string,
                default: (o[1] as any).default as string,
              };
            })
            .filter(o => !o.name.startsWith('webpanel') && !o.name.startsWith('ui'))
            .sort((a, b) => {
              const keyA = a.name.toUpperCase(); // ignore upper and lowercase
              const keyB = b.name.toUpperCase(); // ignore upper and lowercase
              if (keyA < keyB) {
                return -1;
              }
              if (keyA > keyB) {
                return 1;
              }

              // names must be equal
              return 0;
            })
          );
          resolve();
        });
      }),
    ]);
    setLoading(false);
  };

  return (
    <>
      <Grid container sx={{ pb: 0.7 }} spacing={1} alignItems='center'>
        <Grid item>{filterElement}</Grid>
      </Grid>

      <Backdrop open={loading} >
        <CircularProgress color="inherit"/>
      </Backdrop>

      <Paper ref={table}>
        <DataGrid
          rows={items}
          columns={columns}
          getRowId={row => row.name}
        >
          <SortingState
            defaultSorting={[{
              columnName: 'name', direction: 'asc',
            }]}
            columnExtensions={sortingTableExtensions}
          />
          <IntegratedSorting columnExtensions={sortingTableExtensions} />

          <FilteringState filters={filters}/>
          <IntegratedFiltering columnExtensions={filteringColumnExtensions}/>

          <PagingState
            pageSize={pageSize}
          />
          <IntegratedPaging/>

          <VirtualTable columnExtensions={tableColumnExtensions} height='calc(100vh - 160px)' cellComponent={DenseCellOneLine}/>
          <TableHeaderRow showSortingControls/>
          <TableColumnVisibility
            defaultHiddenColumnNames={defaultHiddenColumnNames}
          />
          <PagingPanel/>
        </DataGrid>
      </Paper>
    </>
  );
};

PageSettingsTranslations.getLayout = function getLayout(page: ReactElement) {
  return (
    <Layout>
      {page}
    </Layout>
  );
};

export default PageSettingsTranslations;
