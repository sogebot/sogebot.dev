import { Filter, FilteringState, IntegratedFiltering, IntegratedSelection, IntegratedSorting, SelectionState, SortingState } from '@devexpress/dx-react-grid';
import { Grid as DataGrid, Table, TableColumnVisibility, TableHeaderRow, TableSelection } from '@devexpress/dx-react-grid-material-ui';
import { CheckBoxTwoTone, DisabledByDefaultTwoTone } from '@mui/icons-material';
import { Button, CircularProgress, Dialog, Grid, Stack, Tooltip, Typography } from '@mui/material';
import { Keyword, KeywordGroup } from '@sogebot/backend/dest/database/entity/keyword';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import SimpleBar from 'simplebar-react';

import { ButtonsDeleteBulk } from '../../components/Buttons/DeleteBulk';
import { DeleteButton } from '../../components/Buttons/DeleteButton';
import EditButton from '../../components/Buttons/EditButton';
import { ButtonsGroupBulk } from '../../components/Buttons/GroupBulk';
import LinkButton from '../../components/Buttons/LinkButton';
import { DisabledAlert } from '../../components/DisabledAlert';
import { KeywordEdit } from '../../components/Form/KeywordEdit';
import { BoolTypeProvider } from '../../components/Table/BoolTypeProvider';
import { GroupTypeProvider } from '../../components/Table/GroupTypeProvider';
import { PermissionTypeProvider } from '../../components/Table/PermissionTypeProvider';
import { Responses } from '../../components/Table/Responses';
import getAccessToken from '../../getAccessToken';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { useColumnMaker } from '../../hooks/useColumnMaker';
import { useFilter } from '../../hooks/useFilter';
import { setBulkCount } from '../../store/appbarSlice';

const PageCommandsKeyword = () => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { type, id } = useParams();
  const { enqueueSnackbar } = useSnackbar();

  const [ items, setItems ] = useState<Keyword[]>([]);
  const [ groupsSettings, setGroupsSettings ] = useState<KeywordGroup[]>([]);
  const [ loading, setLoading ] = useState(true);
  const { bulkCount } = useAppSelector(state => state.appbar);
  const [ selection, setSelection ] = useState<(string|number)[]>([]);

  const { useFilterSetup, columns, tableColumnExtensions, sortingTableExtensions, defaultHiddenColumnNames, filteringColumnExtensions } = useColumnMaker<Keyword>([
    {
      columnName: 'keyword',
      filtering:  { type: 'string' },
      column:     {
        getCellValue: (row) => [
          <Stack key="kwdStack">
            <strong key="keyword">{row.keyword}</strong>
            <Responses key="responses" responses={row.responses}/>
          </Stack>,
        ],
      },
      predicate: (value: string, filter: Filter, row: any) => {
        const fValue = filter.value.toLowerCase();
        if (filter.operation === 'contains') {
          return row.keyword.toLowerCase().includes(fValue) || row.responses.filter((response: any) => response.response.toLowerCase().includes(fValue)).length > 0;
        }

        if (filter.operation === 'equal') {
          return row.keyword.toLowerCase() === fValue || row.responses.filter((response: any) => response.response.toLowerCase() === fValue).length > 0;
        }

        if (filter.operation === 'notEqual') {
          return row.keyword.toLowerCase() !== fValue && row.responses.filter((response: any) => response.response.toLowerCase() !== fValue).length > 0;
        }

        return IntegratedFiltering.defaultPredicate(value, filter, row);
      },
    },
    {
      columnName: 'enabled', filtering: { type: 'boolean' }, table: { align: 'center' },
    },
    {
      columnName: 'group',
      column:     { getCellValue: (row) => row.group ? row.group : '_ungroup' },
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
    },
    {
      columnName:  'actions',
      table:       { width: 130 },
      sorting:     { sortingEnabled: false },
      translation: ' ',
      column:      {
        getCellValue: (row) => [
          <Stack direction="row" key="row">
            <EditButton href={'/commands/keywords/edit/' + row.id}/>
            <DeleteButton key='delete' onDelete={() => deleteItem(row)} />
          </Stack>,
        ],
      },
    },
  ]);

  const groups = useMemo(() => {
    return Array.from(new Set(items.map(o => o.group)));
  }, [items]);

  const deleteItem = useCallback((item: Keyword) => {
    axios.delete(`${JSON.parse(localStorage.server)}/api/systems/keywords/${item.id}`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
      .finally(() => {
        enqueueSnackbar(`Keyword ${item.keyword} deleted successfully.`, { variant: 'success' });
        refresh();
      });
  }, [ enqueueSnackbar ]);

  const { element: filterElement, filters } = useFilter(useFilterSetup);

  useEffect(() => {
    refresh().then(() => setLoading(false));
  }, [location.pathname]);

  const refresh = async () => {
    await Promise.all([
      new Promise<void>(resolve => {
        axios.get(`${JSON.parse(localStorage.server)}/api/systems/keywords`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
          .then(({ data }) => {
            setItems(data.data);
            resolve();
          });
      }),
      new Promise<void>(resolve => {
        axios.get(`${JSON.parse(localStorage.server)}/api/systems/keywords/groups`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
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
          axios.post(`${JSON.parse(localStorage.server)}/api/systems/keywords`, item, { headers: { authorization: `Bearer ${getAccessToken()}` } })
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
          axios.delete(`${JSON.parse(localStorage.server)}/api/systems/keywords/${item.id}`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
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
        <DisabledAlert system='keywords'/>
        <Grid item>
          <LinkButton sx={{ width: 200 }} variant="contained" href='/commands/keywords/create/'>Create new keyword</LinkButton>
        </Grid>
        <Grid item>
          <LinkButton sx={{ width: 200 }} variant="contained" href='/commands/keywords/group/edit' color='secondary'>Group settings</LinkButton>
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
        : <SimpleBar style={{ maxHeight: 'calc(100vh - 116px)' }} autoHide={false}>
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
                columnName: 'keyword', direction: 'asc',
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
        </SimpleBar>}

      <Dialog
        open={open}
        fullWidth
        maxWidth='md'>
        {open && <KeywordEdit groups={groupsSettings}/>}
      </Dialog>
    </>
  );
};

export default PageCommandsKeyword;
