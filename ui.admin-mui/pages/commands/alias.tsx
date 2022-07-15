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
  Box,
  Button,
  CircularProgress,
  Collapse,
  Grid,
  IconButton, Paper, Stack, Tooltip, Typography,
} from '@mui/material';
import { grey } from '@mui/material/colors';
import {
  DataGrid, GridActionsColDef, GridColDef, GridRowId, GridSelectionModel,
} from '@mui/x-data-grid';
import { Alias, AliasGroup } from '@sogebot/backend/src/database/entity/alias';
import capitalize from 'lodash/capitalize';
import { useRouter } from 'next/router';
import { useSnackbar } from 'notistack';
import {
  ReactElement, useCallback, useEffect, useMemo, useState,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import SimpleBar from 'simplebar-react';

import { DisabledAlert } from '@/components/System/DisabledAlert';
import { NextPageWithLayout } from '~/pages/_app';
import { ButtonsDeleteBulk } from '~/src/components/Buttons/DeleteBulk';
import { ButtonsGroupBulk } from '~/src/components/Buttons/GroupBulk';
import { ButtonsPermissionsBulk } from '~/src/components/Buttons/PermissionsBulk';
import { DotDivider } from '~/src/components/Dashboard/Widget/Bot/Events';
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
  const { search, bulkCount } = useSelector((state: any) => state.appbar);
  const { permissions } = usePermissions();
  const [ selectedItemsObject, setSelectedItems ] = useState<{ [x: string]: GridRowId[]}>({ });
  const [ groupCollapse, setGroupCollapse ] = useState<(string | null)[]>([null]);

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

  const handleSelectionChange = useCallback((group: string | null, selectionModel: GridSelectionModel) => {
    setSelectedItems({ ...selectedItemsObject, [`__%%${group}%%__`]: selectionModel });
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

  const filteredItems = useMemo(() => {
    if (search.length === 0) {
      return items;
    }

    return items.filter(item => {
      const values = Object.values(item).map(o => String(o).toLowerCase());
      for (const value of values) {
        if (value.includes(search)) {
          return true;
        }
      }
      return false;
    });
  }, [items, search]);

  const getGroupSettings = useCallback((name: string): AliasGroup => {
    const groupSetting = groupsSettings.find(o => o.name === name);
    if (!groupSetting) {
      return { name, options: { filter: null, permission: null } } as AliasGroup;
    }
    return groupSetting;
  }, [ groupsSettings ]);

  const handleSetGroupCollapse = useCallback((group: string | null) => {
    if (groupCollapse.includes(group)) {
      setGroupCollapse(groupCollapse.filter(o => o !== group));
    } else {
      setGroupCollapse([...groupCollapse, group]);
    }
  }, [ groupCollapse ]);

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
      nextTick(() => setSelectedItems({ [`__%%${value}%%__`]: selectedItems }));
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
    setSelectedItems({});
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

      {loading
        ? <CircularProgress color="inherit" sx={{
          position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, 0)',
        }} />
        : <SimpleBar style={{ maxHeight: 'calc(100vh - 116px)' }} autoHide={false}>
          {groups.length === 0 && <Alert severity="info" variant="outlined" sx={{
            margin:    'auto',
            width:     '50%',
            marginTop: '3rem',
          }} >
            No aliases found, please add them with create new alias button.
          </Alert>}
          {groups.map((group, idx) => (<div key={group}>
            <Paper sx={{
              mx: 0.1, p: 1, px: 3, mt: idx === 0 ? 0 : 1,
            }}>
              <Stack direction="row" justifyContent="end" alignItems="center">
                <Box sx={{ flex: 'auto' }}  onClick={() => handleSetGroupCollapse(group)}>
                  <IconButton onClick={() => handleSetGroupCollapse(group)}>
                    <ArrowRight sx={{ transition: 'all 500ms', transform: `rotateZ(${groupCollapse.includes(group) ? '90' : '0'}deg)` }}/>
                  </IconButton>
                  <Typography variant="overline" fontSize={20} fontWeight={'bold'}>
                    {group ? group : 'Ungrouped'}
                  </Typography>
                  <Typography variant="overline" fontSize={15} fontWeight={'bold'} pl={1} sx={{ color: theme.palette.primary.main }}>
                    {items.filter(o => o.group === group).length}
                    { search.length > 0 && <Typography component='span' variant="overline" fontSize={12} pl={0.4}>
                      <DotDivider/> {filteredItems.filter(o => o.group === group).length}
                    </Typography>}
                  </Typography>
                </Box>
                <div>
                  {group && groupsSettings.length > 0 && <>
                    <Typography display={'inline-block'} color={!getGroupSettings(group).options.filter ? theme.palette.grey[600] : 'undefined'}>
                      {!getGroupSettings(group).options.filter ? <FilterOffIcon/> : <FilterIcon/>}
                      <Typography component={'span'} sx={{ display: 'inline-block', transform: 'translateY(-5px)' }}>
                        {getGroupSettings(group).options.filter ? getGroupSettings(group).options.filter : 'No filters set'}
                      </Typography>
                    </Typography>
                    <Typography sx={{
                      display: 'inline-block', transform: 'translateY(-5px)', ml: 2,
                    }} color={!getGroupSettings(group).options.permission ? theme.palette.error.dark : 'undefined'}>
                      {getGroupSettings(group).options.permission === null ? '-- unset --' : getPermissionName(getGroupSettings(group).options.permission, permissions || [])}
                    </Typography>
                  </>}
                </div>
                {group && <IconButton sx={{ height: 'fit-content', marginLeft: 2 }} onClick={() => router.push(`/commands/alias/group/edit/${getGroupSettings(group).name}`)}>
                  <SettingsIcon/>
                </IconButton>}
              </Stack>
              <Collapse in={groupCollapse.includes(group)}>
                <DataGrid
                  sx={{
                    border: 0, backgroundColor: grey[900], mt: 2,
                  }}
                  autoHeight
                  selectionModel={selectedItemsObject[`__%%${group}%%__`]}
                  onSelectionModelChange={(selectionModel) => handleSelectionChange(group, selectionModel)}
                  rows={filteredItems.filter(o => o.group === group)}
                  columns={columns}
                  hideFooter
                  checkboxSelection
                  disableColumnFilter
                  disableColumnSelector
                  disableColumnMenu
                />
              </Collapse>
            </Paper>
          </div>))}
        </SimpleBar>}
      <AliasEdit aliasGroups={groupsSettings} aliases={items}/>
      <AliasGroupEdit onSave={() => refresh()}/>
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
