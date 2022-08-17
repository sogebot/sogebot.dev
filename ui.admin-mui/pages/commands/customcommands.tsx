import {
  Column,
  Filter,
  FilteringState,
  IntegratedSelection,
  IntegratedSorting,
  SelectionState,
  SortingState,
} from '@devexpress/dx-react-grid';
import {
  Grid as DataGrid,
  Table,
  TableFilterRow,
  TableHeaderRow,
  TableSelection,
} from '@devexpress/dx-react-grid-material-ui';
import { Commands, CommandsGroup } from '@entity/commands';
import {
  CheckBoxTwoTone, DisabledByDefaultTwoTone, RestartAltTwoTone, VisibilityOffTwoTone, VisibilityTwoTone,
} from '@mui/icons-material';
import EditIcon from '@mui/icons-material/Edit';
import {
  Button,
  CircularProgress,
  Grid,
  MenuItem,
  Paper,
  Select,
  Stack,
  TableCell,
  Tooltip,
  Typography,
} from '@mui/material';
import { grey } from '@mui/material/colors';
import axios from 'axios';
import capitalize from 'lodash/capitalize';
import { useRouter } from 'next/router';
import { useSnackbar } from 'notistack';
import {
  ReactElement, useCallback, useEffect, useMemo, useState,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import SimpleBar from 'simplebar-react';

import { DisabledAlert } from '@/components/System/DisabledAlert';
import { NextPageWithLayout } from '~/pages/_app';
import { ButtonsDeleteBulk } from '~/src/components/Buttons/DeleteBulk';
import { ButtonsGroupBulk } from '~/src/components/Buttons/GroupBulk';
import { GridActionAliasMenu } from '~/src/components/GridAction/AliasMenu';
import { Layout } from '~/src/components/Layout/main';
import { CommandsEdit } from '~/src/components/RightDrawer/CommandsEdit';
import { BoolTypeProvider } from '~/src/components/Table/BoolTypeProvider';
import { GroupTypeProvider } from '~/src/components/Table/GroupTypeProvider';
import { PermissionTypeProvider } from '~/src/components/Table/PermissionTypeProvider';
import { Responses } from '~/src/components/Table/Responses';
import getAccessToken from '~/src/getAccessToken';
import { useBoolFilter } from '~/src/hooks/Table/useBoolFilter';
import { useNumberFilter } from '~/src/hooks/Table/useNumberFilter';
import { usePermissionsFilter } from '~/src/hooks/Table/usePermissionsFilter';
import { useTranslation } from '~/src/hooks/useTranslation';
import { setBulkCount } from '~/src/store/appbarSlice';

type CommandWithCount = Commands & { count:number };

const PageCommandsCommands: NextPageWithLayout = () => {
  const { translate } = useTranslation();
  const dispatch = useDispatch();
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();

  const { Cell: NumberFilterCell } = useNumberFilter();

  const [ items, setItems ] = useState<CommandWithCount[]>([]);
  const [ groupsSettings, setGroupsSettings ] = useState<CommandsGroup[]>([]);
  const [ loading, setLoading ] = useState(true);
  const { bulkCount } = useSelector((state: any) => state.appbar);
  const [ selection, setSelection ] = useState<(string|number)[]>([]);
  const { Cell: PermissionFilterCell } = usePermissionsFilter();
  const { Cell: BoolFilterCell } = useBoolFilter();
  const tableColumnExtensions = [
    { columnName: 'command', width: '70%' },
    { columnName: 'count', align: 'right' },
    { columnName: 'enabled', align: 'center' },
    { columnName: 'visible', align: 'center' },
    {
      columnName: 'actions', width: 130, filteringEnabled: false, sortingEnabled: false,
    },
  ];
  const [filters, setFilters] = useState<Filter[]>([]);

  const groups = useMemo(() => {
    return Array.from(new Set(items.map(o => o.group)));
  }, [items]);

  const GroupFilterCell = useCallback(({ filter, onFilter }) => (
    <TableCell sx={{ width: '100%', p: 1 }}>
      <Select
        variant='standard'
        fullWidth
        multiple
        displayEmpty
        value={filter ? filter.value : []}
        onChange={e => onFilter(e.target.value ? { value: e.target.value } : null)}
        renderValue={(selected: string[]) => {
          if (selected.length === 0) {
            return <Typography sx={{
              color: grey[600], fontSize: '14px', fontWeight: 'bold', position: 'relative', top: '2px',
            }}>Filter...</Typography>;
          }

          return selected.map(o => o === '' ? 'Ungrouped' : o).join(', ');
        }}
      >
        {groups.map(group => <MenuItem key={group ?? ''} value={group ?? ''}>{group ?? 'Ungrouped'}</MenuItem>)}
      </Select>
    </TableCell>
  ), [groups]);

  const deleteItem = useCallback((item: Commands) => {
    axios.delete(`${localStorage.server}/api/systems/customcommands/${item.id}`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
      .finally(() => {
        enqueueSnackbar(`Commands ${item.command} deleted successfully.`, { variant: 'success' });
        refresh();
      });
  }, [ enqueueSnackbar ]);

  const columns = useMemo<Column[]>(() => [
    {
      name:         'command',
      title:        capitalize(translate('command')),
      getCellValue: (row) => [
        <Stack key="cmdStack">
          <strong key="command">{row.command}</strong>
          <Responses key="responses" responses={row.responses}/>
        </Stack>,
      ],
    },
    { name: 'count', title: capitalize(translate('count')) },
    { name: 'enabled', title: capitalize(translate('enabled')) },
    { name: 'visible', title: capitalize(translate('visible')) },
    {
      name: 'group', title: capitalize(translate('group')), getCellValue: (row) => row.group ? row.group : '_ungroup', // ungrouped should be first
    },
    {
      name:         'actions',
      title:        ' ',
      getCellValue: (row) => [
        <Stack direction="row" key="row">
          <Button
            size='small'
            variant="contained"
            startIcon={<EditIcon/>}
            onClick={() => {
              router.push('/commands/customcommands/edit/' + row.id);
            }}>Edit</Button>
          <GridActionAliasMenu key='delete' onDelete={() => deleteItem(row)} />
        </Stack>,
      ],
    },
  ], [ translate, router, deleteItem ]);

  const FilterCell = useCallback((props) => {
    const { column } = props;
    if (column.name === 'permission') {
      return <PermissionFilterCell {...props} />;
    }
    if (column.name === 'count') {
      return <NumberFilterCell {...props} />;
    }
    if (column.name === 'group') {
      return <GroupFilterCell {...props} />;
    }
    if (column.name === 'enabled' || column.name === 'visible') {
      return <BoolFilterCell {...props} />;
    }
    return <TableFilterRow.Cell {...props} />;
  }, [PermissionFilterCell, GroupFilterCell, BoolFilterCell, NumberFilterCell]);

  useEffect(() => {
    refresh().then(() => setLoading(false));
  }, [router]);

  const refresh = async () => {
    await Promise.all([
      new Promise<void>(resolve => {
        axios.get(`${localStorage.server}/api/systems/customcommands`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
          .then(({ data }) => {
            const commands = data.data;
            for (const command of commands) {
              command.count = data.count.find((o: any) => o.command === command.command)?.count || 0;
            }
            setItems(commands);
            resolve();
          });
      }),
      new Promise<void>(resolve => {
        axios.get(`${localStorage.server}/api/systems/customcommands/groups`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
          .then(({ data }) => {
            setGroupsSettings(data.data);
            resolve();
          });
      }),
    ]);
  };

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      let shouldShow = true;

      for (const filter of filters) {
        if (filter.columnName === 'command') {
          shouldShow = item.command.toLowerCase().includes(filter.value.toLowerCase()) || item.responses.map(o => o.response.toLowerCase()).filter(o => o.includes(filter.value.toLowerCase())).length > 0;
        } else if (filter.columnName === 'group') {
          shouldShow = filter.value.length > 0 ? filter.value.includes(item.group || '') : true;
        } else if (filter.columnName === 'enabled') {
          shouldShow = filter.value === item.enabled;
        } else if (filter.columnName === 'visible') {
          shouldShow = filter.value === item.visible;
        } else if (filter.columnName === 'count' && filter.value !== '') {
          if ((filter as any).type === '>') {
            shouldShow = item.count > Number(filter.value);
          } else if ((filter as any).type === '=') {
            shouldShow = item.count === Number(filter.value);
          } else if ((filter as any).type === '<') {
            shouldShow = item.count < Number(filter.value);
          }
        }

        if (!shouldShow) {
          return false;
        }
      }
      return true;
    });
  }, [items, filters]);

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
          axios.post(`${localStorage.server}/api/systems/customcommands`, item, { headers: { authorization: `Bearer ${getAccessToken()}` } })
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
          axios.post(`${localStorage.server}/api/systems/customcommands`, item, { headers: { authorization: `Bearer ${getAccessToken()}` } })
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
          axios.delete(`${localStorage.server}/api/systems/customcommands/${item.id}`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
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

  return (
    <>
      <DisabledAlert system='customcommands'/>
      <Grid container sx={{ pb: 0.7 }} spacing={1} alignItems='center'>
        <Grid item>
          <Button variant="contained" onClick={() => {
            router.push('/commands/customcommands/create/');
          }}>Create new custom command</Button>
        </Grid>
        <Grid item>
          <Button sx={{ width: 200 }} variant="contained" onClick={() => {
            router.push('/commands/customcommands/group/edit');
          }} color='secondary'>Group settings</Button>
        </Grid>
        <Grid item>
          <Tooltip arrow title="Set visibility on">
            <Button disabled={!bulkCanVisOn} variant="contained" color="secondary" sx={{ minWidth: '36px', width: '36px' }} onClick={() => bulkToggleAttribute('visible', true)}><VisibilityTwoTone/></Button>
          </Tooltip>
        </Grid>
        <Grid item>
          <Tooltip arrow title="Set visibility off">
            <Button disabled={!bulkCanVisOff} variant="contained" color="secondary" sx={{ minWidth: '36px', width: '36px' }} onClick={() => bulkToggleAttribute('visible', false)}><VisibilityOffTwoTone/></Button>
          </Tooltip>
        </Grid>
        <Grid item>
          <Tooltip arrow title="Enable">
            <Button disabled={!bulkCanEnable} variant="contained" color="secondary" sx={{ minWidth: '36px', width: '36px' }} onClick={() => bulkToggleAttribute('enabled', true)}><CheckBoxTwoTone/></Button>
          </Tooltip>
        </Grid>
        <Grid item>
          <Tooltip arrow title="Disable">
            <Button disabled={!bulkCanDisable} variant="contained" color="secondary" sx={{ minWidth: '36px', width: '36px' }} onClick={() => bulkToggleAttribute('enabled', false)}><DisabledByDefaultTwoTone/></Button>
          </Tooltip>
        </Grid>
        <Grid item>
          <ButtonsGroupBulk disabled={bulkCount === 0} onSelect={groupId => bulkToggleAttribute('group', groupId)} groups={groups}/>
        </Grid>
        <Grid item>
          <Tooltip arrow title="Reset usage count">
            <Button disabled={bulkCount === 0} variant="contained" color="secondary" sx={{ minWidth: '36px', width: '36px' }} onClick={() => bulkResetCount()}><RestartAltTwoTone/></Button>
          </Tooltip>
        </Grid>
        <Grid item>
          <ButtonsDeleteBulk disabled={bulkCount === 0} onDelete={bulkDelete}/>
        </Grid>
        <Grid item>
          {bulkCount > 0 && <Typography variant="button" px={2}>{ bulkCount } selected</Typography>}
        </Grid>
      </Grid>

      {loading
        ? <CircularProgress color="inherit" sx={{
          position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, 0)',
        }} />
        : <Paper>
          <SimpleBar style={{ maxHeight: 'calc(100vh - 116px)' }} autoHide={false}>
            <DataGrid
              rows={filteredItems}
              columns={columns}
              getRowId={row => row.id}
            >
              <PermissionTypeProvider
                for={['permission']}
              />
              <GroupTypeProvider
                for={['group']}
              />
              <BoolTypeProvider
                for={['visible', 'enabled']}
              />

              <SortingState
                defaultSorting={[{ columnName: 'group', direction: 'asc' }, { columnName: 'command', direction: 'asc' }]}
                columnExtensions={tableColumnExtensions as any}
              />
              <IntegratedSorting />
              <FilteringState filters={filters} onFiltersChange={setFilters} columnExtensions={tableColumnExtensions as any}/>

              <SelectionState
                selection={selection}
                onSelectionChange={setSelection}
              />
              <IntegratedSelection/>
              <Table columnExtensions={tableColumnExtensions as any}/>
              <TableHeaderRow showSortingControls/>
              <TableFilterRow
                cellComponent={FilterCell}
              />
              <TableSelection showSelectAll/>
            </DataGrid>
          </SimpleBar>
        </Paper>}
      <CommandsEdit groups={groupsSettings}/>
    </>
  );
};

PageCommandsCommands.getLayout = function getLayout(page: ReactElement) {
  return (
    <Layout>
      {page}
    </Layout>
  );
};

export default PageCommandsCommands;
