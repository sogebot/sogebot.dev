import {
  DataTypeProvider,
  DataTypeProviderProps,
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
import { Poll } from '@entity/poll';
import {
  Box,
  Button,
  CircularProgress,
  Grid,
  LinearProgress,
  LinearProgressProps,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { green, red } from '@mui/material/colors';
import axios from 'axios';
import { cloneDeep } from 'lodash';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSnackbar } from 'notistack';
import {
  ReactElement, ReactNode, useCallback, useEffect, useMemo, useState,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import SimpleBar from 'simplebar-react';
import { v4 } from 'uuid';

import { DisabledAlert } from '@/components/System/DisabledAlert';
import { NextPageWithLayout } from '~/pages/_app';
import { ButtonsDeleteBulk } from '~/src/components/Buttons/DeleteBulk';
import { Layout } from '~/src/components/Layout/main';
import { PollEdit } from '~/src/components/RightDrawer/PollEdit';
import getAccessToken from '~/src/getAccessToken';
import { dayjs } from '~/src/helpers/dayjsHelper';
import { useColumnMaker } from '~/src/hooks/useColumnMaker';
import { useFilter } from '~/src/hooks/useFilter';
import { useTranslation } from '~/src/hooks/useTranslation';
import { setBulkCount } from '~/src/store/appbarSlice';

function LinearProgressWithLabel(props: LinearProgressProps & { value: number, title: string }) {
  return (
    <>
      <Box sx={{
        width: 'fit-content', mr: 1, height: '10px',
      }}>
        {props.title}
      </Box>
      <Box sx={{
        display: 'flex', alignItems: 'center',
      }}>
        <Box sx={{
          width: '100%', mr: 1,
        }}>
          <LinearProgress variant="determinate" {...props} />
        </Box>
        <Box sx={{ minWidth: 35 }}>
          <Typography variant="body2" color="text.secondary">{`${Math.round(
            props.value,
          )}%`}</Typography>
        </Box>
      </Box>
    </>
  );
}

export const VotesFormatter: any = ({ value, row }: { value: Poll['votes'], row: Poll }) => {
  const totalVotes = useMemo(() => {
    return (value ?? []).reduce((a, b) => b.votes + a, 0);
  }, [ value ]);

  const getPercentage = (index: number) => {
    let numOfVotes = 0;
    if (value) {
      for (let i = 0, length = value.length; i < length; i++) {
        if (value[i].option === index) {
          numOfVotes += value[i].votes;
        }
      }
    }
    return Number((100 / totalVotes) * numOfVotes || 0);
  };

  return (<>
    {row.options.map((o, idx) => <LinearProgressWithLabel key={o + idx} title={o} value={getPercentage(idx)} />)}
  </>);
};

const VotesProvider = (props: JSX.IntrinsicAttributes & DataTypeProviderProps & { children?: ReactNode; }) => (
  <DataTypeProvider
    formatterComponent={VotesFormatter}
    {...props}
  />
);

export const ClosedAtFormatter: any = ({ row }: { row: Poll }) => {
  const { translate } = useTranslation();

  const activeTime = useMemo(() => new Date(row.openedAt || Date.now()).getTime(), [row]);

  console.log({ row });

  return (<>{row.closedAt
    ? <Typography color={red[400]}>{ translate('systems.polls.closedAt') } <strong>{ dayjs(row.closedAt).format('LLL') }</strong></Typography>
    : <Typography color={green[400]}>{ translate('systems.polls.activeFor') } <strong>{ dayjs().from(dayjs(activeTime), true) }</strong></Typography>}</>);
};

const ClosedAtProvider = (props: JSX.IntrinsicAttributes & DataTypeProviderProps & { children?: ReactNode; }) => (
  <DataTypeProvider
    formatterComponent={ClosedAtFormatter}
    {...props}
  />
);

export const TypeFormatter = ({ value }: { value: string }) => {
  const { translate } = useTranslation();
  return (<>{translate(`systems.polls.${value}`)}</>);
};

const TypeProvider = (props: JSX.IntrinsicAttributes & DataTypeProviderProps & { children?: ReactNode; }) => (
  <DataTypeProvider
    formatterComponent={TypeFormatter}
    {...props}
  />
);

const PageManagePolls: NextPageWithLayout = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { translate } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();

  const [ items, setItems ] = useState<Poll[]>([]);
  const [ loading, setLoading ] = useState(true);
  const { bulkCount } = useSelector((state: any) => state.appbar);
  const [ selection, setSelection ] = useState<(string|number)[]>([]);

  type extension = {
    totalVotes: number;
  };

  const { useFilterSetup, columns, tableColumnExtensions, sortingTableExtensions, defaultHiddenColumnNames, filteringColumnExtensions } = useColumnMaker<Poll & extension>([
    {
      columnName: 'title', filtering: { type: 'string' }, translationKey: 'systems.polls.title',
    },
    {
      columnName:     'type',
      translationKey: 'systems.polls.votingBy',
      filtering:      {
        type:        'list',
        valueRender: (value) => {
          return translate('systems.polls.' + value);
        },
        options: { listValues: ['normal', 'tips', 'bits', 'numbers'].sort() },
      },
    },
    {
      columnName:  'votes',
      translation: ' ',
      sorting:     { sortingEnabled: false },
    },
    {
      columnName:     'totalVotes',
      translationKey: 'systems.polls.totalVotes',
      table:          { align: 'center' },
      column:         {
        getCellValue: (row) => {
          const votes = (row.votes ?? []).reduce((a: any, b: { votes: any; }) => b.votes + a, 0);
          return row.type === 'tips' ? Number(votes.toFixed(1)) : votes;
        },
      },
    },
    {
      columnName:     'closedAt',
      translationKey: 'systems.polls.closedAt',
    },
    {
      columnName:  'actions',
      table:       { width: 130 },
      sorting:     { sortingEnabled: false },
      translation: ' ',
      column:      {
        getCellValue: (row) => [
          <Stack direction="row" key="row">
            {row.closedAt
              ? <Button
                size='small'
                variant="contained"
                onClick={() => {
                  copyPoll(row);
                }}>Copy</Button>
              : <Button
                size='small'
                variant="contained"
                color="error"
                onClick={() => {
                  stopPoll();
                }}>Stop</Button>
            }
          </Stack>,
        ],
      },
    },
  ]);

  const { element: filterElement, filters } = useFilter<Poll>(useFilterSetup);

  const stopPoll = () => {
    axios.delete(`${JSON.parse(localStorage.server)}/api/systems/polls/`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
      .then(() => {
        refresh();
      });
    enqueueSnackbar(`Poll was stopped.`, { variant: 'success' });
  };

  const copyPoll = (item: Poll) => {
    console.log('Copying', item);
    const clone = cloneDeep(item);
    clone.id = v4();
    clone.votes = [];
    clone.openedAt = new Date().toISOString();
    axios.post(`${JSON.parse(localStorage.server)}/api/systems/polls`, item, { headers: { authorization: `Bearer ${getAccessToken()}` } })
      .then(() => {
        refresh();
      });
    enqueueSnackbar(`Poll was copied and started.`, { variant: 'success' });
  };

  useEffect(() => {
    refresh().then(() => setLoading(false));
  }, [router]);

  const refresh = async () => {
    await Promise.all([
      new Promise<void>(resolve => {
        axios.get(`${JSON.parse(localStorage.server)}/api/systems/polls`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
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

  const bulkDelete =  useCallback(async () => {
    for (const selected of selection) {
      const item = items.find(o => o.id === selected);
      if (item) {
        await new Promise<void>((resolve) => {
          axios.delete(`${JSON.parse(localStorage.server)}/api/systems/polls/${item.id}`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
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
      <Grid container sx={{ pb: 0.7 }} spacing={1} alignItems='center'>
        <DisabledAlert system='polls'/>
        <Grid item>
          <Link passHref href='/manage/polls/create/'>
            <Button variant="contained">Create new poll</Button>
          </Link>
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
              <TypeProvider
                for={['type']}
              />
              <VotesProvider
                for={['votes']}
              />
              <ClosedAtProvider
                for={['closedAt']}
              />

              <SortingState
                defaultSorting={[{
                  columnName: 'closedAt', direction: 'desc',
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
      <PollEdit items={items}/>
    </>
  );
};

PageManagePolls.getLayout = function getLayout(page: ReactElement) {
  return (
    <Layout>
      {page}
    </Layout>
  );
};

export default PageManagePolls;
