import {
  Column,
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
import { Price } from '@entity/price';
import {
  CheckBoxTwoTone, DisabledByDefaultTwoTone, SignalWifi4Bar, SignalWifiOffTwoTone,
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
import { GridActionAliasMenu } from '~/src/components/GridAction/AliasMenu';
import { Layout } from '~/src/components/Layout/main';
import { PriceEdit } from '~/src/components/RightDrawer/PriceEdit';
import { BoolTypeProvider } from '~/src/components/Table/BoolTypeProvider';
import getAccessToken from '~/src/getAccessToken';
import { useFilter } from '~/src/hooks/useFilter';
import { useTranslation } from '~/src/hooks/useTranslation';
import { setBulkCount } from '~/src/store/appbarSlice';

const PageCommandsPrice: NextPageWithLayout = () => {
  const { translate } = useTranslation();
  const dispatch = useDispatch();
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();

  const [ items, setItems ] = useState<Required<Price>[]>([]);
  const [ loading, setLoading ] = useState(true);
  const { bulkCount } = useSelector((state: any) => state.appbar);
  const [ selection, setSelection ] = useState<(string|number)[]>([]);
  const tableColumnExtensions = [
    { columnName: 'command', width: '40%' },
    { columnName: 'enabled', align: 'center' },
    { columnName: 'emitRedeemEvent', align: 'center' },
    { columnName: 'price', align: 'right' },
    { columnName: 'priceBits', align: 'right' },
    {
      columnName: 'actions', width: 130, filteringEnabled: false, sortingEnabled: false,
    },
  ];

  const { element: filterElement, filters } = useFilter<Price>([
    { columnName: 'command', type: 'string' },
    { columnName: 'enabled', type: 'boolean' },
    {
      columnName: 'emitRedeemEvent', type: 'boolean', translationKey: 'systems.price.emitRedeemEvent',
    },
    {
      columnName: 'price', type: 'number', translation: capitalize(translate('systems.price.price.name') + ' (points)'),
    },
    {
      columnName: 'priceBits', type: 'number', translation: capitalize(translate('systems.price.price.name') + ' (bits)'),
    },
  ]);

  const deleteItem = useCallback((item: Price) => {
    axios.delete(`${localStorage.server}/api/systems/price/${item.id}`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
      .finally(() => {
        enqueueSnackbar(`Price ${item.command} deleted successfully.`, { variant: 'success' });
        refresh();
      });
  }, [ enqueueSnackbar ]);

  const columns = useMemo<Column[]>(() => [
    {
      name:  'command',
      title: capitalize(translate('command')),
    },
    { name: 'enabled', title: capitalize(translate('enabled')) },
    { name: 'emitRedeemEvent', title: capitalize(translate('systems.price.emitRedeemEvent')) },
    { name: 'price', title: capitalize(translate('systems.price.price.name') + ' (points)') },
    { name: 'priceBits', title: capitalize(translate('systems.price.price.name') + ' (bits)') },
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
              router.push('/commands/price/edit/' + row.id);
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
        axios.get(`${localStorage.server}/api/systems/price`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
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
        if (filter.columnName === 'command') {
          shouldShow = item.command.toLowerCase().includes(filter.value.toLowerCase());
        } else if (filter.columnName === 'enabled') {
          shouldShow = filter.value === item.enabled;
        } else if (filter.columnName === 'emitRedeemEvent') {
          shouldShow = filter.value === item.emitRedeemEvent;
        } else if (filter.columnName === 'price' && filter.value !== '') {
          if ((filter as any).type === '>') {
            shouldShow = item.price > Number(filter.value);
          } else if ((filter as any).type === '=') {
            shouldShow = item.price === Number(filter.value);
          } else if ((filter as any).type === '<') {
            shouldShow = item.price < Number(filter.value);
          }
        } else if (filter.columnName === 'priceBits' && filter.value !== '') {
          if ((filter as any).type === '>') {
            shouldShow = item.priceBits > Number(filter.value);
          } else if ((filter as any).type === '=') {
            shouldShow = item.priceBits === Number(filter.value);
          } else if ((filter as any).type === '<') {
            shouldShow = item.priceBits < Number(filter.value);
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

  const bulkCanEnableEmit = useMemo(() => {
    for (const itemId of selection) {
      const item = items.find(o => o.id === itemId);
      if (item && !item.emitRedeemEvent) {
        return true;
      }
    }
    return false;
  }, [ selection, items ]);

  const bulkCanDisableEmit = useMemo(() => {
    for (const itemId of selection) {
      const item = items.find(o => o.id === itemId);
      if (item && item.emitRedeemEvent) {
        return true;
      }
    }
    return false;
  }, [ selection, items ]);

  const bulkToggleAttribute = useCallback(async <T extends keyof Required<Price>>(attribute: T, value: Required<Price>[T]) => {
    for (const selected of selection) {
      const item = items.find(o => o.id === selected);
      if (item && item[attribute] !== value) {
        await new Promise<void>((resolve) => {
          item[attribute] = value;
          axios.post(`${localStorage.server}/api/systems/price`,
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

    if (attribute === 'enabled') {
      enqueueSnackbar(`Bulk operation set ${value ? 'enabled' : 'disabled'}.`, { variant: 'success' });
    }

    if (attribute === 'emitRedeemEvent') {
      enqueueSnackbar(`Bulk operation set ${value ? 'enabled' : 'disabled'} emit.`, { variant: 'success' });
    }

    refresh();
  }, [ enqueueSnackbar, items, selection ]);

  const bulkDelete =  useCallback(async () => {
    for (const selected of selection) {
      const item = items.find(o => o.id === selected);
      if (item) {
        await new Promise<void>((resolve) => {
          axios.delete(`${localStorage.server}/api/systems/price/${item.id}`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
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
      <DisabledAlert system='price'/>
      <Grid container sx={{ pb: 0.7 }} spacing={1} alignItems='center'>
        <Grid item>
          <Button sx={{ width: 200 }} variant="contained" onClick={() => {
            router.push('/commands/price/create/');
          }}>Create new price</Button>
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
          <Tooltip arrow title="Enable emit">
            <Button disabled={!bulkCanEnableEmit} variant="contained" color="secondary" sx={{ minWidth: '36px', width: '36px' }} onClick={() => bulkToggleAttribute('emitRedeemEvent', true)}><SignalWifi4Bar/></Button>
          </Tooltip>
        </Grid>
        <Grid item>
          <Tooltip arrow title="Disable emit">
            <Button disabled={!bulkCanDisableEmit} variant="contained" color="secondary" sx={{ minWidth: '36px', width: '36px' }} onClick={() => bulkToggleAttribute('emitRedeemEvent', false)}><SignalWifiOffTwoTone/></Button>
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
              rows={filteredItems}
              columns={columns}
              getRowId={row => row.id}
            >
              <BoolTypeProvider
                for={['emitRedeemEvent', 'enabled']}
              />

              <SortingState
                defaultSorting={[{ columnName: 'command', direction: 'asc' }]}
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
      <PriceEdit items={items}/>
    </>
  );
};

PageCommandsPrice.getLayout = function getLayout(page: ReactElement) {
  return (
    <Layout>
      {page}
    </Layout>
  );
};

export default PageCommandsPrice;
