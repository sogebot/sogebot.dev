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
import {
  CheckBoxTwoTone, DisabledByDefaultTwoTone, NotificationsActiveTwoTone, NotificationsOffTwoTone,
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
import { Cooldown } from '@sogebot/backend/dest/database/entity/cooldown';
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
import { GridActionAliasMenu } from '~/src/components/GridAction/AliasMenu';
import { Layout } from '~/src/components/Layout/main';
import { CooldownEdit } from '~/src/components/RightDrawer/CooldownEdit';
import { BoolTypeProvider } from '~/src/components/Table/BoolTypeProvider';
import getAccessToken from '~/src/getAccessToken';
import { useBoolFilter } from '~/src/hooks/Table/useBoolFilter';
import { useNumberFilter } from '~/src/hooks/Table/useNumberFilter';
import { useTranslation } from '~/src/hooks/useTranslation';
import { setBulkCount } from '~/src/store/appbarSlice';
import toReadableMiliseconds from '~/src/toReadableMiliseconds';

const PageCommandsCooldown: NextPageWithLayout = () => {
  const { translate } = useTranslation();
  const dispatch = useDispatch();
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();

  const [ items, setItems ] = useState<Required<Cooldown>[]>([]);
  const [ loading, setLoading ] = useState(true);
  const { bulkCount } = useSelector((state: any) => state.appbar);
  const [ selection, setSelection ] = useState<(string|number)[]>([]);
  const { Cell: BoolFilterCell } = useBoolFilter();
  const { Cell: NumberFilterCell } = useNumberFilter();
  const tableColumnExtensions = [
    { columnName: 'name', width: '40%' },

    { columnName: 'miliseconds', align: 'right' },

    { columnName: 'isEnabled', align: 'center' },
    { columnName: 'isErrorMsgQuiet', align: 'center' },
    { columnName: 'isOwnerAffected', align: 'center' },
    { columnName: 'isModeratorAffected', align: 'center' },
    { columnName: 'isSubscriberAffected', align: 'center' },
    {
      columnName: 'actions', width: 130, filteringEnabled: false, sortingEnabled: false,
    },
  ];
  const [filters, setFilters] = useState<Filter[]>([]);

  const deleteItem = useCallback((item: Cooldown) => {
    axios.delete(`${localStorage.server}/api/systems/cooldown/${item.id}`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
      .finally(() => {
        enqueueSnackbar(`Cooldown ${item.name} deleted successfully.`, { variant: 'success' });
        refresh();
      });
  }, [ enqueueSnackbar ]);

  const columns = useMemo<Column[]>(() => [
    {
      name:  'name',
      title: '!' + translate('command') + ', ' + translate('keyword') + ' ' + translate('or') + ' g:' + translate('group'),
    },
    {
      name:         'type',
      title:        capitalize(translate('type')),
      getCellValue: (row) => capitalize(translate(row.type)),
    },
    {
      name:         'miliseconds',
      title:        capitalize(translate('cooldown')),
      getCellValue: (row) => toReadableMiliseconds(row.miliseconds),
    },
    { name: 'isEnabled', title: capitalize(translate('enabled')) },
    { name: 'isErrorMsgQuiet', title: capitalize(translate('quiet')) },
    { name: 'isOwnerAffected', title: capitalize(translate('core.permissions.casters')) },
    { name: 'isModeratorAffected', title: capitalize(translate('core.permissions.moderators')) },
    { name: 'isSubscriberAffected', title: capitalize(translate('core.permissions.subscribers')) },
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
              router.push('/commands/cooldowns/edit/' + row.id);
            }}>Edit</Button>
          <GridActionAliasMenu key='delete' onDelete={() => deleteItem(row)} />
        </Stack>,
      ],
    },
  ], [ translate, router, deleteItem ]);

  const FilterCell = useCallback((props: any) => {
    const { column } = props;
    if (['isEnabled', 'isErrorMsgQuiet', 'isOwnerAffected', 'isModeratorAffected', 'isSubscriberAffected'].includes(column.name)) {
      return <BoolFilterCell {...props} />;
    }
    if (column.name === 'miliseconds') {
      return <NumberFilterCell {...props} />;
    }
    return <TableFilterRow.Cell {...props} />;
  }, [BoolFilterCell, NumberFilterCell]);

  useEffect(() => {
    refresh().then(() => setLoading(false));
  }, [router]);

  const refresh = async () => {
    await Promise.all([
      new Promise<void>(resolve => {
        axios.get(`${localStorage.server}/api/systems/cooldown`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
          .then(({ data }) => {
            setItems(data.data);
            resolve();
          });
      }),
    ]);
  };

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      let shouldShow = true;

      for (const filter of filters) {
        if (filter.columnName === 'name') {
          shouldShow = item.name.toLowerCase().includes(filter.value.toLowerCase());
        } else if (filter.columnName === 'type') {
          shouldShow = item.type.toLowerCase().includes(filter.value.toLowerCase());
        } else if (filter.columnName === 'isEnabled') {
          shouldShow = filter.value === item.isEnabled;
        } else if (filter.columnName === 'isErrorMsgQuiet') {
          shouldShow = filter.value === item.isErrorMsgQuiet;
        } else if (filter.columnName === 'isOwnerAffected') {
          shouldShow = filter.value === item.isOwnerAffected;
        } else if (filter.columnName === 'isModeratorAffected') {
          shouldShow = filter.value === item.isModeratorAffected;
        } else if (filter.columnName === 'isSubscriberAffected') {
          shouldShow = filter.value === item.isSubscriberAffected;
        } else if (filter.columnName === 'miliseconds' && filter.value !== '') {
          if ((filter as any).type === '>') {
            shouldShow = item.miliseconds > Number(filter.value);
          } else if ((filter as any).type === '=') {
            shouldShow = item.miliseconds === Number(filter.value);
          } else if ((filter as any).type === '<') {
            shouldShow = item.miliseconds < Number(filter.value);
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
          axios.post(`${localStorage.server}/api/systems/cooldown`,
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
          axios.delete(`${localStorage.server}/api/systems/cooldown/${item.id}`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
            .finally(() => resolve());
        });
      }
    }
    setItems(i => i.filter(item => !selection.includes(item.id)));
    enqueueSnackbar(`Bulk operation deleted items.`, { variant: 'success' });
    setSelection([]);
  }, [ selection, enqueueSnackbar, items ]);

  return (
    <>
      <DisabledAlert system='cooldown'/>
      <Grid container sx={{ pb: 0.7 }} spacing={1} alignItems='center'>
        <Grid item>
          <Button sx={{ width: 220 }} variant="contained" onClick={() => {
            router.push('/commands/cooldowns/create/');
          }}>Create new cooldown</Button>
        </Grid>
        <Grid item>
          <Tooltip arrow title="Enable">
            <Button disabled={!bulkCanEnable} variant="contained" color="secondary" sx={{ minWidth: '36px', width: '36px' }} onClick={() => bulkToggleAttribute('isEnabled', true)}><CheckBoxTwoTone/></Button>
          </Tooltip>
        </Grid>
        <Grid item>
          <Tooltip arrow title="Disable">
            <Button disabled={!bulkCanDisable} variant="contained" color="secondary" sx={{ minWidth: '36px', width: '36px' }} onClick={() => bulkToggleAttribute('isEnabled', false)}><DisabledByDefaultTwoTone/></Button>
          </Tooltip>
        </Grid>
        <Grid item>
          <Tooltip arrow title="Error message will appear in chat">
            <Button disabled={!bulkCanBeLoud} variant="contained" color="secondary" sx={{ minWidth: '36px', width: '36px' }} onClick={() => bulkToggleAttribute('isErrorMsgQuiet', false)}><NotificationsActiveTwoTone/></Button>
          </Tooltip>
        </Grid>
        <Grid item>
          <Tooltip arrow title="Hide error messages in chat">
            <Button disabled={!bulkCanBeQuiet} variant="contained" color="secondary" sx={{ minWidth: '36px', width: '36px' }} onClick={() => bulkToggleAttribute('isErrorMsgQuiet', true)}><NotificationsOffTwoTone/></Button>
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
              <BoolTypeProvider
                for={['isEnabled', 'isErrorMsgQuiet', 'isOwnerAffected', 'isModeratorAffected', 'isSubscriberAffected']}
              />

              <SortingState
                defaultSorting={[{ columnName: 'command', direction: 'asc' }]}
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
      <CooldownEdit items={items}/>
    </>
  );
};

PageCommandsCooldown.getLayout = function getLayout(page: ReactElement) {
  return (
    <Layout>
      {page}
    </Layout>
  );
};

export default PageCommandsCooldown;
