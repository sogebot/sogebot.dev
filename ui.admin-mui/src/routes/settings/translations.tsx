import {
  FilteringState,
  IntegratedFiltering,
  IntegratedSorting,
  SortingState,
} from '@devexpress/dx-react-grid';
import {
  Grid as DataGrid,
  Table,
  TableColumnVisibility,
  TableHeaderRow,
} from '@devexpress/dx-react-grid-material-ui';
import { EditTwoTone } from '@mui/icons-material';
import {
  CircularProgress,
  Dialog,
  Grid,
  Stack,
} from '@mui/material';
import IconButton from '@mui/material/IconButton/IconButton';
import React, { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import SimpleBar from 'simplebar-react';

import { TranslationsEdit } from '../../components/Form/TranslationsEdit';
import { getSocket } from '../../helpers/socket';
import { useColumnMaker } from '../../hooks/useColumnMaker';
import { useFilter } from '../../hooks/useFilter';

const PageSettingsTranslations = () => {
  const location = useLocation();
  const { type, id } = useParams();

  const [ items, setItems ] = useState<{ name: string; current: string; default: string; }[]>([]);
  const [ loading, setLoading ] = useState(true);

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
            <IconButton href={`/settings/translations/edit/${row.name}`}><EditTwoTone/></IconButton>
          </Stack>,
        ],
      },
    },
  ]);

  const { element: filterElement, filters } = useFilter(useFilterSetup);

  useEffect(() => {
    refresh();
  }, [location.pathname]);

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
            }),
          );
          resolve();
        });
      }),
    ]);
    setLoading(false);
  };

  const open = React.useMemo(() => !!(type
    && (
      (type === 'edit' && id)
      || type === 'create'
    )
  ), [type, id]);

  return (
    <>
      <Grid container sx={{ pb: 0.7 }} spacing={1} alignItems='center'>
        <Grid item>{filterElement}</Grid>
      </Grid>

      {loading
        ? <CircularProgress color="inherit" sx={{
          position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, 0)',
        }} />
        : <SimpleBar style={{ maxHeight: 'calc(100vh - 116px)' }} autoHide={false}>
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

            <Table columnExtensions={tableColumnExtensions}/>
            <TableHeaderRow showSortingControls/>
            <TableColumnVisibility
              defaultHiddenColumnNames={defaultHiddenColumnNames}
            />
          </DataGrid>
        </SimpleBar>}

      <Dialog
        open={open}
        fullWidth
        maxWidth='md'>
        {open && <TranslationsEdit items={items}/>}
      </Dialog>
    </>
  );
};

export default PageSettingsTranslations;
