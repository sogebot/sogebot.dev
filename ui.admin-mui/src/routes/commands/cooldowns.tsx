import { FilteringState, IntegratedFiltering, IntegratedSelection, IntegratedSorting, SelectionState, SortingState } from '@devexpress/dx-react-grid';
import { Grid as DataGrid, Table, TableColumnVisibility, TableHeaderRow, TableSelection } from '@devexpress/dx-react-grid-material-ui';
import { CheckBoxTwoTone, DisabledByDefaultTwoTone, NotificationsActiveTwoTone, NotificationsOffTwoTone } from '@mui/icons-material';
import { Button, CircularProgress, Dialog, Grid, Stack, Tooltip, Typography } from '@mui/material';
import { Cooldown } from '@sogebot/backend/dest/database/entity/cooldown';
import axios from 'axios';
import humanizeDuration from 'humanize-duration';
import capitalize from 'lodash/capitalize';
import { useSnackbar } from 'notistack';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import SimpleBar from 'simplebar-react';

import { ButtonsDeleteBulk } from '../../components/Buttons/DeleteBulk';
import { DeleteButton } from '../../components/Buttons/DeleteButton';
import EditButton from '../../components/Buttons/EditButton';
import LinkButton from '../../components/Buttons/LinkButton';
import { DisabledAlert } from '../../components/DisabledAlert';
import { CooldownEdit } from '../../components/Form/CooldownEdit';
import { BoolTypeProvider } from '../../components/Table/BoolTypeProvider';
import getAccessToken from '../../getAccessToken';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { ColumnMakerProps, useColumnMaker } from '../../hooks/useColumnMaker';
import { useFilter } from '../../hooks/useFilter';
import { useScope } from '../../hooks/useScope';
import { useTranslation } from '../../hooks/useTranslation';
import { setBulkCount } from '../../store/appbarSlice';

const PageCommandsCooldown = () => {
  const scope = useScope('systems:cooldown');

  const { translate } = useTranslation();
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { type, id } = useParams();
  const { enqueueSnackbar } = useSnackbar();
  const { configuration } = useAppSelector(state => state.loader);

  const [ items, setItems ] = useState<Required<Cooldown>[]>([]);
  const [ loading, setLoading ] = useState(true);
  const { bulkCount } = useAppSelector(state => state.appbar);
  const [ selection, setSelection ] = useState<(string|number)[]>([]);

  const columnsTpl: ColumnMakerProps<Cooldown> = [
    {
      columnName:  'name',
      table:       { width: '25%' },
      translation: '!' + translate('command') + ', ' + translate('keyword') + ' ' + translate('or') + ' g:' + translate('group'),
      filtering:   { type: 'string' },
    },
    {
      columnName: 'type',
      column:     { getCellValue: (row) => capitalize(translate(row.type)) },
      filtering:  { type: 'string' },
    },
    {
      columnName:     'miliseconds',
      translationKey: 'cooldown',
      table:          { align: 'right' },
      column:         { getCellValue: (row) => humanizeDuration(row.miliseconds, { language: configuration.lang }) },
    },
    {
      columnName:     'isEnabled',
      table:          { align: 'center' },
      translationKey: 'enabled',
      filtering:      { type: 'boolean' },
    },
    {
      columnName:     'isErrorMsgQuiet',
      table:          { align: 'center' },
      translationKey: 'quiet',
      filtering:      { type: 'boolean' },
    },
    {
      columnName:     'isOwnerAffected',
      table:          { align: 'center' },
      translationKey: 'core.permissions.casters',
      filtering:      { type: 'boolean' },
    },
    {
      columnName:     'isModeratorAffected',
      table:          { align: 'center' },
      translationKey: 'core.permissions.moderators',
      filtering:      { type: 'boolean' },
    },
    {
      columnName:     'isSubscriberAffected',
      table:          { align: 'center' },
      translationKey: 'core.permissions.subscribers',
      filtering:      { type: 'boolean' },
    },
  ];

  if (scope.manage) {
    columnsTpl.push({
      columnName:  'actions',
      table:       { width: 130 },
      sorting:     { sortingEnabled: false },
      translation: ' ',
      column:      {
        getCellValue: (row) => [
          <Stack direction="row" key="row">
            <EditButton href={'/commands/cooldowns/edit/' + row.id}/>
            <DeleteButton key='delete' onDelete={() => deleteItem(row)} />
          </Stack>,
        ],
      },
    });
  }

  const { useFilterSetup, columns, tableColumnExtensions, sortingTableExtensions, defaultHiddenColumnNames, filteringColumnExtensions } = useColumnMaker<Cooldown>(columnsTpl);

  const deleteItem = useCallback((item: Cooldown) => {
    axios.delete(`/api/systems/cooldown/${item.id}`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
      .finally(() => {
        enqueueSnackbar(`Cooldown ${item.name} deleted successfully.`, { variant: 'success' });
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
        axios.get(`/api/systems/cooldown`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
          .then(({ data }) => {
            setItems(data.data);
            resolve();
          });
      }),
    ]);
  };

  useEffect(() => {
    dispatch(setBulkCount(selection.length));
  }, [selection, dispatch]);

  const bulkCanBeLoud = useMemo(() => {
    for (const itemId of selection) {
      const item = items.find(o => o.id === itemId);
      if (item && item.isErrorMsgQuiet) {
        return true;
      }
    }
    return false;
  }, [ selection, items ]);

  const bulkCanBeQuiet = useMemo(() => {
    for (const itemId of selection) {
      const item = items.find(o => o.id === itemId);
      if (item && !item.isErrorMsgQuiet) {
        return true;
      }
    }
    return false;
  }, [ selection, items ]);

  const bulkCanEnable = useMemo(() => {
    for (const itemId of selection) {
      const item = items.find(o => o.id === itemId);
      if (item && !item.isEnabled) {
        return true;
      }
    }
    return false;
  }, [ selection, items ]);

  const bulkCanDisable = useMemo(() => {
    for (const itemId of selection) {
      const item = items.find(o => o.id === itemId);
      if (item && item.isEnabled) {
        return true;
      }
    }
    return false;
  }, [ selection, items ]);

  const bulkToggleAttribute = useCallback(async <T extends keyof Required<Cooldown>>(attribute: T, value: Required<Cooldown>[T]) => {
    for (const selected of selection) {
      const item = items.find(o => o.id === selected);
      if (item && item[attribute] !== value) {
        await new Promise<void>((resolve) => {
          item[attribute] = value;
          axios.post(`/api/systems/cooldown`,
            { ...item },
            { headers: { authorization: `Bearer ${getAccessToken()}` } })
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

    if (attribute === 'isEnabled') {
      enqueueSnackbar(`Bulk operation set ${value ? 'enabled' : 'disabled'}.`, { variant: 'success' });
    }

    refresh();
  }, [ enqueueSnackbar, items, selection ]);

  const bulkDelete =  useCallback(async () => {
    for (const selected of selection) {
      const item = items.find(o => o.id === selected);
      if (item) {
        await new Promise<void>((resolve) => {
          axios.delete(`/api/systems/cooldown/${item.id}`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
            .finally(() => resolve());
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
        <DisabledAlert system='cooldown'/>
        {scope.manage && <Grid item>
          <LinkButton sx={{ width: 220 }} variant="contained" href='/commands/cooldowns/create/'>Create new cooldown</LinkButton>
        </Grid>}
        {scope.manage && <>
          <Grid item>
            <Tooltip arrow title="Enable">
              <Button disabled={!bulkCanEnable} variant="contained" color="secondary" sx={{
                minWidth: '36px', width: '36px',
              }} onClick={() => bulkToggleAttribute('isEnabled', true)}><CheckBoxTwoTone/></Button>
            </Tooltip>
          </Grid>
          <Grid item>
            <Tooltip arrow title="Disable">
              <Button disabled={!bulkCanDisable} variant="contained" color="secondary" sx={{
                minWidth: '36px', width: '36px',
              }} onClick={() => bulkToggleAttribute('isEnabled', false)}><DisabledByDefaultTwoTone/></Button>
            </Tooltip>
          </Grid>
          <Grid item>
            <Tooltip arrow title="Error message will appear in chat">
              <Button disabled={!bulkCanBeLoud} variant="contained" color="secondary" sx={{
                minWidth: '36px', width: '36px',
              }} onClick={() => bulkToggleAttribute('isErrorMsgQuiet', false)}><NotificationsActiveTwoTone/></Button>
            </Tooltip>
          </Grid>
          <Grid item>
            <Tooltip arrow title="Hide error messages in chat">
              <Button disabled={!bulkCanBeQuiet} variant="contained" color="secondary" sx={{
                minWidth: '36px', width: '36px',
              }} onClick={() => bulkToggleAttribute('isErrorMsgQuiet', true)}><NotificationsOffTwoTone/></Button>
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
            <BoolTypeProvider
              for={['isEnabled', 'isErrorMsgQuiet', 'isOwnerAffected', 'isModeratorAffected', 'isSubscriberAffected']}
            />

            <SortingState
              defaultSorting={[{
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
            <TableSelection showSelectAll/>
          </DataGrid>
        </SimpleBar>}

      <Dialog
        open={open}
        fullWidth
        maxWidth='md'>
        {open && <CooldownEdit items={items}/>}
      </Dialog>
    </>
  );
};

export default PageCommandsCooldown;
