import { Keyword, KeywordGroup } from '@backend/database/entity/keyword';
import { Column } from '@devexpress/dx-react-grid';
import { Grid as DataGrid, Table, TableHeaderRow } from '@devexpress/dx-react-grid-material-ui';
import { Button, CircularProgress, Dialog, Grid, Stack } from '@mui/material';
import axios from 'axios';
import capitalize from 'lodash/capitalize';
import { useSnackbar } from 'notistack';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import SimpleBar from 'simplebar-react';

import { DeleteButton } from '../../components/Buttons/DeleteButton';
import EditButton from '../../components/Buttons/EditButton';
import { KeywordGroupEdit } from '../../components/Form/KeywordGroupEdit';
import { BoolTypeProvider } from '../../components/Table/BoolTypeProvider';
import { PermissionTypeProvider } from '../../components/Table/PermissionTypeProvider';
import getAccessToken from '../../getAccessToken';
import { getPermissionName } from '../../helpers/getPermissionName';
import { usePermissions } from '../../hooks/usePermissions';
import { useScope } from '../../hooks/useScope';
import { useTranslation } from '../../hooks/useTranslation';

const PageCommandsKeyword = () => {
  const scope = useScope('keywords');
  const { translate } = useTranslation();
  const { id } = useParams();
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
    axios.delete(`/api/systems/keywords/groups/${item.name}`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
      .finally(() => {
        enqueueSnackbar(`Keyword group ${item.name} deleted successfully. You can still see this group if it is being activelly used by keywords.`, { variant: 'success' });
        refresh();
      });
  }, [ enqueueSnackbar ]);

  const columns = useMemo<Column[]>(() => {
    const col: Column[] = [
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
            <EditButton href={'/commands/keywords/group/edit/' + row.name}/>
            <DeleteButton key='delete' onDelete={() => deleteItem(row)} />
          </Stack>,
        ],
      },
    ];

    if (scope.manage) {
      col.push({
        name:         'actions',
        title:        ' ',
        getCellValue: (row) => [
          <Stack direction="row" key="row">
            <EditButton href={'/commands/customcommands/group/edit/' + row.name}/>
            <DeleteButton key='delete' onDelete={() => deleteItem(row)} />
          </Stack>,
        ],
      });
    }
    return col;
  }, [ permissions, translate, deleteItem, groups, scope ]);

  useEffect(() => {
    refresh().then(() => setLoading(false));
  }, [location.pathname]);

  const refresh = async () => {
    await Promise.all([
      new Promise<void>(resolve => {
        axios.get(`/api/systems/keywords`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
          .then(({ data }) => {
            setItems(data.data);
            resolve();
          });
      }),
      new Promise<void>(resolve => {
        axios.get(`/api/systems/groups/keywords`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
          .then(({ data }) => {
            setGroupsSettings(data.data);
            resolve();
          });
      }),
    ]);
  };

  const open = React.useMemo(() => id !== undefined, [id]);

  return (
    <>
      <Grid container sx={{ pb: 0.7 }} spacing={1} alignItems='center'>
        <Grid item>
          <Button href='/commands/keywords/' sx={{ width: 240 }} color="secondary" variant="contained">Back to Keyword settings</Button>
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
            <Table columnExtensions={tableColumnExtensions as any}/>
            <TableHeaderRow/>
          </DataGrid>
        </SimpleBar>}

      <Dialog
        open={open}
        fullWidth
        maxWidth='md'>
        {open && <KeywordGroupEdit onSave={()=> refresh()}/>}
      </Dialog>
    </>
  );
};
export default PageCommandsKeyword;
