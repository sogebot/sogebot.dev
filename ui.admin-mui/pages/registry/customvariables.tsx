import {
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
  TableColumnVisibility,
  TableHeaderRow,
  TableSelection,
} from '@devexpress/dx-react-grid-material-ui';
import { PlayArrowTwoTone } from '@mui/icons-material';
import ContentCopyTwoToneIcon from '@mui/icons-material/ContentCopyTwoTone';
import {
  CircularProgress,
  Grid,
  IconButton,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { VariableInterface } from '@sogebot/backend/dest/database/entity/variable';
import parse from 'html-react-parser';
import { useRouter } from 'next/router';
import { useSnackbar } from 'notistack';
import {
  ReactElement,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import SimpleBar from 'simplebar-react';
import { v4 } from 'uuid';

import { NextPageWithLayout } from '~/pages/_app';
import { ButtonsDeleteBulk } from '~/src/components/Buttons/DeleteBulk';
import { DeleteButton } from '~/src/components/Buttons/DeleteButton';
import EditButton from '~/src/components/Buttons/EditButton';
import LinkButton from '~/src/components/Buttons/LinkButton';
import { Layout } from '~/src/components/Layout/main';
import { getSocket } from '~/src/helpers/socket';
import { useColumnMaker } from '~/src/hooks/useColumnMaker';
import { useFilter } from '~/src/hooks/useFilter';
import { setBulkCount } from '~/src/store/appbarSlice';

const PageRegistryCustomVariables: NextPageWithLayout = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();

  const [ items, setItems ] = useState<VariableInterface[]>([]);

  const [ loading, setLoading ] = useState(true);
  const { bulkCount } = useSelector((state: any) => state.appbar);
  const [ selection, setSelection ] = useState<(string|number)[]>([]);

  const [ evalsInProgress, setEvalsInProgress ] = useState<string[]>([]);

  const refresh = useCallback(async () => {
    await Promise.all([
      new Promise<void>(resolve => {
        getSocket('/core/customvariables').emit('customvariables::list', (_, data) => {
          setItems(data);
          resolve();
        });
      }),
    ]);
    setLoading(false);
  }, []);

  const triggerEval = useCallback((item: VariableInterface) => {
    setEvalsInProgress(v => [...v, item.id!]);
    getSocket('/core/customvariables').emit('customvariables::runScript', item.id!, (err) => {
      if (err) {
        enqueueSnackbar('Script error. ' + err, { variant: 'error' });
      } else {
        enqueueSnackbar(parse(`Script&nbsp;<strong>${item.variableName}</strong>&nbsp;(${item.id}) finished successfully`), { variant: 'success' });
        refresh();
      }
      setEvalsInProgress(v => v.filter(o => o !== item.id!));
    });
  }, [enqueueSnackbar, refresh]);

  const { useFilterSetup, columns, tableColumnExtensions, sortingTableExtensions, defaultHiddenColumnNames, filteringColumnExtensions } = useColumnMaker<VariableInterface & { additionalInfo: string }>([
    {
      columnName:     'variableName',
      translationKey: 'name',
      filtering:      { type: 'string' },
      column:         {
        getCellValue: (row) =>
          <Stack>
            <Typography variant='body2' sx={{ fontWeight: 'bold' }} component='strong'>{row.variableName}</Typography>
            <Typography variant='body2'>{row.description}</Typography>
          </Stack>,

      },
      predicate: (value: string, filter: Filter, row: any) => {
        const fValue = filter.value.toLowerCase();
        if (filter.operation === 'contains') {
          return row.variableName.toLowerCase().includes(fValue);
        }

        if (filter.operation === 'equal') {
          return row.variableName.toLowerCase() === fValue;
        }

        if (filter.operation === 'notEqual') {
          return row.variableName.toLowerCase() !== fValue;
        }

        return IntegratedFiltering.defaultPredicate(value, filter, row);
      },
    },
    {
      columnName: 'description',
      filtering:  { type: 'string' },
      hidden:     true,
    },
    {
      columnName:     'additionalInfo',
      translationKey: 'registry.customvariables.additional-info',
    },
    {
      columnName: 'type',
      filtering:  { type: 'string' },
    },
    {
      columnName:     'currentValue',
      translationKey: 'registry.customvariables.currentValue.name',
      filtering:      { type: 'string' },
      column:         { getCellValue: (row) => <span title={row.currentValue}>{row.currentValue}</span> },
    },
    {
      columnName:  'actions',
      table:       { width: 200 },
      sorting:     { sortingEnabled: false },
      translation: ' ',
      column:      {
        getCellValue: (row) => [
          <Stack direction="row" key="row">
            <EditButton
              href={'/registry/customvariables/edit/' + row.id}
            />
            <IconButton
              onClick={() => clone(row)}
            ><ContentCopyTwoToneIcon/></IconButton>
            { row.type ==='eval' && <IconButton disabled={evalsInProgress.includes(row.id!)} onClick={() => triggerEval(row)}>
              { evalsInProgress.includes(row.id!)
                ? <CircularProgress color='inherit' size={24}/>
                : <PlayArrowTwoTone/>
              }
            </IconButton>}
            <DeleteButton key='delete' onDelete={() => deleteItem(row)} />
          </Stack>,
        ],
      },
    },
  ]);

  const { element: filterElement, filters } = useFilter(useFilterSetup);

  const clone = useCallback((item: VariableInterface) => {
    getSocket('/core/customvariables').emit('customvariables::save', {
      ...item, history: [], urls: [], id: v4(), description: '(clone) of ' + item.variableName, variableName: `$_${Math.random().toString(36).substr(2, 5)}`,
    }, (err) => {
      if (err) {
        console.error(err);
      } else {
        enqueueSnackbar(`Custom variable ${item.variableName} (${item.id}) cloned.`, { variant: 'success' });
      }
      refresh();
    });
  }, [refresh, enqueueSnackbar]);

  const deleteItem = useCallback((item: VariableInterface) => {
    return new Promise((resolve, reject) => {
      getSocket('/core/customvariables').emit('customvariables::delete', item.id!, (err) => {
        if (err) {
          console.error(err);
          reject();
          return;
        }
        enqueueSnackbar(`Custom variable ${item.variableName} (${item.id}) deleted successfully.`, { variant: 'success' });
        refresh();
        resolve(true);
      });
    });
  }, [ enqueueSnackbar, refresh ]);

  useEffect(() => {
    refresh();
  }, [router, refresh]);

  useEffect(() => {
    dispatch(setBulkCount(selection.length));
  }, [selection, dispatch]);

  const bulkDelete =  useCallback(async () => {
    for (const selected of selection) {
      const item = items.find(o => o.id === selected);
      if (item) {
        await new Promise<void>((resolve) => {
          getSocket('/core/customvariables').emit('customvariables::delete', item.id!, (err) => {
            if (err) {
              console.error(err);
            }
            resolve();
          });
        });
      }
    }
    setItems(i => i.filter(item => !selection.includes(item.id!)));
    enqueueSnackbar(`Bulk operation deleted items.`, { variant: 'success' });
    setSelection([]);
  }, [ selection, enqueueSnackbar, items ]);

  return (
    <>
      <Grid container sx={{ pb: 0.7 }} spacing={1} alignItems='center'>
        <Grid item>
          <LinkButton variant="contained" href='/registry/customvariables/create/'>Create new custom variable</LinkButton>
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

              <SortingState
                defaultSorting={[{
                  columnName: 'variableName', direction: 'asc',
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
    </>
  );
};

PageRegistryCustomVariables.getLayout = function getLayout(page: ReactElement) {
  return (
    <Layout>
      {page}
    </Layout>
  );
};
export default PageRegistryCustomVariables;
