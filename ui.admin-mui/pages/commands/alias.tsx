import { nextTick } from 'process';

import {
  ArrowRight, CheckBoxTwoTone, DisabledByDefaultTwoTone, VisibilityOffTwoTone, VisibilityTwoTone,
} from '@mui/icons-material';
import EditIcon from '@mui/icons-material/Edit';
import FilterIcon from '@mui/icons-material/FilterAlt';
import FilterOffIcon from '@mui/icons-material/FilterAltOff';
import SettingsIcon from '@mui/icons-material/Settings';
import {
  Alert,
  Badge,
  Box,
  Button,
  CircularProgress,
  Collapse,
  Grid,
  IconButton, Paper, Stack, Tooltip, Typography,
} from '@mui/material';
import { grey } from '@mui/material/colors';
import {
  DataGrid, GridActionsColDef, GridColDef, GridRowId, GridSelectionModel, GridSortModel,
} from '@mui/x-data-grid';
import { Alias, AliasGroup } from '@sogebot/backend/src/database/entity/alias';
import capitalize from 'lodash/capitalize';
import { useRouter } from 'next/router';
import { useSnackbar } from 'notistack';
import {
  ReactElement, useCallback, useEffect, useMemo, useReducer, useState,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { DisabledAlert } from '@/components/System/DisabledAlert';
import { NextPageWithLayout } from '~/pages/_app';
import { ButtonsDeleteBulk } from '~/src/components/Buttons/DeleteBulk';
import { ButtonsGroupBulk } from '~/src/components/Buttons/GroupBulk';
import { ButtonsPermissionsBulk } from '~/src/components/Buttons/PermissionsBulk';
import { GridActionAliasMenu } from '~/src/components/GridAction/AliasMenu';
import { Layout } from '~/src/components/Layout/main';
import { AliasEdit } from '~/src/components/RightDrawer/AliasEdit';
import { AliasGroupEdit } from '~/src/components/RightDrawer/AliasGroupEdit';
import { getPermissionName } from '~/src/helpers/getPermissionName';
import { getSocket } from '~/src/helpers/socket';
import { usePermissions } from '~/src/hooks/usePermissions';
import { useTranslation } from '~/src/hooks/useTranslation';
import { setBulkCount } from '~/src/store/appbarSlice';
import theme from '~/src/theme';
import 'simplebar-react/dist/simplebar.min.css';

const PageCommandsAlias: NextPageWithLayout = () => {
  const { translate } = useTranslation();
  const dispatch = useDispatch();
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();

  const [ items, setItems ] = useState<Alias[]>([]);
  const [ groupsSettings, setGroupsSettings ] = useState<AliasGroup[]>([]);
  const [ loading, setLoading ] = useState(true);
  const { bulkCount } = useSelector((state: any) => state.appbar);
  const { permissions } = usePermissions();
  const [ selectedItemsObject, setSelectedItems ] = useState<GridRowId[]>([]);
  const [ sortModel, setSortModel ] = useState<GridSortModel>([{ field: 'alias', sort: 'asc' }]);

  const [ showGroups, setShowGroups ] = useReducer((state: (string | null)[], value: string | null) => {
    if (state.includes(value)) {
      return state.filter(o => o !== value);
    } else {
      return [...state, value];
    }
  }, []);

  const groups = useMemo(() => {
    return Array.from(new Set(items.map(o => o.group)));
  }, [items]);

  const columns: (GridColDef | GridActionsColDef)[] = [
    {
      field: 'alias', headerName: translate('alias'), flex: 0.3, hideable: false,
    },
    {
      field: 'command', headerName: translate('command'), flex: 1, hideable: false,
    },
    {
      field:      'permission', headerName: translate('permission'), hideable:   false,
      renderCell: (params) => {
        return (<Typography color={!params.row.permission ? theme.palette.error.dark : 'undefined'}>
          {params.row.permission === null ? '-- unset --' : getPermissionName(params.row.permission, permissions || [])}
        </Typography>);
      },
    },
    {
      field: 'enabled', headerName: capitalize(translate('enabled')), type: 'boolean', hideable: false,
    },
    {
      field: 'visible', headerName: capitalize(translate('visible')), type: 'boolean', hideable: false,
    },
    {
      field: 'group', headerName: capitalize(translate('group')), hideable: false, flex: 0.15,
      renderCell: (params) => {
        return (<Typography color={!params.row.group ? grey['400'] : 'undefined'}>
          {params.row.group === null ? 'ungrouped' : params.row.group}
        </Typography>);
      },
    },
    {
      field:      'actions',
      type:       'actions',
      hideable:   false,
      align:      'right',
      minWidth:   150,
      getActions: (params) => [
        <Button
          size='small'
          key="edit"
          variant="contained"
          startIcon={<EditIcon/>}
          onClick={() => {
            router.push('/commands/alias/edit/' + params.row.id);
          }}>Edit</Button>,
        <GridActionAliasMenu key='delete' onDelete={() => deleteItem(params.row)} />,
      ],
    },
  ];

  const deleteItem = useCallback((item: Alias) => {
    getSocket('/systems/alias').emit('generic::deleteById', item.id, () => {
      enqueueSnackbar(`Alias ${item.alias} deleted successfully.`, { variant: 'success' });
      refresh();
    });
  }, [ enqueueSnackbar ]);

  useEffect(() => {
    refresh().then(() => setLoading(false));
  }, [router]);

  const refresh = async () => {
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

  const handleSelectionChange = useCallback((selectionModel: GridSelectionModel) => {
    setSelectedItems(selectionModel);
  }, [selectedItemsObject]);

  const selectedItems = useMemo(() => {
    return Object.values(selectedItemsObject).flat();
  }, [selectedItemsObject]);

  useEffect(() => {
    dispatch(setBulkCount(selectedItems.length));
  }, [selectedItems, dispatch]);

  const bulkCanVisOff = useMemo(() => {
    for (const itemId of selectedItems) {
      const item = items.find(o => o.id === itemId);
      if (item && item.visible) {
        return true;
      }
    }
    return false;
  }, [ selectedItems, items ]);

  const bulkCanVisOn = useMemo(() => {
    for (const itemId of selectedItems) {
      const item = items.find(o => o.id === itemId);
      if (item && !item.visible) {
        return true;
      }
    }
    return false;
  }, [ selectedItems, items ]);

  const bulkCanEnable = useMemo(() => {
    for (const itemId of selectedItems) {
      const item = items.find(o => o.id === itemId);
      if (item && !item.enabled) {
        return true;
      }
    }
    return false;
  }, [ selectedItems, items ]);

  const bulkCanDisable = useMemo(() => {
    for (const itemId of selectedItems) {
      const item = items.find(o => o.id === itemId);
      if (item && item.enabled) {
        return true;
      }
    }
    return false;
  }, [ selectedItems, items ]);

  /*const getGroupSettings = useCallback((name: string): AliasGroup => {
    const groupSetting = groupsSettings.find(o => o.name === name);
    if (!groupSetting) {
      return { name, options: { filter: null, permission: null } } as AliasGroup;
    }
    return groupSetting;
  }, [ groupsSettings ]);*/

  const bulkToggleAttribute = useCallback(async <T extends keyof Alias>(attribute: T, value: Alias[T]) => {
    for (const selected of selectedItems) {
      const item = items.find(o => o.id === selected);
      if (item && item[attribute] !== value) {
        await new Promise<void>((resolve) => {
          item[attribute] = value;
          getSocket('/systems/alias').emit('generic::save', item, () => {
            resolve();
          });
        });
      }
    }

    setItems(i => i.map((item) => {
      if (selectedItems.includes(item.id)) {
        item[attribute] = value;
      }
      return item;
    }));

    if (attribute === 'visible') {
      enqueueSnackbar(`Bulk operation set visibility ${value ? 'on' : 'off'}.`, { variant: 'success' });
    } else if (attribute === 'enabled') {
      enqueueSnackbar(`Bulk operation set ${value ? 'enabled' : 'disabled'}.`, { variant: 'success' });
    } else if (attribute === 'permission') {
      enqueueSnackbar(`Bulk operation set permission to ${permissions.find(o => o.id === value)?.name}.`, { variant: 'success' });
    } else if (attribute === 'group') {
      // we need next tick as it doesn't reselect without it
      nextTick(() => setSelectedItems(selectedItems));
      if (value) {
        enqueueSnackbar(`Bulk operation set group to ${value}.`, { variant: 'success' });
      } else {
        enqueueSnackbar(`Bulk operation removed group.`, { variant: 'success' });
      }
    }

    refresh();
  }, [ selectedItems, enqueueSnackbar, items, permissions ]);

  const bulkDelete =  useCallback(async () => {
    for (const selected of selectedItems) {
      const item = items.find(o => o.id === selected);
      if (item) {
        await new Promise<void>((resolve) => {
          getSocket('/systems/alias').emit('generic::deleteById', item.id, () => {
            resolve();
          });
        });
      }
    }
    setItems(i => i.filter(item => !selectedItems.includes(item.id)));
    enqueueSnackbar(`Bulk operation deleted items.`, { variant: 'success' });
    setSelectedItems([]);
  }, [ selectedItems, enqueueSnackbar, items ]);

  return (
    <>
      <DisabledAlert system='alias'/>
      <Grid container sx={{ pb: 0.7 }} spacing={1} alignItems='center'>
        <Grid item>
          <Button sx={{ width: 200 }} variant="contained" onClick={() => {
            router.push('/commands/alias/create/');
          }}>Create new alias</Button>
        </Grid>
        <Grid item>
          <Button sx={{ width: 200 }} variant="contained" onClick={() => {
            router.push('/commands/alias/group/edit');
          }} color='secondary'>Edit group settings</Button>
        </Grid>
        <Grid item>
          <Tooltip arrow title="Set visibility on">
            <Button disabled={!bulkCanVisOn} variant="contained" color="secondary" sx={{ minWidth: '36px', width: '36px' }} onClick={() => bulkToggleAttribute('visible', true)}><VisibilityTwoTone/></Button>
          </Tooltip>
        </Grid>
        <Grid item>
          <Tooltip arrow title="Set visibility off">
            <Button disabled={!bulkCanVisOff} variant="contained" color="secondary" sx={{ minWidth: '36px', width: '36px' }} onClick={() => bulkToggleAttribute('visible', false)}><VisibilityOffTwoTone/></Button>
          </Tooltip>
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
          <ButtonsGroupBulk disabled={bulkCount === 0} onSelect={groupId => bulkToggleAttribute('group', groupId)} groups={groups}/>
        </Grid>
        <Grid item>
          <ButtonsPermissionsBulk disabled={bulkCount === 0} onSelect={permId => bulkToggleAttribute('permission', permId)}/>
        </Grid>
        <Grid item>
          <ButtonsDeleteBulk disabled={bulkCount === 0} onDelete={bulkDelete}/>
        </Grid>
        <Grid item>
          {bulkCount > 0 && <Typography variant="button" px={2}>{ bulkCount } selected</Typography>}
        </Grid>
      </Grid>

      {groups.length > 0 && <Grid container sx={{ pb: 0.7 }} spacing={1} alignItems='center'>
        {groups.map((group, idx) => (
          <Grid item key={idx}>
            <Button variant={showGroups.includes(group) ? 'contained' : 'outlined'} onClick={() => setShowGroups(group)}>
              <Badge badgeContent={items.filter(o => o.group === group).length}
              sx={{
                '& .MuiBadge-badge': {
                  color:      'white',
                  textShadow: '0px 0px 5px black',
                  position:   'relative',
                  transform:  'scale(1) translate(30%, 1px)',
                  width:      '20px',
                },
              }}
              showZero>
                {group || 'Ungrouped'}
              </Badge>
            </Button>
          </Grid>
        )
        )}
      </Grid>
      }

      {loading
        ? <CircularProgress color="inherit" sx={{
          position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, 0)',
        }} />
        : <Paper sx={{
          m: 0, p: 1, height: 'calc(100vh - 158px)',
        }}>
          <DataGrid
            sx={{
              border: 0, backgroundColor: grey[900]
            }}
            selectionModel={selectedItemsObject}
            onSelectionModelChange={(selectionModel) => handleSelectionChange(selectionModel)}
            rows={items.filter(o => showGroups.length === 0 || showGroups.includes(o.group))}
            sortModel={sortModel}
            onSortModelChange={(model) => setSortModel(model)}
            columns={columns}
            autoPageSize
            checkboxSelection
          />
        </Paper>}
      <AliasEdit aliasGroups={groupsSettings} aliases={items}/>
      <AliasGroupEdit onSave={() => refresh()} groups={groups}/>
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
