import {
  FilteringState,
  IntegratedFiltering,
  IntegratedSelection,
  IntegratedSorting,
  SelectionState,
  SortingState,
} from '@devexpress/dx-react-grid';
import {
  Grid as DataGrid,
  Table,
  TableColumnVisibility,
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
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
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
import { useColumnMaker } from '~/src/hooks/useColumnMaker';
import { useFilter } from '~/src/hooks/useFilter';
import { usePermissions } from '~/src/hooks/usePermissions';
import { setBulkCount } from '~/src/store/appbarSlice';

const PageCommandsAlias: NextPageWithLayout = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();

  const [ items, setItems ] = useState<Alias[]>([]);
  const [ groupsSettings, setGroupsSettings ] = useState<AliasGroup[]>([]);
  const [ loading, setLoading ] = useState(true);
  const { bulkCount } = useSelector((state: any) => state.appbar);
  const { permissions } = usePermissions();
  const [ selection, setSelection ] = useState<(string|number)[]>([]);

  const { useFilterSetup, columns, tableColumnExtensions, sortingTableExtensions, defaultHiddenColumnNames, filteringColumnExtensions } = useColumnMaker<Alias>([
    {
      columnName: 'alias', filtering: { type: 'string' },
    },
    {
      columnName: 'command', filtering: { type: 'string' }, table: { width: '40%' },
    },
    {
      columnName: 'group',
      column:     { getCellValue: (row) => row.group ? row.group : '_ungroup' },
      filtering:  {
        type:    'list' ,
        options: {
          showDisabled:  true,
          disabledName:  'Ungrouped',
          disabledValue: '_ungroup',
          listValues:    groupsSettings
            .filter(group => group.name !== 'undefined')
            .map(group => group.name),
        },
      },
    },
    {
      columnName: 'permission', filtering: { type: 'permission' }, column: { getCellValue: (row) => row.permission === null ? '_disabled' : getPermissionName(row.permission, permissions || []) },
    },
    {
      columnName: 'visible', filtering: { type: 'boolean' }, table: { align: 'center' },
    },
    {
      columnName: 'enabled', table: { align: 'center' }, filtering: { type: 'boolean' },
    },
    {
      columnName:  'actions',
      translation: ' ',
      table:       { width: 130 },
      sorting:     { sortingEnabled: false },
      column:      {
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
    },
  ]);

  const { element: filterElement, filters } = useFilter<Alias>(useFilterSetup);

  const groups = useMemo(() => {
    return Array.from(new Set(items.map(o => o.group)));
  }, [items]);

  const deleteItem = useCallback((item: Alias) => {
    getSocket('/systems/alias').emit('generic::deleteById', item.id, () => {
      enqueueSnackbar(`Alias ${item.alias} deleted successfully.`, { variant: 'success' });
      refresh();
    });
  }, [ enqueueSnackbar ]);

  useEffect(() => {
    refresh().then(() => setLoading(false));
  }, [router]);

  const refresh = async () => {
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
      <Grid container sx={{ pb: 0.7 }} spacing={1} alignItems='center'>
        <DisabledAlert system='alias'/>
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
          <ButtonsPermissionsBulk disabled={bulkCount === 0} onSelect={permId => bulkToggleAttribute('permission', permId)}/>
        </Grid>
        <Grid item>
          <ButtonsDeleteBulk disabled={bulkCount === 0} onDelete={bulkDelete}/>
        </Grid>
        <Grid item>{filterElement}</Grid>
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
              rows={items}
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
                defaultSorting={[{
                  columnName: 'group', direction: 'asc',
                }, {
                  columnName: 'alias', direction: 'asc',
                }, {
                  columnName: 'enabled', direction: 'asc',
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
              <IntegratedSelection/>
              <Table columnExtensions={tableColumnExtensions}/>
              <TableHeaderRow showSortingControls/>
              <TableColumnVisibility
                defaultHiddenColumnNames={defaultHiddenColumnNames}
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
