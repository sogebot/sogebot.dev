import { FilteringState, IntegratedFiltering, IntegratedSelection, IntegratedSorting, SelectionState, SortingState } from '@devexpress/dx-react-grid';
import { Grid as DataGrid, Table, TableColumnVisibility, TableHeaderRow, TableSelection } from '@devexpress/dx-react-grid-material-ui';
import { mdiAlphabeticalVariant, mdiCodeBrackets, mdiCodeJson, mdiNumeric } from '@mdi/js';
import Icon from '@mdi/react';
import { PlayArrowTwoTone } from '@mui/icons-material';
import ContentCopyTwoToneIcon from '@mui/icons-material/ContentCopyTwoTone';
import { CircularProgress, Dialog, Grid, IconButton, Stack, Typography } from '@mui/material';
import { Box } from '@mui/system';
import { Variable } from '@sogebot/backend/dest/database/entity/variable';
import parse from 'html-react-parser';
import humanizeDuration from 'humanize-duration';
import { capitalize } from 'lodash';
import { useSnackbar } from 'notistack';
import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import SimpleBar from 'simplebar-react';

import { ButtonsDeleteBulk } from '../../components/Buttons/DeleteBulk';
import { DeleteButton } from '../../components/Buttons/DeleteButton';
import EditButton from '../../components/Buttons/EditButton';
import LinkButton from '../../components/Buttons/LinkButton';
import { CustomVariablesEdit } from '../../components/Form/CustomVariablesEdit';
import { getPermissionName } from '../../helpers/getPermissionName';
import { getSocket } from '../../helpers/socket';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { useColumnMaker } from '../../hooks/useColumnMaker';
import { useFilter } from '../../hooks/useFilter';
import { usePermissions } from '../../hooks/usePermissions';
import { usePredicate } from '../../hooks/usePredicate';
import { useTranslation } from '../../hooks/useTranslation';
import { setBulkCount } from '../../store/appbarSlice';

const PageRegistryCustomVariables = () => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { type, id } = useParams();
  const { enqueueSnackbar } = useSnackbar();
  const { translate } = useTranslation();
  const { permissions } = usePermissions();
  const { configuration } = useAppSelector(state => state.loader);

  const open = React.useMemo(() => !!(type
    && (
      (type === 'edit' && id)
      || type === 'create'
    )
  ), [type, id]);

  const [ items, setItems ] = useState<Variable[]>([]);

  const [ loading, setLoading ] = useState(true);
  const { bulkCount } = useAppSelector(state => state.appbar);
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

  const triggerEval = useCallback((item: Variable) => {
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

  const { defaultStringForAttribute } = usePredicate();
  const { useFilterSetup, columns, tableColumnExtensions, sortingTableExtensions, defaultHiddenColumnNames, filteringColumnExtensions } = useColumnMaker<Variable & { additionalInfo: string }>([
    {
      columnName:     'variableName',
      translationKey: 'properties.variableName',
      table:          {
        wordWrapEnabled: true, width: 300,
      },
      filtering: { type: 'string' },
      column:    {
        getCellValue: (row) =>
          <Stack direction='row' alignItems='center' spacing={2}>
            {row.type === 'text' && <Icon style={{ width: '34px' }} size={'34px'} path={mdiAlphabeticalVariant} color='white'/>}
            {row.type === 'number' && <Icon style={{ width: '34px' }} size={'34px'} path={mdiNumeric} color='white'/>}
            {row.type === 'eval' && <Icon style={{ width: '34px' }} size={'34px'} path={mdiCodeJson} color='white'/>}
            {row.type === 'options' && <Icon style={{ width: '34px' }} size={'34px'} path={mdiCodeBrackets} color='white'/>}
            <Stack sx={{ flexShrink: 2 }}>
              <Typography variant='body2' sx={{ fontWeight: 'bold' }} component='strong'>{row.variableName}</Typography>
              <Typography variant='body2'>{row.description}</Typography>
            </Stack>
          </Stack>,

      },
      predicate: defaultStringForAttribute('variableName'),
    },
    {
      columnName: 'description',
      filtering:  { type: 'string' },
      hidden:     true,
    },
    {
      columnName: 'permission',
      table:      { width: 140 },
      filtering:  { type: 'permission' },
      column:     { getCellValue: (row) => row.permission === null ? '_disabled' : getPermissionName(row.permission, permissions || []) },
    },
    {
      columnName:     'currentValue',
      translationKey: 'registry.customvariables.currentValue.name',
      table:          { wordWrapEnabled: true },
      filtering:      { type: 'string' },
      column:         { getCellValue: (row) => <span title={row.currentValue}>{row.currentValue}</span> },
      predicate:      defaultStringForAttribute('currentValue'),
    },
    {
      columnName: 'additionalInfo',
      table:      {
        wordWrapEnabled: true, width: 400,
      },
      translationKey: 'registry.customvariables.additional-info',
      column:         {
        getCellValue: (row) => <>
          {row.type === 'eval' && <>
            <Box>
              <Typography component='strong' variant='body2' sx={{ fontWeight: 'bold' }}>{ translate('registry.customvariables.run-script') }:</Typography>
              {' '}
              {row.runEvery > 0
                ? humanizeDuration(row.runEvery, { language: configuration.lang })
                : translate('registry.customvariables.runEvery.isUsed')}
            </Box>
            <Box>
              <Typography component='strong' variant='body2' sx={{ fontWeight: 'bold' }}>{ translate('registry.customvariables.last-run') }</Typography>
              {' '}
              { row.runAt ? new Date(row.runAt).toLocaleString() : translate('commons.never') }
            </Box>
          </>}

          {row.type === 'options' && <Box>
            <Typography component='strong' variant='body2' sx={{ fontWeight: 'bold' }}>{ translate('registry.customvariables.usableOptions.name') }:</Typography>
            {' '}
            {row.usableOptions.join(', ')}
          </Box>}

          {row.readOnly && <Box><Typography component='strong' variant='body2' sx={{ fontWeight: 'bold' }}>{ capitalize(translate('registry.customvariables.isReadOnly')) }</Typography></Box>}
          <Box>
            <Typography component='strong' variant='body2' sx={{ fontWeight: 'bold' }}>{ translate('registry.customvariables.response.name') }:</Typography>
            {' '}
            {row.responseType === 0 && <Typography variant='body2' component='span'>{ translate('registry.customvariables.response.default') }</Typography>}
            {row.responseType === 1 && <Typography variant='body2' component='span'>{ row.responseText } <small>({ translate('registry.customvariables.response.custom') })</small></Typography>}
            {row.responseType === 2 && <Typography variant='body2' component='span'>{ translate('registry.customvariables.response.command') }</Typography>}
          </Box>
        </>,
      },
    },
    {
      columnName: 'type',
      table:      { width: 70 },
      filtering:  {
        type:    'list',
        options: {
          listValues: [
            translate('registry.customvariables.types.number'),
            translate('registry.customvariables.types.eval'),
            translate('registry.customvariables.types.text'),
            translate('registry.customvariables.types.options'),
          ],
        } ,
      },
      hidden: true,
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

  const clone = useCallback((item: Variable) => {
    const clonedItem = Object.assign(new Variable(), {
      ...item,
      id:           crypto.randomUUID(),
      description:  '(clone) of ' + item.variableName,
      variableName: `$_${Math.random().toString(36).substr(2, 5)}`,
    });

    getSocket('/core/customvariables').emit('customvariables::save', clonedItem, (err) => {
      if (err) {
        console.error(err);
      } else {
        enqueueSnackbar(`Custom variable ${item.variableName} (${item.id}) cloned.`, { variant: 'success' });
      }
      refresh();
    });
  }, [refresh, enqueueSnackbar]);

  const deleteItem = useCallback((item: Variable) => {
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
  }, [location.pathname, refresh]);

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
        : <SimpleBar style={{ maxHeight: 'calc(100vh - 116px)' }} autoHide={false}>
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
        </SimpleBar>}

      <Dialog
        open={open}
        fullWidth
        maxWidth='md'>
        {open && <CustomVariablesEdit/>}
      </Dialog>
    </>
  );
};
export default PageRegistryCustomVariables;
