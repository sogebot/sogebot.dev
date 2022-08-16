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
import { Alias, AliasGroup } from '@entity/alias';
import {
  CheckBoxTwoTone, DisabledByDefaultTwoTone, VisibilityOffTwoTone, VisibilityTwoTone,
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
import { ButtonsPermissionsBulk } from '~/src/components/Buttons/PermissionsBulk';
import { GridActionAliasMenu } from '~/src/components/GridAction/AliasMenu';
import { Layout } from '~/src/components/Layout/main';
import { AliasEdit } from '~/src/components/RightDrawer/AliasEdit';
import { BoolTypeProvider } from '~/src/components/Table/BoolTypeProvider';
import { GroupTypeProvider } from '~/src/components/Table/GroupTypeProvider';
import { PermissionTypeProvider } from '~/src/components/Table/PermissionTypeProvider';
import { getPermissionName } from '~/src/helpers/getPermissionName';
import { getSocket } from '~/src/helpers/socket';
import { useBoolFilter } from '~/src/hooks/Table/useBoolFilter';
import { usePermissionsFilter } from '~/src/hooks/Table/usePermissionsFilter';
import { usePermissions } from '~/src/hooks/usePermissions';
import { useTranslation } from '~/src/hooks/useTranslation';
import { setBulkCount } from '~/src/store/appbarSlice';

const PageCommandsAlias: NextPageWithLayout = () => {
  const { translate } = useTranslation();
  const dispatch = useDispatch();
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();

  const [ items, setItems ] = useState<Alias[]>([]);
  const [ groupsSettings, setGroupsSettings ] = useState<AliasGroup[]>([]);
  const [ loading, setLoading ] = useState(true);
  const { bulkCount } = useSelector((state: any) => state.appbar);
  const { permissions } = usePermissions();
  const [ selection, setSelection ] = useState<(string|number)[]>([]);
  const { Cell: PermissionFilterCell } = usePermissionsFilter();
  const { Cell: BoolFilterCell } = useBoolFilter();
  const tableColumnExtensions = [
    { columnName: 'command', width: '40%' },
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

  const GroupFilterCell = useCallback(({ filter, onFilter }: any) => (
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

  const deleteItem = useCallback((item: Alias) => {
    getSocket('/systems/alias').emit('generic::deleteById', item.id, () => {
      enqueueSnackbar(`Alias ${item.alias} deleted successfully.`, { variant: 'success' });
      refresh();
    });
  }, [ enqueueSnackbar ]);

  const columns = useMemo<Column[]>(() => [
    {
      name:  'alias',
      title: capitalize(translate('alias')),
    },
    {
      name:  'command',
      title: capitalize(translate('command')),
    },
    {
      name:         'permission', title:        translate('permission'),
      getCellValue: (row) => row.permission === null ? '_disabled' : getPermissionName(row.permission, permissions || []),
    },
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
              router.push('/commands/alias/edit/' + row.id);
            }}>Edit</Button>
          <GridActionAliasMenu key='delete' onDelete={() => deleteItem(row)} />
        </Stack>,
      ],
    },
  ], [ permissions, translate, router, deleteItem ]);

  const FilterCell = useCallback((props: any) => {
    const { column } = props;
    if (column.name === 'permission') {
      return <PermissionFilterCell {...props} />;
    }
    if (column.name === 'group') {
      return <GroupFilterCell {...props} />;
    }
    if (column.name === 'enabled' || column.name === 'visible') {
      return <BoolFilterCell {...props} />;
    }
    return <TableFilterRow.Cell {...props} />;
  }, [PermissionFilterCell, GroupFilterCell, BoolFilterCell]);

  useEffect(() => {
    refresh().then(() => setLoading(false));
  }, [router]);

  const refresh = async () => {
    console.log('Refreshing');
    await Promise.all([
      new Promise<void>(resolve => {
        getSocket('/systems/alias').emit('generic::getAll', (err, res) => {
          if (err) {
            resolve();
            return console.error(err);
          }
          setItems(res);
          resolve();
        });
      }),
      new Promise<void>(resolve => {
        getSocket('/systems/alias').emit('generic::groups::getAll', (err, res) => {
          if (err) {
            resolve();
            return console.error(err);
          }
          setGroupsSettings(res);
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
          shouldShow = item.command.toLowerCase().includes(filter.value.toLowerCase());
        } else if (filter.columnName === 'alias') {
          shouldShow = item.alias.toLowerCase().includes(filter.value.toLowerCase());
        } else if (filter.columnName === 'group') {
          shouldShow = filter.value.length > 0 ? filter.value.includes(item.group || '') : true;
        } else if (filter.columnName === 'permission') {
          shouldShow = filter.value.length > 0 ? filter.value.includes(item.permission || '') : true;
        } else if (filter.columnName === 'visible') {
          shouldShow = filter.value === item.visible;
        } else if (filter.columnName === 'enabled') {
          shouldShow = filter.value === item.enabled;
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

  const bulkToggleAttribute = useCallback(async <T extends keyof Alias>(attribute: T, value: Alias[T]) => {
    for (const selected of selection) {
      const item = items.find(o => o.id === selected);
      if (item && item[attribute] !== value) {
        await new Promise<void>((resolve) => {
          item[attribute] = value;
          getSocket('/systems/alias').emit('generic::save', item, () => {
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

    if (attribute === 'visible') {
      enqueueSnackbar(`Bulk operation set visibility ${value ? 'on' : 'off'}.`, { variant: 'success' });
    } else if (attribute === 'enabled') {
      enqueueSnackbar(`Bulk operation set ${value ? 'enabled' : 'disabled'}.`, { variant: 'success' });
    } else if (attribute === 'permission') {
      enqueueSnackbar(`Bulk operation set permission to ${permissions.find(o => o.id === value)?.name}.`, { variant: 'success' });
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
  }, [ enqueueSnackbar, items, permissions, selection ]);

  const bulkDelete =  useCallback(async () => {
    for (const selected of selection) {
      const item = items.find(o => o.id === selected);
      if (item) {
        await new Promise<void>((resolve) => {
          getSocket('/systems/alias').emit('generic::deleteById', item.id, () => {
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
      <DisabledAlert system='alias'/>
      <Grid container sx={{ pb: 0.7 }} spacing={1} alignItems='center'>
        <Grid item>
          <Button sx={{ width: 200 }} variant="contained" onClick={() => {
            router.push('/commands/alias/create/');
          }}>Create new alias</Button>
        </Grid>
        <Grid item>
          <Button sx={{ width: 200 }} variant="contained" onClick={() => {
            router.push('/commands/alias/group/edit');
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
          <ButtonsPermissionsBulk disabled={bulkCount === 0} onSelect={permId => bulkToggleAttribute('permission', permId)}/>
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
                defaultSorting={[{ columnName: 'group', direction: 'asc' }, { columnName: 'alias', direction: 'asc' }, { columnName: 'enabled', direction: 'asc' }]}
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
      <AliasEdit aliasGroups={groupsSettings} aliases={items}/>
    </>
  );
};

PageCommandsAlias.getLayout = function getLayout(page: ReactElement) {
  return (
    <Layout>
      {page}
    </Layout>
  );
};

export default PageCommandsAlias;
