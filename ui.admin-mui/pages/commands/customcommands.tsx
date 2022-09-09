import {
  Column,
  Filter,
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
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
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
import { useFilter } from '~/src/hooks/useFilter';
import { useTranslation } from '~/src/hooks/useTranslation';
import { setBulkCount } from '~/src/store/appbarSlice';

type CommandWithCount = Commands & { count:number };

const PageCommandsCommands: NextPageWithLayout = () => {
  const { translate } = useTranslation();
  const dispatch = useDispatch();
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();

  const [ items, setItems ] = useState<CommandWithCount[]>([]);
  const [ groupsSettings, setGroupsSettings ] = useState<CommandsGroup[]>([]);
  const [ loading, setLoading ] = useState(true);
  const { bulkCount } = useSelector((state: any) => state.appbar);
  const [ selection, setSelection ] = useState<(string|number)[]>([]);

  const { element: filterElement, filters, customPredicate } = useFilter<CommandWithCount>([
    { columnName: 'command', type: 'string' },
    { columnName: 'enabled', type: 'boolean' },
    { columnName: 'visible', type: 'boolean' },
    { columnName: 'count', type: 'number' },
    {
      columnName: 'group', type:       'list', options:    {
        showDisabled:  true,
        disabledName:  'Ungrouped',
        disabledValue: '_ungroup',
        listValues:    groupsSettings
          .filter(group => group.name !== 'undefined')
          .map(group => group.name),
      },
    },
  ]);

  const tableColumnExtensions = [
    {
      columnName: 'command', width:      '50%', predicate:  (value: string, filter: Filter, row: any) => {
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
    },
    { columnName: 'count', align: 'right' },
    { columnName: 'enabled', align: 'center' },
    { columnName: 'visible', align: 'center' },
    { columnName: 'group', predicate: customPredicate },
    {
      columnName: 'actions', width: 130, filteringEnabled: false, sortingEnabled: false,
    },
  ];

  const groups = useMemo(() => {
    return Array.from(new Set(items.map(o => o.group)));
  }, [items]);

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
                defaultSorting={[{ columnName: 'group', direction: 'asc' }, { columnName: 'command', direction: 'asc' }]}
                columnExtensions={tableColumnExtensions as any}
              />
              <IntegratedSorting />
              <FilteringState filters={filters} columnExtensions={tableColumnExtensions as any}/>
              <IntegratedFiltering columnExtensions={tableColumnExtensions as any}/>

              <SelectionState
                selection={selection}
                onSelectionChange={setSelection}
              />
              <IntegratedSelection/>
              <Table columnExtensions={tableColumnExtensions as any}/>
              <TableHeaderRow showSortingControls/>
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
