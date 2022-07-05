import { ArrowRight } from '@mui/icons-material';
import EditIcon from '@mui/icons-material/Edit';
import FilterIcon from '@mui/icons-material/FilterAlt';
import FilterOffIcon from '@mui/icons-material/FilterAltOff';
import SettingsIcon from '@mui/icons-material/Settings';
import {
  Box,
  Button,
  Collapse,
  IconButton, Paper, Stack, Typography,
} from '@mui/material';
import { grey } from '@mui/material/colors';
import {
  DataGrid, GridActionsColDef, GridColDef, GridSelectionModel,
} from '@mui/x-data-grid';
import { Alias, AliasGroup } from '@sogebot/backend/src/database/entity/alias';
import capitalize from 'lodash/capitalize';
import { useRouter } from 'next/router';
import { useSnackbar } from 'notistack';
import {
  ReactElement, useCallback, useEffect, useMemo, useState,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useDidMount } from 'rooks';

import { DisabledAlert } from '@/components/System/DisabledAlert';
import { NextPageWithLayout } from '~/pages/_app';
import { DotDivider } from '~/src/components/Dashboard/Widget/Bot/Events';
import { GridActionAliasMenu } from '~/src/components/GridAction/AliasMenu';
import { Layout } from '~/src/components/Layout/main';
import { AliasBulk } from '~/src/components/RightDrawer/AliasBulk';
import { AliasEdit } from '~/src/components/RightDrawer/AliasEdit';
import { getPermissionName } from '~/src/helpers/getPermissionName';
import { getSocket } from '~/src/helpers/socket';
import translate from '~/src/helpers/translate';
import { usePermissions } from '~/src/hooks/usePermissions';
import { setBulkCount } from '~/src/store/appbarSlice';
import { showEditDialog } from '~/src/store/pageSlice';
import theme from '~/src/theme';

const PageCommandsAlias: NextPageWithLayout = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();

  const { id } = router.query;

  const [ items, setItems ] = useState<Alias[]>([]);
  const [ groups, setGroups ] = useState<string[]>([]);
  const [ groupsSettings, setGroupsSettings ] = useState<AliasGroup[]>([]);
  const [ loading, setLoading ] = useState(true);
  const { search } = useSelector((state: any) => state.appbar);
  const { permissions } = usePermissions();
  const [ selectedItemsObject, setSelectedItems ] = useState<{ [x: string]: string[]}[]>([]);
  const [ groupCollapse, setGroupCollapse ] = useState<(string | null)[]>([null]);

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
            router.push('/commands/alias/edit/' + params.row.id); dispatch(showEditDialog(true));
          }}>Edit</Button>,
        <GridActionAliasMenu key='delete' onDelete={() => deleteItem(params.row)} />,
      ],
    },
  ];

  const deleteItem = useCallback((item: Alias) => {
    getSocket('/systems/alias').emit('generic::deleteById', item.id, () => {
      enqueueSnackbar(`Alias ${item.alias} deleted successfully.`, { variant: 'success' });
    });
  }, [ enqueueSnackbar ]);

  useDidMount(async () => {
    if (id) {
      dispatch(showEditDialog(true));
    }
    refresh();
    setLoading(false);
  });

  useEffect(() => {
    refresh();
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
          setGroups(Array.from(new Set(res.map(o => o.group))));
          resolve();
        });
      }),
      new Promise<void>(resolve => {
        getSocket('/systems/alias').emit('generic::groups::getAll', (err, res) => {
          if (err) {
            resolve();
            return console.error(err);
          }
          console.log({ res });
          setGroupsSettings(res);
          resolve();
        });
      }),
    ]);
  };

  const handleSelectionChange = (group: string | null, selectionModel: GridSelectionModel) => {
    setSelectedItems({ ...selectedItemsObject, [`__%%${group}%%__`]: selectionModel });
  };

  const selectedItems = useMemo(() => {
    return Object.values(selectedItemsObject).flat();
  }, [selectedItemsObject]);

  useEffect(() => {
    dispatch(setBulkCount(selectedItems.length));
  }, [selectedItems, dispatch]);

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

  return (
    <>
      <DisabledAlert system='alias'/>
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
            <IconButton sx={{ height: 'fit-content' }}>
              <SettingsIcon/>
            </IconButton>
          </Stack>
          <Collapse in={groupCollapse.includes(group)}>
            <DataGrid
              sx={{
                border: 0, backgroundColor: grey[900], mt: 2,
              }}
              autoHeight
              onSelectionModelChange={(selectionModel) => handleSelectionChange(group, selectionModel)}
              loading={loading}
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
      <AliasBulk/>
      <AliasEdit aliasGroups={groupsSettings} aliases={items}/>
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
