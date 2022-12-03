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
import { Keyword, KeywordGroup } from '@sogebot/backend/src/database/entity/keyword';
import axios from 'axios';
import capitalize from 'lodash/capitalize';
import { useRouter } from 'next/router';
import { useSnackbar } from 'notistack';
import {
  ReactElement, useCallback, useEffect, useMemo, useState,
} from 'react';
import SimpleBar from 'simplebar-react';

import { NextPageWithLayout } from '~/pages/_app';
import { GridActionAliasMenu } from '~/src/components/GridAction/AliasMenu';
import { Layout } from '~/src/components/Layout/main';
import { KeywordGroupEdit } from '~/src/components/RightDrawer/KeywordGroupEdit';
import { BoolTypeProvider } from '~/src/components/Table/BoolTypeProvider';
import { PermissionTypeProvider } from '~/src/components/Table/PermissionTypeProvider';
import getAccessToken from '~/src/getAccessToken';
import { getPermissionName } from '~/src/helpers/getPermissionName';
import { usePermissions } from '~/src/hooks/usePermissions';
import { useTranslation } from '~/src/hooks/useTranslation';

const PageCommandsKeyword: NextPageWithLayout = () => {
  const { translate } = useTranslation();
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();

  const [ items, setItems ] = useState<Keyword[]>([]);
  const [ groupsSettings, setGroupsSettings ] = useState<KeywordGroup[]>([]);
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

  const groupsSettingsAll = useMemo((): KeywordGroup[] => {
    const groupSet: KeywordGroup[] = [...groupsSettings];
    for (const group of groups) {
      if (group) {
        if (!groupsSettings.find(o => o.name === group)) {
          groupSet.push({
            name:    group,
            options: {
              filter: null, permission: null,
            },
          } as KeywordGroup);
        }
      }
    }
    return groupSet;
  }, [ groupsSettings, groups ]);

  const deleteItem = useCallback((item: KeywordGroup) => {
    axios.delete(`${JSON.parse(localStorage.server)}/api/systems/keywords/groups/${item.name}`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
      .finally(() => {
        enqueueSnackbar(`Keyword group ${item.name} deleted successfully. You can still see this group if it is being activelly used by keywords.`, { variant: 'success' });
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
          <Button
            size='small'
            variant="contained"
            startIcon={<EditIcon/>}
            onClick={() => {
              router.push('/commands/keywords/group/edit/' + row.name);
            }}>Edit</Button>
          <GridActionAliasMenu key='delete' onDelete={() => deleteItem(row)} />
        </Stack>,
      ],
    },
  ], [ permissions, translate, router, deleteItem, groups ]);

  useEffect(() => {
    refresh().then(() => setLoading(false));
  }, [router]);

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

  return (
    <>
      <Grid container sx={{ pb: 0.7 }} spacing={1} alignItems='center'>
        <Grid item>
          <Button sx={{ width: 240 }} color="secondary" variant="contained" onClick={() => {
            router.push('/commands/keywords/');
          }}>Back to Keyword settings</Button>
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
      <KeywordGroupEdit onSave={()=> refresh()}/>
    </>
  );
};

PageCommandsKeyword.getLayout = function getLayout(page: ReactElement) {
  return (
    <Layout>
      {page}
    </Layout>
  );
};

export default PageCommandsKeyword;
