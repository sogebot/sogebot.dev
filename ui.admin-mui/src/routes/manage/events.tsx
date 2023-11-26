import { DataTypeProvider, DataTypeProviderProps, FilteringState, IntegratedFiltering, IntegratedSelection, IntegratedSorting, SelectionState, SortingState } from '@devexpress/dx-react-grid';
import { Grid as DataGrid, Table, TableColumnVisibility, TableHeaderRow, TableSelection } from '@devexpress/dx-react-grid-material-ui';
import { CheckBoxTwoTone, DisabledByDefaultTwoTone, FilterAltTwoTone } from '@mui/icons-material';
import { Box, Button, capitalize, CircularProgress, Dialog, Grid, Paper, Stack, Tooltip, Typography } from '@mui/material';
import { Event } from '@sogebot/backend/dest/database/entity/event';
import { useAtomValue } from 'jotai';
import { useSnackbar } from 'notistack';
import React, { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import SimpleBar from 'simplebar-react';

import { rewardsAtom } from '../../atoms';
import { ButtonsDeleteBulk } from '../../components/Buttons/DeleteBulk';
import { DeleteButton } from '../../components/Buttons/DeleteButton';
import EditButton from '../../components/Buttons/EditButton';
import LinkButton from '../../components/Buttons/LinkButton';
import { EventsEdit } from '../../components/Form/EventsEdit';
import { BoolTypeProvider } from '../../components/Table/BoolTypeProvider';
import { dayjs } from '../../helpers/dayjsHelper';
import { getSocket } from '../../helpers/socket';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { useColumnMaker } from '../../hooks/useColumnMaker';
import { useFilter } from '../../hooks/useFilter';
import { usePermissions } from '../../hooks/usePermissions';
import { useTranslation } from '../../hooks/useTranslation';
import { setBulkCount } from '../../store/appbarSlice';
import theme from '../../theme';

const EventNameProvider = (props: JSX.IntrinsicAttributes & DataTypeProviderProps & { children?: ReactNode; }) => {
  const { translate } = useTranslation();

  const rewards = useAtomValue(rewardsAtom);
  const getReward = React.useCallback((rewardId: string) => {
    const reward = rewards.find(o => o.id === rewardId);
    return reward?.name ?? <Typography sx={{ fontWeight: 'bold', color: theme.palette.error.main }}>!!! unknown reward !!!</Typography>;
  }, [ rewards]);

  return <DataTypeProvider
    formatterComponent={({ row }: { row?: Event }) => <>
      <Typography variant='body2'>{capitalize(translate(row!.event.name))}</Typography>

      {row!.filter.length > 0 && <Box sx={{ pt: '0.2rem', paddingLeft: '1rem' }}>
        <Paper sx={{
          border:       `1px solid ${theme.palette.primary.main}85`,
          borderRadius: '4px',
          display:      'flex',
          lineHeight:   'normal',
          width:        'fit-content'
        }}>
          <Box sx={{
            backgroundColor: `${theme.palette.primary.main}55`,
            px:              0.3,
          }}>
            <FilterAltTwoTone sx={{
              fontSize: '1rem',
              height:   '100%',
            }}/>
          </Box>
          <Typography sx={{
            px:      0.3,
            display: 'inline-block',
          }} variant="caption">
            {row!.filter}
          </Typography>
        </Paper>
      </Box>}

      {Object.keys(row!.event.definitions).length > 0 && <ul style={{
        padding: 0, paddingLeft: '1rem', listStyle: 'none', margin: 0, paddingTop: '0.2rem'
      }}>
        {Object.keys(row!.event.definitions).map((key, idx2) => <li key={idx2}>
          { key === 'rewardId' ? translate('events.definitions.reward.label') : translate('events.definitions.' + key + '.label') }
          <Typography sx={{
            display:      'inline-block',
            border:       `1px solid ${theme.palette.primary.main}85`,
            borderRadius: '4px',
            padding:      '.1rem .3rem',
            marginLeft:   '.5rem',
            lineHeight:   'normal',
          }} variant="caption">
            {
              key === 'rewardId'
                ? getReward(String((row!.event.definitions as any)[key]))
                : String((row!.event.definitions as any)[key])
            }
          </Typography>
        </li>)}
      </ul>}
    </>}
    {...props}
  />;
};

const PageManageEvents = () => {
  const dispatch = useAppDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const location = useLocation();
  const { type, id } = useParams();
  const { translate } = useTranslation();

  const [ items, setItems ] = useState<Event[]>([]);
  const [ loading, setLoading ] = useState(true);
  const { bulkCount } = useAppSelector(state => state.appbar);
  const { permissions } = usePermissions();
  const [ selection, setSelection ] = useState<(string|number)[]>([]);

  const { useFilterSetup, columns, tableColumnExtensions, sortingTableExtensions, defaultHiddenColumnNames, filteringColumnExtensions } = useColumnMaker<Event & { 'event.name': string }>([
    {
      columnName:  'event.name',
      table:       { width: '30%' },
      translation: 'Event name',
      filtering:   {
        type:    'list' ,
        options: {
          showDisabled: false,
          listValues:   Array.from(new Set(items.map(o => o.event.name))),
        },
      },
    }, {
      columnName: 'operations',
      column:     {
        getCellValue: (row) => <>
          {row.operations.length === 0 && <Typography variant='body2' sx={{ color: theme.palette.grey[400] }}>No operations set for this event</Typography>}
          {row.operations.map((operation: any, idx: any) => <Box key={idx}>
            <Typography variant='body2' sx={{ color: theme.palette.primary.main }}>{ capitalize(translate(operation.name)) }</Typography>
            {Object.keys(operation.definitions).length > 0 && <ul style={{
              padding: 0, paddingLeft: '1rem', listStyle: 'none', margin: 0,
            }}>
              {Object.keys(operation.definitions).map((key, idx2) => <li key={idx2}>
                { translate('events.definitions.' + key + '.label') }
                <Typography sx={{
                  display:      'inline-block',
                  border:       `1px solid ${theme.palette.primary.main}85`,
                  borderRadius: '4px',
                  padding:      '.1rem .3rem',
                  marginLeft:   '.5rem',
                  lineHeight:   'normal',
                }} variant="caption">
                  {operation.name === 'run-command' && key === 'timeout'
                    ? operation.definitions[key] === 0
                      ? 'immediate'
                      : dayjs.duration(Number(operation.definitions[key]))
                        .format('D[d] H[h] m[m] s[s]')
                        .replace(/ 0s/, '')
                        .replace(/ 0m/, '')
                        .replace(/ 0h/, '')
                        .replace(/0d/, '')
                    : String(operation.definitions[key])}
                </Typography>
              </li>)}
            </ul>}
          </Box>)}
        </>,
      },
      translation: ' ',
    },
    {
      columnName:     'isEnabled',
      translationKey: 'enabled',
      table:          {
        align: 'center', width: 94,
      },
      filtering: { type: 'boolean' },
    },
    {
      columnName:  'actions',
      translation: ' ',
      table:       { width: 130 },
      sorting:     { sortingEnabled: false },
      column:      {
        getCellValue: (row) => [
          <Stack direction="row" key="row">
            <EditButton href={'/manage/events/edit/' + row.id}/>
            <DeleteButton key='delete' onDelete={() => deleteItem(row)} />
          </Stack>,
        ],
      },
    },
  ]);

  const { element: filterElement, filters } = useFilter<Event>(useFilterSetup);

  const deleteItem = useCallback((item: Event) => {
    getSocket('/core/events').emit('events::remove', item.id, () => {
      enqueueSnackbar(`Event ${item.id} deleted successfully.`, { variant: 'success' });
      refresh();
    });
  }, [ enqueueSnackbar ]);

  useEffect(() => {
    refresh().then(() => setLoading(false));
  }, [location.pathname]);

  const refresh = async () => {
    await Promise.all([
      new Promise<void>(resolve => {
        getSocket('/core/events').emit('generic::getAll', (err, res: Event[]) => {
          if (err) {
            resolve();
            return console.error(err);
          }
          setItems(res);
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

  const bulkToggleAttribute = useCallback(async <T extends keyof Event>(attribute: T, value: Event[T]) => {
    for (const selected of selection) {
      const item = items.find(o => o.id === selected);
      if (item && item[attribute] !== value) {
        await new Promise<void>((resolve) => {
          item[attribute] = value;
          getSocket('/core/events').emit('events::save', item, () => {
            resolve();
          });
        });
      }
    }

    setItems(i => i.map((item) => {
      if (selection.includes(item.id!)) {
        item[attribute] = value;
      }
      return item;
    }));

    if (attribute === 'isEnabled') {
      enqueueSnackbar(`Bulk operation set ${value ? 'enabled' : 'disabled'}.`, { variant: 'success' });
    }

    refresh();
  }, [ enqueueSnackbar, items, permissions, selection ]);

  const bulkDelete =  useCallback(async () => {
    for (const selected of selection) {
      const item = items.find(o => o.id === selected);
      if (item) {
        await new Promise<void>((resolve) => {
          getSocket('/core/events').emit('events::remove', item.id, () => {
            resolve();
          });
        });
      }
    }
    setItems(i => i.filter(item => !selection.includes(item.id!)));
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
        <Grid item>
          <LinkButton sx={{ width: 300 }} variant="contained" href='/manage/events/create/'>Create new event</LinkButton>
        </Grid>
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
            <BoolTypeProvider
              for={['isEnabled']}
            />

            <EventNameProvider
              for={['event.name']}
            />

            <SortingState
              defaultSorting={[{
                columnName: 'name', direction: 'asc',
              }, {
                columnName: 'isEnabled', direction: 'asc',
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
        maxWidth='xl'>
        {open && <EventsEdit/>}
      </Dialog>
    </>
  );
};

export default PageManageEvents;
