import { Column } from '@devexpress/dx-react-grid';
import {
  Grid as DataGrid,
  Table,
  TableHeaderRow,
} from '@devexpress/dx-react-grid-material-ui';
import EditIcon from '@mui/icons-material/Edit';
import {
  Button,
  CircularProgress,
  Grid,
  Paper,
  Stack,
} from '@mui/material';
import { Alias, AliasGroup } from '@sogebot/backend/src/database/entity/alias';
import capitalize from 'lodash/capitalize';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSnackbar } from 'notistack';
import {
  ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import SimpleBar from 'simplebar-react';

import { NextPageWithLayout } from '~/pages/_app';
import { GridActionAliasMenu } from '~/src/components/GridAction/AliasMenu';
import { Layout } from '~/src/components/Layout/main';
import { AliasGroupEdit } from '~/src/components/RightDrawer/AliasGroupEdit';
import { BoolTypeProvider } from '~/src/components/Table/BoolTypeProvider';
import { PermissionTypeProvider } from '~/src/components/Table/PermissionTypeProvider';
import { getPermissionName } from '~/src/helpers/getPermissionName';
import { getSocket } from '~/src/helpers/socket';
import { usePermissions } from '~/src/hooks/usePermissions';
import { useTranslation } from '~/src/hooks/useTranslation';

const PageCommandsAlias: NextPageWithLayout = () => {
  const { translate } = useTranslation();
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();

  const [ items, setItems ] = useState<Alias[]>([]);
  const [ groupsSettings, setGroupsSettings ] = useState<AliasGroup[]>([]);
  const [ loading, setLoading ] = useState(true);
  const { permissions } = usePermissions();
  const tableColumnExtensions = [
    {
      columnName: 'actions', width: 130, filteringEnabled: false, sortingEnabled: false,
    },
  ];

  const groups = useMemo(() => {
    return Array.from(new Set(items.map(o => o.group)));
  }, [items]);

  const groupsSettingsAll = useMemo((): AliasGroup[] => {
    const groupSet: AliasGroup[] = [...groupsSettings];
    for (const group of groups) {
      if (group) {
        if (!groupsSettings.find(o => o.name === group)) {
          groupSet.push({
            name:    group,
            options: {
              filter: null, permission: null,
            },
          } as AliasGroup);
        }
      }
    }
    return groupSet;
  }, [ groupsSettings, groups ]);

  const deleteItem = useCallback((item: AliasGroup) => {
    getSocket('/systems/alias').emit('generic::deleteById', item.name, () => {
      enqueueSnackbar(`Alias group ${item.name} deleted successfully. You can still see this group if it is being activelly used by aliases.`, { variant: 'success' });
      refresh();
    });
  }, [ enqueueSnackbar ]);

  const columns = useMemo<Column[]>(() => [
    {
      name:  'name',
      title: capitalize(translate('group')),
    },
    {
      name:         'used',
      title:        capitalize(translate('isUsed')),
      getCellValue: (row) => groups.includes(row.name),
    },
    {
      name:         'filter',
      title:        capitalize(translate('filter')),
      getCellValue: (row) => row.options.filter === null ? 'No filter set' : row.options.filter,
    },
    {
      name:         'permission',
      title:        translate('permission'),
      getCellValue: (row) => row.options.permission === null ? 'No permission set' : getPermissionName(row.options.permission, permissions || []),
    },
    {
      name:         'actions',
      title:        ' ',
      getCellValue: (row) => [
        <Stack direction="row" key="row">
          <Link passHref href={'/commands/alias/group/edit/' + row.name}>
            <Button
              size='small'
              variant="contained"
              startIcon={<EditIcon/>}>Edit</Button>
          </Link>
          <GridActionAliasMenu key='delete' onDelete={() => deleteItem(row)} />
        </Stack>,
      ],
    },
  ], [ permissions, translate, deleteItem, groups ]);

  useEffect(() => {
    refresh().then(() => setLoading(false));
  }, [ router ]);

  const refresh = async () => {
    console.log('Refresh');
    await Promise.all([
      new Promise<void>(resolve => {
        getSocket('/systems/alias').emit('generic::getAll', (err, res) => {
          if (err) {
            resolve();
            return console.error(err);
          }
          setItems(res);
          resolve();
        });
      }),
      new Promise<void>(resolve => {
        getSocket('/systems/alias').emit('generic::groups::getAll', (err, res) => {
          if (err) {
            resolve();
            return console.error(err);
          }
          setGroupsSettings(res);
          resolve();
        });
      }),
    ]);
  };

  return (
    <>
      <Grid container sx={{ pb: 0.7 }} spacing={1} alignItems='center'>
        <Grid item>
          <Link passHref href='/commands/alias/'>
            <Button sx={{ width: 220 }} color="secondary" variant="contained">Back to Alias settings</Button>
          </Link>
        </Grid>
      </Grid>

      {loading
        ? <CircularProgress color="inherit" sx={{
          position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, 0)',
        }} />
        : <Paper>
          <SimpleBar style={{ maxHeight: 'calc(100vh - 116px)' }} autoHide={false}>
            <DataGrid
              rows={groupsSettingsAll}
              columns={columns}
              getRowId={row => row.name}
            >
              <BoolTypeProvider
                for={['used']}
              />
              <PermissionTypeProvider
                for={['permission']}
              />
              <Table columnExtensions={tableColumnExtensions as any}/>
              <TableHeaderRow/>
            </DataGrid>
          </SimpleBar>
        </Paper>}
      <AliasGroupEdit onSave={()=> refresh()}/>
    </>
  );
};

PageCommandsAlias.getLayout = function getLayout(page: ReactElement) {
  return (
    <Layout>
      {page}
    </Layout>
  );
};

export default PageCommandsAlias;
