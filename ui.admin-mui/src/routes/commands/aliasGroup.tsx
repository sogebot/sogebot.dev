import { Column } from '@devexpress/dx-react-grid';
import { Grid as DataGrid, Table, TableHeaderRow } from '@devexpress/dx-react-grid-material-ui';
import { Button, CircularProgress, Dialog, Grid, Stack } from '@mui/material';
import { Alias, AliasGroup } from '@sogebot/backend/src/database/entity/alias';
import axios from 'axios';
import capitalize from 'lodash/capitalize';
import { useSnackbar } from 'notistack';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import SimpleBar from 'simplebar-react';

import { DeleteButton } from '../../components/Buttons/DeleteButton';
import EditButton from '../../components/Buttons/EditButton';
import { AliasGroupEdit } from '../../components/Form/AliasGroupEdit';
import { BoolTypeProvider } from '../../components/Table/BoolTypeProvider';
import { PermissionTypeProvider } from '../../components/Table/PermissionTypeProvider';
import getAccessToken from '../../getAccessToken';
import { getPermissionName } from '../../helpers/getPermissionName';
import { usePermissions } from '../../hooks/usePermissions';
import { useScope } from '../../hooks/useScope';
import { useTranslation } from '../../hooks/useTranslation';

const PageCommandsAliasGroup = () => {
  const scope = useScope('systems:alias');

  const { translate } = useTranslation();
  const { id } = useParams();
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
    axios.delete(`/api/systems/groups/alias/${item.name}`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
      .finally(() => {
        enqueueSnackbar(`Alias group ${item.name} deleted successfully. You can still see this group if it is being activelly used by aliases.`, { variant: 'success' });
        refresh();
      });
  }, [ enqueueSnackbar ]);

  const columns = useMemo<Column[]>(() => {
    const clmns: Column[] = [
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
      }
    ];
    if (scope.manage) {
      clmns.push({
        name:         'actions',
        title:        ' ',
        getCellValue: (row) => [
          <Stack direction="row" key="row">
            <EditButton href={'/commands/alias/group/edit/' + row.name}/>
            <DeleteButton key='delete' onDelete={() => deleteItem(row)} />
          </Stack>,
        ],
      });
    }
    return clmns;
  }, [ permissions, translate, deleteItem, groups ]);

  useEffect(() => {
    refresh().then(() => setLoading(false));
  }, []);

  const refresh = async () => {
    console.log('Refresh');
    await Promise.all([
      new Promise<void>(resolve => {
        axios.get(`/api/systems/alias`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
          .then(({ data }) => {
            if (data.status === 'success') {
              setItems(data.data);
            }
            resolve();
          });
      }),
      new Promise<void>(resolve => {
        axios.get(`/api/systems/groups/alias`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
          .then(({ data }) => {
            if (data.status === 'success') {
              setGroupsSettings(data.data);
            }
            resolve();
          });
      }),
    ]);
  };

  const open = React.useMemo(() => id !== undefined, [id]);

  return (<>
    <Grid container sx={{ pb: 0.7 }} spacing={1} alignItems='center'>
      <Grid item>
        <Button sx={{ width: 220 }} color="secondary" variant="contained" href='/commands/alias/'>Back to Alias settings</Button>
      </Grid>
    </Grid>

    {loading
      ? <CircularProgress color="inherit" sx={{
        position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, 0)',
      }} />
      : <SimpleBar style={{ maxHeight: 'calc(100vh - 116px)' }} autoHide={false}>
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
          <Table columnExtensions={tableColumnExtensions}/>
          <TableHeaderRow/>
        </DataGrid>
      </SimpleBar>}

    <Dialog
      open={open}
      fullWidth
      maxWidth='md'>
      {open && <AliasGroupEdit onSave={()=> refresh()}/>}
    </Dialog>
  </>
  );
};
export default PageCommandsAliasGroup;
