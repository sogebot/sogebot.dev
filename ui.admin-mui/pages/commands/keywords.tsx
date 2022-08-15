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
import { Keyword, KeywordGroup } from '@entity/keyword';
import { CheckBoxTwoTone, DisabledByDefaultTwoTone } from '@mui/icons-material';
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
import { KeywordEdit } from '~/src/components/RightDrawer/KeywordEdit';
import { BoolTypeProvider } from '~/src/components/Table/BoolTypeProvider';
import { GroupTypeProvider } from '~/src/components/Table/GroupTypeProvider';
import { PermissionTypeProvider } from '~/src/components/Table/PermissionTypeProvider';
import { Responses } from '~/src/components/Table/Responses';
import getAccessToken from '~/src/getAccessToken';
import { useBoolFilter } from '~/src/hooks/Table/useBoolFilter';
import { usePermissionsFilter } from '~/src/hooks/Table/usePermissionsFilter';
import { useTranslation } from '~/src/hooks/useTranslation';
import { setBulkCount } from '~/src/store/appbarSlice';

const PageCommandsKeyword: NextPageWithLayout = () => {
  const { translate } = useTranslation();
  const dispatch = useDispatch();
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();

  const [ items, setItems ] = useState<Keyword[]>([]);
  const [ groupsSettings, setGroupsSettings ] = useState<KeywordGroup[]>([]);
  const [ loading, setLoading ] = useState(true);
  const { bulkCount } = useSelector((state: any) => state.appbar);
  const [ selection, setSelection ] = useState<(string|number)[]>([]);
  const { Cell: PermissionFilterCell } = usePermissionsFilter();
  const { Cell: BoolFilterCell } = useBoolFilter();
  const [tableColumnExtensions] = useState([
    { columnName: 'keyword', width: '70%' },
    { columnName: 'enabled', align: 'center' },
    {
      columnName: 'actions', width: 130, filteringEnabled: false, sortingEnabled: false,
    },
  ]);
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

  const deleteItem = useCallback((item: Keyword) => {
    axios.delete(`${localStorage.server}/api/systems/keywords/${item.id}`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
      .finally(() => {
        enqueueSnackbar(`Keyword ${item.keyword} deleted successfully.`, { variant: 'success' });
        refresh();
      });
  }, [ enqueueSnackbar ]);

  const columns = useMemo<Column[]>(() => [
    {
      name:         'keyword',
      title:        capitalize(translate('keyword')),
      getCellValue: (row) => [
        <Stack key="kwdStack">
          <strong key="keyword">{row.keyword}</strong>
          <Responses key="responses" responses={row.responses}/>
        </Stack>,
      ],
    },
    { name: 'enabled', title: capitalize(translate('enabled')) },
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
              router.push('/commands/keywords/edit/' + row.id);
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
    await Promise.all([
      new Promise<void>(resolve => {
        axios.get(`${localStorage.server}/api/systems/keywords`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
          .then(({ data }) => {
            setItems(data.data);
            resolve();
          });
      }),
      new Promise<void>(resolve => {
        axios.get(`${localStorage.server}/api/systems/keywords/groups`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
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
        if (filter.columnName === 'keyword') {
          shouldShow = item.keyword.toLowerCase().includes(filter.value.toLowerCase()) || item.responses.map(o => o.response.toLowerCase()).filter(o => o.includes(filter.value.toLowerCase())).length > 0;
        } else if (filter.columnName === 'group') {
          shouldShow = filter.value.length > 0 ? filter.value.includes(item.group || '') : true;
        } if (filter.columnName === 'enabled') {
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

  const bulkToggleAttribute = useCallback(async <T extends keyof Keyword>(attribute: T, value: Keyword[T]) => {
    for (const selected of selection) {
      const item = items.find(o => o.id === selected);
      if (item && item[attribute] !== value) {
        await new Promise<void>((resolve) => {
          item[attribute] = value;
          axios.post(`${localStorage.server}/api/systems/keywords`, item, { headers: { authorization: `Bearer ${getAccessToken()}` } })
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

  const bulkDelete =  useCallback(async () => {
    for (const selected of selection) {
      const item = items.find(o => o.id === selected);
      if (item) {
        await new Promise<void>((resolve) => {
          axios.delete(`${localStorage.server}/api/systems/keywords/${item.id}`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
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
      <DisabledAlert system='keywords'/>
      <Grid container sx={{ pb: 0.7 }} spacing={1} alignItems='center'>
        <Grid item>
          <Button sx={{ width: 200 }} variant="contained" onClick={() => {
            router.push('/commands/keywords/create/');
          }}>Create new keyword</Button>
        </Grid>
        <Grid item>
          <Button sx={{ width: 200 }} variant="contained" onClick={() => {
            router.push('/commands/keywords/group/edit');
          }} color='secondary'>Group settings</Button>
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
                defaultSorting={[{ columnName: 'group', direction: 'asc' }, { columnName: 'keyword', direction: 'asc' }]}
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
      <KeywordEdit groups={groupsSettings} items={items}/>
    </>
  );
};

PageCommandsKeyword.getLayout = function getLayout(page: ReactElement) {
  return (
    <Layout>
      {page}
    </Layout>
  );
};

export default PageCommandsKeyword;
