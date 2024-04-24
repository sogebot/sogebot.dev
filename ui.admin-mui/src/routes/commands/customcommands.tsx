import { Filter, FilteringState, IntegratedFiltering, IntegratedSelection, IntegratedSorting, SelectionState, SortingState } from '@devexpress/dx-react-grid';
import { Grid as DataGrid, Table, TableColumnVisibility, TableHeaderRow, TableSelection } from '@devexpress/dx-react-grid-material-ui';
import { CheckBoxTwoTone, DisabledByDefaultTwoTone, RestartAltTwoTone, VisibilityOffTwoTone, VisibilityTwoTone } from '@mui/icons-material';
import { Button, CircularProgress, Dialog, Grid, Stack, Tooltip, Typography } from '@mui/material';
import { Commands, CommandsGroup } from '@sogebot/backend/dest/database/entity/commands';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import SimpleBar from 'simplebar-react';

import { ButtonsDeleteBulk } from '../../components/Buttons/DeleteBulk';
import { DeleteButton } from '../../components/Buttons/DeleteButton';
import EditButton from '../../components/Buttons/EditButton';
import { ButtonsGroupBulk } from '../../components/Buttons/GroupBulk';
import { DisabledAlert } from '../../components/DisabledAlert';
import { CommandsEdit } from '../../components/Form/CommandsEdit';
import { BoolTypeProvider } from '../../components/Table/BoolTypeProvider';
import { GroupTypeProvider } from '../../components/Table/GroupTypeProvider';
import { Responses } from '../../components/Table/Responses';
import getAccessToken from '../../getAccessToken';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { ColumnMakerProps, useColumnMaker } from '../../hooks/useColumnMaker';
import { useFilter } from '../../hooks/useFilter';
import { useScope } from '../../hooks/useScope';
import { setBulkCount } from '../../store/appbarSlice';

type CommandWithCount = Commands & { count: number };

const PageCommandsCommands = () => {
  const scope = useScope('systems:customcommands');

  const dispatch = useAppDispatch();
  const location = useLocation();
  const { type, id } = useParams();
  const { enqueueSnackbar } = useSnackbar();

  const [ items, setItems ] = useState<CommandWithCount[]>([]);
  const [ groupsSettings, setGroupsSettings ] = useState<CommandsGroup[]>([]);
  const [ loading, setLoading ] = useState(true);
  const { bulkCount } = useAppSelector(state => state.appbar);
  const [ selection, setSelection ] = useState<(string|number)[]>([]);

  const columnTpl: ColumnMakerProps<CommandWithCount> = [
    {
      columnName: 'command',
      filtering:  { type: 'string' },
      predicate:  (value: string, filter: Filter, row: any) => {
        const fValue = filter.value.toLowerCase();
        if (filter.operation === 'contains') {
          return row.command.toLowerCase().includes(fValue) || row.responses.filter((response: any) => response.response.toLowerCase().includes(fValue)).length > 0;
        }

        if (filter.operation === 'equal') {
          return row.command.toLowerCase() === fValue || row.responses.filter((response: any) => response.response.toLowerCase() === fValue).length > 0;
        }

        if (filter.operation === 'notEqual') {
          return row.command.toLowerCase() !== fValue && row.responses.filter((response: any) => response.response.toLowerCase() !== fValue).length > 0;
        }

        return IntegratedFiltering.defaultPredicate(value, filter, row);
      },
      table:  { width: '50%' },
      column: {
        getCellValue: (row) => [
          <Stack key="cmdStack">
            <strong key="command">{row.command}</strong>
            <Responses key="responses" responses={row.responses as any}/>
          </Stack>,
        ],
      },
    },
    {
      columnName: 'count', filtering: { type: 'number' }, table: { align: 'right' },
    },
    {
      columnName: 'enabled', filtering: { type: 'boolean' }, table: { align: 'center' },
    },
    {
      columnName: 'visible', filtering: { type: 'boolean' }, table: { align: 'center' },
    },
    {
      columnName: 'areResponsesRandomized', filtering: { type: 'boolean' }, table: { align: 'center' }, translation: 'Randomized',
    },
    {
      columnName: 'group',
      column:     { getCellValue: (row) => row.group ? row.group : '_ungroup' /* ungrouped should be first */ },
      filtering:  {
        type:    'list',
        options: {
          showDisabled:  true,
          disabledName:  'Ungrouped',
          disabledValue: '_ungroup',
          listValues:    groupsSettings
            .filter(group => group.name !== 'undefined')
            .map(group => group.name),
        },
      },
    }
  ];
  if (scope.manage) {
    columnTpl.push({
      columnName:  'actions',
      table:       { width: 130 },
      sorting:     { sortingEnabled: false },
      translation: ' ',
      column:      {
        getCellValue: (row) => [
          <Stack direction="row" key="row">
            <EditButton href={'/commands/customcommands/edit/' + row.id}/>
            <DeleteButton key='delete' onDelete={() => deleteItem(row)} />
          </Stack>,
        ],
      },
    });
  }

  const { useFilterSetup, columns, tableColumnExtensions, sortingTableExtensions, defaultHiddenColumnNames, filteringColumnExtensions } = useColumnMaker<CommandWithCount>(columnTpl);

  const { element: filterElement, filters } = useFilter(useFilterSetup);

  const groups = useMemo(() => {
    return Array.from(new Set(items.map(o => o.group)));
  }, [items]);

  const deleteItem = useCallback((item: Commands) => {
    axios.delete(`/api/systems/customcommands/${item.id}`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
      .finally(() => {
        enqueueSnackbar(`Commands ${item.command} deleted successfully.`, { variant: 'success' });
        refresh();
      });
  }, [ enqueueSnackbar ]);

  useEffect(() => {
    refresh().then(() => setLoading(false));
  }, [location.pathname]);

  const refresh = async () => {
    await Promise.all([
      new Promise<void>(resolve => {
        axios.get(`/api/systems/customcommands`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
          .then(({ data }) => {
            if (data.status === 'success') {
              const commands = data.data;
              for (const command of commands) {
                command.count = data.data.count.find((o: any) => o.command === command.command)?.count || 0;
              }
              setItems(commands);
            }
            resolve();
          });
      }),
      new Promise<void>(resolve => {
        axios.get(`/api/systems/groups/customcommands`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
          .then(({ data }) => {
            if (data.status === 'success') {
              setGroupsSettings(data.data);
            }
            resolve();
          });
      }),
    ]);
  };

  useEffect(() => {
    dispatch(setBulkCount(selection.length));
  }, [selection, dispatch]);

  const bulkCanVisOff = useMemo(() => {
    for (const itemId of selection) {
      const item = items.find(o => o.id === itemId);
      if (item && item.visible) {
        return true;
      }
    }
    return false;
  }, [ selection, items ]);

  const bulkCanVisOn = useMemo(() => {
    for (const itemId of selection) {
      const item = items.find(o => o.id === itemId);
      if (item && !item.visible) {
        return true;
      }
    }
    return false;
  }, [ selection, items ]);

  const bulkCanEnable = useMemo(() => {
    for (const itemId of selection) {
      const item = items.find(o => o.id === itemId);
      if (item && !item.enabled) {
        return true;
      }
    }
    return false;
  }, [ selection, items ]);

  const bulkCanDisable = useMemo(() => {
    for (const itemId of selection) {
      const item = items.find(o => o.id === itemId);
      if (item && item.enabled) {
        return true;
      }
    }
    return false;
  }, [ selection, items ]);

  const bulkToggleAttribute = useCallback(async <T extends keyof CommandWithCount>(attribute: T, value: CommandWithCount[T]) => {
    for (const selected of selection) {
      const item = items.find(o => o.id === selected);
      if (item && item[attribute] !== value) {
        await new Promise<void>((resolve) => {
          item[attribute] = value;
          axios.post(`/api/systems/customcommands`, item, { headers: { authorization: `Bearer ${getAccessToken()}` } })
            .then(() => {
              resolve();
            });
        });
      }
    }

    setItems(i => i.map((item) => {
      if (selection.includes(item.id)) {
        item[attribute] = value;
      }
      return item;
    }));

    if (attribute === 'enabled') {
      enqueueSnackbar(`Bulk operation set ${value ? 'enabled' : 'disabled'}.`, { variant: 'success' });
    } else if (attribute === 'group') {
      // we need next tick as it doesn't reselect without it
      // nextTick(() => setSelection(selectedItems));
      if (value) {
        enqueueSnackbar(`Bulk operation set group to ${value}.`, { variant: 'success' });
      } else {
        enqueueSnackbar(`Bulk operation removed group.`, { variant: 'success' });
      }
    }

    refresh();
  }, [ enqueueSnackbar, items, selection ]);

  const bulkResetCount =  useCallback(async () => {
    for (const selected of selection) {
      const item = items.find(o => o.id === selected);
      if (item) {
        item.count = 0;
        await new Promise<void>((resolve) => {
          axios.post(`/api/systems/customcommands`, item, { headers: { authorization: `Bearer ${getAccessToken()}` } })
            .then(() => {
              resolve();
            });
        });
      }
    }

    setItems(i => i.map((item) => {
      if (selection.includes(item.id)) {
        item.count = 0;
      }
      return item;
    }));

    enqueueSnackbar(`Bulk operation reset commands usage count`);

    refresh();
  }, [ enqueueSnackbar, items, selection ]);

  const bulkDelete =  useCallback(async () => {
    for (const selected of selection) {
      const item = items.find(o => o.id === selected);
      if (item) {
        await new Promise<void>((resolve) => {
          axios.delete(`/api/systems/customcommands/${item.id}`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
            .finally(() => {
              resolve();
            });
        });
      }
    }
    setItems(i => i.filter(item => !selection.includes(item.id)));
    enqueueSnackbar(`Bulk operation deleted items.`, { variant: 'success' });
    setSelection([]);
  }, [ selection, enqueueSnackbar, items ]);

  const open = React.useMemo(() => !!(type
    && (
      (type === 'edit' && id)
      || type === 'create'
    )
  ), [type, id]);

  return (
    <>
      <Grid container sx={{ pb: 0.7 }} spacing={1} alignItems='center'>
        <DisabledAlert system='customcommands'/>
        {scope.manage && <Grid item>
          <Button variant="contained" href='/commands/customcommands/create/'>Create new custom command</Button>
        </Grid>}
        <Grid item>
          <Button sx={{ width: 200 }} href='/commands/customcommands/group/edit' variant="contained" color='secondary'>Group settings</Button>
        </Grid>
        {scope.manage && <>
          <Grid item>
            <Tooltip arrow title="Set visibility on">
              <Button disabled={!bulkCanVisOn} variant="contained" color="secondary" sx={{
                minWidth: '36px', width: '36px',
              }} onClick={() => bulkToggleAttribute('visible', true)}><VisibilityTwoTone/></Button>
            </Tooltip>
          </Grid>
          <Grid item>
            <Tooltip arrow title="Set visibility off">
              <Button disabled={!bulkCanVisOff} variant="contained" color="secondary" sx={{
                minWidth: '36px', width: '36px',
              }} onClick={() => bulkToggleAttribute('visible', false)}><VisibilityOffTwoTone/></Button>
            </Tooltip>
          </Grid>
          <Grid item>
            <Tooltip arrow title="Enable">
              <Button disabled={!bulkCanEnable} variant="contained" color="secondary" sx={{
                minWidth: '36px', width: '36px',
              }} onClick={() => bulkToggleAttribute('enabled', true)}><CheckBoxTwoTone/></Button>
            </Tooltip>
          </Grid>
          <Grid item>
            <Tooltip arrow title="Disable">
              <Button disabled={!bulkCanDisable} variant="contained" color="secondary" sx={{
                minWidth: '36px', width: '36px',
              }} onClick={() => bulkToggleAttribute('enabled', false)}><DisabledByDefaultTwoTone/></Button>
            </Tooltip>
          </Grid>
          <Grid item>
            <ButtonsGroupBulk disabled={bulkCount === 0} onSelect={groupId => bulkToggleAttribute('group', groupId)} groups={groups}/>
          </Grid>
          <Grid item>
            <Tooltip arrow title="Reset usage count">
              <Button disabled={bulkCount === 0} variant="contained" color="secondary" sx={{
                minWidth: '36px', width: '36px',
              }} onClick={() => bulkResetCount()}><RestartAltTwoTone/></Button>
            </Tooltip>
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
            getRowId={row => row.id}
          >
            <GroupTypeProvider
              for={['group']}
            />
            <BoolTypeProvider
              for={['visible', 'enabled', 'areResponsesRandomized']}
            />

            <SortingState
              defaultSorting={[{
                columnName: 'group', direction: 'asc',
              }, {
                columnName: 'command', direction: 'asc',
              }]}
              columnExtensions={sortingTableExtensions}
            />
            <IntegratedSorting columnExtensions={sortingTableExtensions} />

            <FilteringState filters={filters}/>
            <IntegratedFiltering columnExtensions={filteringColumnExtensions}/>

            <SelectionState
              selection={selection}
              onSelectionChange={setSelection}
            />
            {scope.manage && <IntegratedSelection/>}
            <Table columnExtensions={tableColumnExtensions}/>
            <TableHeaderRow showSortingControls/>
            <TableColumnVisibility
              defaultHiddenColumnNames={defaultHiddenColumnNames}
            />
            {scope.manage && <TableSelection showSelectAll/>}
          </DataGrid>
        </SimpleBar>}

      <Dialog
        open={open}
        fullWidth
        maxWidth='md'>
        {open && <CommandsEdit groups={groupsSettings}/>}
      </Dialog>
    </>
  );
};
export default PageCommandsCommands;
