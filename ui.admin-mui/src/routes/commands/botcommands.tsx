import { Filter, FilteringState, IntegratedFiltering, IntegratedSorting, SortingState } from '@devexpress/dx-react-grid';
import { Grid as DataGrid, Table, TableColumnVisibility, TableHeaderRow } from '@devexpress/dx-react-grid-material-ui';
import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';
import { CircularProgress, Dialog, Grid, Paper, Typography } from '@mui/material';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import SimpleBar from 'simplebar-react';

import { Commands } from '../../classes/Commands';
import EditButton from '../../components/Buttons/EditButton';
import { BotCommandEdit } from '../../components/Form/BotCommandEdit';
import { PermissionTypeProvider } from '../../components/Table/PermissionTypeProvider';
import { getPermissionName } from '../../helpers/getPermissionName';
import { ColumnMakerProps, useColumnMaker } from '../../hooks/useColumnMaker';
import { useFilter } from '../../hooks/useFilter';
import { usePermissions } from '../../hooks/usePermissions';
import { useScope } from '../../hooks/useScope';

const PageCommandsBot = () => {
  const scope = useScope('core:general');
  const location = useLocation();
  const { type, id } = useParams();

  const [ items, setItems ] = useState<Commands[]>([]);

  const [ loading, setLoading ] = useState(true);
  const { permissions } = usePermissions();

  const columnsTpl: ColumnMakerProps<Commands & { isModified: boolean }> = [
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
  ];

  if (scope.manage) {
    columnsTpl.push(
      {
        columnName:  'actions',
        translation: ' ',
        table:       { width: 100 },
        sorting:     { sortingEnabled: false },
        column:      { getCellValue: (row) => <EditButton href={'/commands/botcommands/edit/' + row.id}/> },
      }
    );
  }

  const { useFilterSetup, columns, tableColumnExtensions, sortingTableExtensions, defaultHiddenColumnNames, filteringColumnExtensions } = useColumnMaker<Commands & { isModified: boolean }>(columnsTpl);
  const { element: filterElement, filters } = useFilter<Commands>(useFilterSetup);

  useEffect(() => {
    setLoading(true);
    refresh().then(() => setLoading(false));
  }, [location.pathname]);

  const refresh = async () => {
    const { data } = await axios.get('/api/core/general/commands');
    setItems(data.data);
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
      {loading && items.length === 0 && permissions.length === 0
        ? <CircularProgress color="inherit" sx={{
          position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, 0)',
        }} />
        : <SimpleBar style={{ maxHeight: 'calc(100vh - 116px)' }} autoHide={false}>
          <Paper>
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
          </Paper>
        </SimpleBar>}

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
