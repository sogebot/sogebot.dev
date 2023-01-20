import {
  Filter,
  FilteringState,
  IntegratedFiltering,
  IntegratedSorting,
  SortingState,
} from '@devexpress/dx-react-grid';
import {
  Grid as DataGrid,
  TableColumnVisibility,
  TableHeaderRow,
  VirtualTable,
} from '@devexpress/dx-react-grid-material-ui';
import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';
import {
  CircularProgress,
  Container,
  Dialog,
  Grid,
  Paper,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';

import { Commands } from '../../classes/Commands';
import EditButton from '../../components/Buttons/EditButton';
import { BotCommandEdit } from '../../components/Form/BotCommandEdit';
import DenseCell from '../../components/Table/DenseCell';
import { PermissionTypeProvider } from '../../components/Table/PermissionTypeProvider';
import { getPermissionName } from '../../helpers/getPermissionName';
import { getSocket } from '../../helpers/socket';
import { useColumnMaker } from '../../hooks/useColumnMaker';
import { useFilter } from '../../hooks/useFilter';
import { usePermissions } from '../../hooks/usePermissions';

const PageCommandsBot = () => {
  const location = useLocation();
  const { type, id } = useParams();

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
      column:      { getCellValue: (row) => <EditButton href={'/commands/botcommands/edit/' + row.id}/> },
    },
  ]);
  const { element: filterElement, filters } = useFilter<Commands>(useFilterSetup);

  useEffect(() => {
    refresh().then(() => setLoading(false));
  }, [location.pathname]);

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

  const open = React.useMemo(() => !!(type
    && (
      (type === 'edit' && id)
      || type === 'create'
    )
  ), [type, id]);

  return (
    <>
      <Container disableGutters>
        <Grid container sx={{ pb: 0.7 }} spacing={1} alignItems='center'>
          <Grid item>{filterElement}</Grid>
        </Grid>
        {loading && items.length === 0 && permissions.length === 0
          ? <CircularProgress color="inherit" sx={{
            position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, 0)',
          }} />
          : <Paper>
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

              <VirtualTable columnExtensions={tableColumnExtensions} cellComponent={DenseCell} estimatedRowHeight={80} height='calc(100vh - 116px)'/>
              <TableHeaderRow showSortingControls/>
              <TableColumnVisibility
                defaultHiddenColumnNames={defaultHiddenColumnNames}
              />
            </DataGrid>
          </Paper>}
      </Container>

      <Dialog
        open={open}
        fullWidth
        maxWidth='md'>
        {open && <BotCommandEdit items={items}/>}
      </Dialog>
    </>
  );
};

export default PageCommandsBot;
