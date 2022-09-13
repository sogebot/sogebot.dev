import {
  Filter,
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
import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';
import EditIcon from '@mui/icons-material/Edit';
import {
  Button,
  CircularProgress,
  Grid,
  Paper,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/router';
import {
  ReactElement, useEffect, useState,
} from 'react';
import SimpleBar from 'simplebar-react';

import { NextPageWithLayout } from '~/pages/_app';
import { Commands } from '~/src/classes/Commands';
import { Layout } from '~/src/components/Layout/main';
import { BotCommandEdit } from '~/src/components/RightDrawer/BotCommandEdit';
import { PermissionTypeProvider } from '~/src/components/Table/PermissionTypeProvider';
import { getPermissionName } from '~/src/helpers/getPermissionName';
import { getSocket } from '~/src/helpers/socket';
import { useColumnMaker } from '~/src/hooks/useColumnMaker';
import { useFilter } from '~/src/hooks/useFilter';
import { usePermissions } from '~/src/hooks/usePermissions';

const PageCommandsBot: NextPageWithLayout = () => {
  const router = useRouter();

  const [ items, setItems ] = useState<Commands[]>([]);

  const [ loading, setLoading ] = useState(true);
  const { permissions } = usePermissions();

  const { useFilterSetup, columns, tableColumnExtensions, sortingTableExtensions, defaultHiddenColumnNames, filteringColumnExtensions } = useColumnMaker<Commands & { isModified: boolean }>([
    {
      columnName:  'isModified',
      filtering:   { type: 'boolean' },
      translation: 'Is modified',
      hidden:      true,
      column:      { getCellValue: (row) => row.defaultValue !== row.command },
    },
    {
      columnName: 'command',
      filtering:  { type: 'string' },
      predicate:  (value: string, filter: Filter, row: any) => {
        const fValue = filter.value.toLowerCase();
        if (filter.operation === 'contains') {
          return row.command.toLowerCase().includes(fValue) || row.defaultValue.toLowerCase().includes(fValue);
        }

        if (filter.operation === 'equal') {
          return row.command.toLowerCase() === fValue || row.command.toLowerCase() === fValue;
        }

        if (filter.operation === 'notEqual') {
          return row.command.toLowerCase() !== fValue && row.command.toLowerCase() !== fValue;
        }

        return IntegratedFiltering.defaultPredicate(value, filter, row);
      },
      column: {
        getCellValue: (row) => {
          return (<Typography>
            {row.defaultValue !== row.command ? (<>
              <Typography component='span' sx={{ textDecoration: 'line-through' }}>{row.defaultValue}</Typography>
              <ArrowRightAltIcon sx={{
                mx: 0.5, verticalAlign: 'bottom',
              }}/>
              {row.command}
            </>
            ) : <>{row.defaultValue}</>}

          </Typography>);
        },
      },
    },
    {
      columnName: 'name',
      filtering:  {
        type: 'list', options: { listValues: Array.from(new Set(items.map(o => o.name))).sort() },
      },
    },
    {
      columnName: 'permission',
      filtering:  {
        type: 'permission', options: { showDisabled: true },
      },
      column: { getCellValue: (row) => row.permission === null ? '_disabled' : getPermissionName(row.permission, permissions || []) },
    },
    {
      columnName: 'type',
      filtering:  {
        type: 'list', options: { listValues: Array.from(new Set(items.map(o => o.type))).sort() },
      },
    },
    {
      columnName:  'actions',
      translation: ' ',
      table:       { width: 100 },
      sorting:     { sortingEnabled: false },
      column:      {
        getCellValue: (row) => [
          <Button
            size='small'
            key="edit"
            variant="contained"
            startIcon={<EditIcon/>}
            onClick={() => {
              router.push('/commands/botcommands/edit/' + row.id);
            }}>Edit</Button>,
        ],
      },
    },
  ]);

  const { element: filterElement, filters } = useFilter<Commands & { isModified: boolean }>(useFilterSetup);

  useEffect(() => {
    refresh().then(() => setLoading(false));
  }, [router]);

  const refresh = async () => {
    await Promise.all([
      new Promise<void>(resolve => {
        getSocket('/core/general').emit('generic::getCoreCommands', (err, commands) => {
          if (err) {
            resolve();
            return console.error(err);
          }
          setItems(commands);
          resolve();
        });
      }),
    ]);
  };

  return (
    <>
      <Grid container sx={{ pb: 0.7 }} spacing={1} alignItems='center'>
        <Grid item>{filterElement}</Grid>
      </Grid>
      {loading && items.length === 0 && permissions.length === 0
        ? <CircularProgress color="inherit" sx={{
          position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, 0)',
        }} />
        : <Paper>
          <SimpleBar style={{ maxHeight: 'calc(100vh - 116px)' }} autoHide={false}>
            <DataGrid
              rows={items}
              columns={columns}
            >
              <PermissionTypeProvider for={['permission']}/>

              <SortingState
                defaultSorting={[{
                  columnName: 'command', direction: 'asc',
                }, {
                  columnName: 'name', direction: 'asc',
                }, {
                  columnName: 'type', direction: 'asc',
                }]}
                columnExtensions={sortingTableExtensions}
              />
              <IntegratedSorting />
              <FilteringState filters={filters}/>
              <IntegratedFiltering columnExtensions={filteringColumnExtensions}/>

              <Table columnExtensions={tableColumnExtensions}/>
              <TableHeaderRow showSortingControls/>
              <TableColumnVisibility
                defaultHiddenColumnNames={defaultHiddenColumnNames}
              />
            </DataGrid>
          </SimpleBar>
        </Paper>}
      <BotCommandEdit items={items}/>
    </>
  );
};

PageCommandsBot.getLayout = function getLayout(page: ReactElement) {
  return (
    <Layout>
      {page}
    </Layout>
  );
};

export default PageCommandsBot;
