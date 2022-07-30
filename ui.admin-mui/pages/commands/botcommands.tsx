import {
  Column,
  Filter,
  FilteringState,
  IntegratedSorting,
  SortingState,
} from '@devexpress/dx-react-grid';
import {
  Grid as DataGrid,
  Table,
  TableFilterRow,
  TableHeaderRow,
} from '@devexpress/dx-react-grid-material-ui';
import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';
import EditIcon from '@mui/icons-material/Edit';
import {
  Button,
  CircularProgress,
  FormControlLabel,
  FormGroup,
  Grid,
  Paper,
  Switch,
  Typography,
} from '@mui/material';
import capitalize from 'lodash/capitalize';
import { useRouter } from 'next/router';
import {
  ReactElement, useEffect, useMemo, useState,
} from 'react';
import SimpleBar from 'simplebar-react';

import { NextPageWithLayout } from '~/pages/_app';
import { Commands } from '~/src/classes/Commands';
import { Layout } from '~/src/components/Layout/main';
import { BotCommandEdit } from '~/src/components/RightDrawer/BotCommandEdit';
import { getPermissionName } from '~/src/helpers/getPermissionName';
import { getSocket } from '~/src/helpers/socket';
import { usePermissions } from '~/src/hooks/usePermissions';
import { useTranslation } from '~/src/hooks/useTranslation';
import theme from '~/src/theme';

import 'simplebar-react/dist/simplebar.min.css';

const PageCommandsBot: NextPageWithLayout = () => {
  const { translate } = useTranslation();
  const router = useRouter();

  const [ items, setItems ] = useState<Commands[]>([]);

  const [ loading, setLoading ] = useState(true);
  const { permissions } = usePermissions();

  const [ showOnlyModified, setShowOnlyModified ] = useState(false);

  const columns = useMemo<Column[]>(() => [
    {
      name:         'command',
      title:        capitalize(translate('command')),
      getCellValue: (row) => {
        return (<Typography>
          {row.defaultValue !== row.command ? (<>
            <Typography component='span' sx={{ textDecoration: 'line-through' }}>{row.defaultValue}</Typography>
            <ArrowRightAltIcon sx={{ mx: 0.5, verticalAlign: 'bottom' }}/>
            {row.command}
          </>
          ) : <>{row.defaultValue}</>}

        </Typography>);
      },
    },
    {
      name:  'name',
      title: capitalize(translate('name')),
    },
    {
      name:         'permission', title:        translate('permission'),
      getCellValue: (row) => {
        return (<Typography color={!row.permission ? theme.palette.error.dark : 'undefined'}>
          {row.permission === null ? '-- unset --' : getPermissionName(row.permission, permissions || [])}
        </Typography>);
      },
    },
    { name: 'type', title: capitalize(translate('type')) },
    {
      name:         'actions',
      title:        ' ',
      getCellValue: (row) => [
        <Button
          size='small'
          key="edit"
          variant="contained"
          startIcon={<EditIcon/>}
          onClick={() => {
            router.push('/commands/botcommands/edit/' + row.id);
          }}>Edit</Button>,
      ],
    },
  ], [ permissions, translate, router ]);
  const [tableColumnExtensions] = useState([
    { columnName: 'command', width: '40%' },
    { columnName: 'permission', filteringEnabled: false },
    {
      columnName: 'actions', width: 100, filteringEnabled: false,
    },
  ]);
  const [filters, setFilters] = useState<Filter[]>([]);

  useEffect(() => {
    refresh().then(() => setLoading(false));
  }, [router]);

  const refresh = async () => {
    await Promise.all([
      new Promise<void>(resolve => {
        getSocket('/core/general').emit('generic::getCoreCommands', (err, commands) => {
          if (err) {
            resolve();
            return console.error(err);
          }
          setItems(commands);
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
        } else if (filter.columnName === 'command') {
          shouldShow = item.defaultValue.toLowerCase().includes(filter.value.toLowerCase()) || item.command.toLowerCase().includes(filter.value.toLowerCase());
        } else if (filter.columnName === 'type') {
          shouldShow = item.type.toLowerCase().includes(filter.value.toLowerCase());
        }

        if (!shouldShow) {
          break;
        }
      }
      return shouldShow && (showOnlyModified ? item.defaultValue !== item.command : true);
    });
  }, [items, showOnlyModified, filters]);

  return (
    <>
      {loading && items.length === 0 && permissions.length === 0
        ? <CircularProgress color="inherit" sx={{
          position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, 0)',
        }} />
        : <>
          <Grid container sx={{ pb: 0.7 }} spacing={1} alignItems='center'>
            <Grid item xs="auto" mx={2}>
              <FormGroup>
                <FormControlLabel control={<Switch onChange={event => setShowOnlyModified(event.target.checked)} />} label="Show only modified" />
              </FormGroup>
            </Grid>
          </Grid>
          <Paper>
            <SimpleBar style={{ maxHeight: 'calc(100vh - 117px)' }} autoHide={false}>
              <DataGrid
                rows={filteredItems}
                columns={columns}
              >
                <SortingState
                  defaultSorting={[{ columnName: 'command', direction: 'asc' }, { columnName: 'name', direction: 'asc' }, { columnName: 'type', direction: 'asc' }]}
                />
                <IntegratedSorting />
                <FilteringState filters={filters} onFiltersChange={setFilters} columnExtensions={tableColumnExtensions as any}/>

                <Table columnExtensions={tableColumnExtensions}/>
                <TableHeaderRow showSortingControls/>
                <TableFilterRow />
              </DataGrid>
            </SimpleBar>
          </Paper>
        </>}
      <BotCommandEdit items={items}/>
    </>
  );
};

PageCommandsBot.getLayout = function getLayout(page: ReactElement) {
  return (
    <Layout>
      {page}
    </Layout>
  );
};

export default PageCommandsBot;
