import {
  Column,
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
import capitalize from 'lodash/capitalize';
import { useRouter } from 'next/router';
import {
  ReactElement, useEffect, useMemo, useState,
} from 'react';
import SimpleBar from 'simplebar-react';

import { NextPageWithLayout } from '~/pages/_app';
import { Commands } from '~/src/classes/Commands';
import { Layout } from '~/src/components/Layout/main';
import { BotCommandEdit } from '~/src/components/RightDrawer/BotCommandEdit';
import { PermissionTypeProvider } from '~/src/components/Table/PermissionTypeProvider';
import { getPermissionName } from '~/src/helpers/getPermissionName';
import { getSocket } from '~/src/helpers/socket';
import { useFilter } from '~/src/hooks/useFilter';
import { usePermissions } from '~/src/hooks/usePermissions';
import { useTranslation } from '~/src/hooks/useTranslation';

const PageCommandsBot: NextPageWithLayout = () => {
  const { translate } = useTranslation();
  const router = useRouter();

  const [ items, setItems ] = useState<Commands[]>([]);

  const [ loading, setLoading ] = useState(true);
  const { permissions } = usePermissions();

  const { element: filterElement, filters, customPredicate } = useFilter<Commands & { isModified: boolean }>([
    {
      columnName: 'isModified', type: 'boolean', translation: 'Is modified',
    },
    { columnName: 'command', type: 'string' },
    {
      columnName: 'name', type: 'list', options: { listValues: Array.from(new Set(items.map(o => o.name))).sort() },
    },
    {
      columnName: 'type', type: 'list', options: { listValues: Array.from(new Set(items.map(o => o.type))).sort() },
    },
    {
      columnName: 'permission', type: 'permission', options: { showDisabled: true },
    },
  ]);

  const columns = useMemo<Column[]>(() => [
    { name: 'isModified', getCellValue: (row) => row.defaultValue !== row.command },
    {
      name:         'command',
      title:        capitalize(translate('command')),
      getCellValue: (row) => {
        return (<Typography>
          {row.defaultValue !== row.command ? (<>
            <Typography component='span' sx={{ textDecoration: 'line-through' }}>{row.defaultValue}</Typography>
            <ArrowRightAltIcon sx={{ mx: 0.5, verticalAlign: 'bottom' }}/>
            {row.command}
          </>
          ) : <>{row.defaultValue}</>}

        </Typography>);
      },
    },
    {
      name:  'name',
      title: capitalize(translate('name')),
    },
    {
      name:         'permission', title:        translate('permission'),
      getCellValue: (row) => row.permission === null ? '_disabled' : getPermissionName(row.permission, permissions || []),
    },
    { name: 'type', title: capitalize(translate('type')) },
    {
      name:         'actions',
      title:        ' ',
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
  ], [ permissions, translate, router ]);
  const tableColumnExtensions = [
    { columnName: 'isModified' },
    { columnName: 'name', predicate: customPredicate },
    { columnName: 'type', predicate: customPredicate },
    {
      columnName: 'command', width:      '40%', predicate:  (value: string, filter: Filter, row: any) => {
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
    },
    { columnName: 'permission', predicate: customPredicate },
    {
      columnName: 'actions', width: 100, filteringEnabled: false, sortingEnabled: false,
    },
  ];

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
                defaultSorting={[{ columnName: 'command', direction: 'asc' }, { columnName: 'name', direction: 'asc' }, { columnName: 'type', direction: 'asc' }]}
                columnExtensions={tableColumnExtensions as any}
              />
              <IntegratedSorting />
              <FilteringState filters={filters} columnExtensions={tableColumnExtensions as any}/>
              <IntegratedFiltering columnExtensions={tableColumnExtensions as any}/>

              <Table columnExtensions={tableColumnExtensions}/>
              <TableHeaderRow showSortingControls/>
              <TableColumnVisibility
                defaultHiddenColumnNames={['isModified']}
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
