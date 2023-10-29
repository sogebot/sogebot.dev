import {
  DragDropContext, Draggable, Droppable,
} from '@hello-pangea/dnd';
import { AddTwoTone } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Backdrop,
  Box,
  Checkbox,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Stack,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material';
import { blueGrey, grey } from '@mui/material/colors';
import Select from '@mui/material/Select';
import { Permissions } from '@sogebot/backend/dest/database/entity/permissions';
import defaultPermissions from '@sogebot/backend/src/helpers/permissions/defaultPermissions';
import {
  capitalize,
  cloneDeep, orderBy, sortBy,
} from 'lodash';
import { nanoid } from 'nanoid';
import { useSnackbar } from 'notistack';
import React, {
  useCallback, useEffect, useMemo, useState,
} from 'react';
import {
  useLocation, useNavigate, useParams,
} from 'react-router-dom';
import { v4 } from 'uuid';

import { ConfirmButton } from '../../components/Buttons/ConfirmButton';
import { FilterMaker } from '../../components/Permissions/FilterMaker';
import { PermissionsListItem } from '../../components/Permissions/ListItem';
import { TestUserField } from '../../components/Permissions/TestUserField';
import { UserSearchlist } from '../../components/Permissions/UserSearchList';
import { getSocket } from '../../helpers/socket';
import { useTranslation } from '../../hooks/useTranslation';

const PageSettingsPermissions = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { translate } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();

  const [ items, setItems ] = useState<Permissions[]>([]);
  const [ loading, setLoading ] = useState(true);
  const [ removing, setRemoving ] = useState(false);
  const [ saving, setSaving ] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      new Promise<void>(resolve => {
        getSocket('/core/permissions').emit('generic::getAll', (err, data) => {
          if (err) {
            console.error(err);
            return;
          }
          console.groupCollapsed('permissions::generic::getAll');
          console.log(data);
          console.groupEnd();
          setItems(data);

          if (!id) {
            navigate(`/settings/permissions/edit/4300ed23-dca0-4ed9-8014-f5f2f7af55a9`);
          }
          resolve();
        });
      }),
    ]);
    setLoading(false);
  }, [ id, navigate ]);

  useEffect(() => {
    refresh();
  }, [location.pathname, refresh ]);

  React.useEffect(() => {
    for (let i = 0; i < items.length; i++) {
      if (items[i].order !== i) {
        // order is not correct, reorder
        reorder(true);
        break;
      }
    }
  }, [ items ]);

  const reorder = useCallback((quiet = false) => {
    if (!items) {
      return;
    }
    const viewers = cloneDeep(items.find(o => o.id === defaultPermissions.VIEWERS));
    const sorted = (sortBy(items.filter(o => o.id !== defaultPermissions.VIEWERS), 'order', 'asc') as Permissions[]).map((o, idx) => ({
      ...o, order: idx,
    })) as Permissions[];
    if (viewers) {
      viewers.order = sorted.length;
      sorted.push(viewers);
    }
    getSocket('/core/permissions').emit('permission::save', sorted as Permissions[], () => {
      if (!quiet) {
        enqueueSnackbar('Permissions updated.', { variant: 'success' });
      }
      return;
    });
    setItems(sorted);
  }, [enqueueSnackbar, items]);

  const [ selectedItem, setSelectedItem ] = useState<null | Permissions>(null);
  useEffect(() => {
    setSelectedItem(id ? items.find(o => o.id === id) ?? null : null);
  }, [items, id]);

  const onDragEndHandler = useCallback((value: any) => {
    if (!value.destination) {
      return;
    }
    const destIdx = value.destination.index;
    const PID = value.draggableId;

    setItems(o => {
      const output: Permissions[] = [];

      const _permissions = orderBy(o, 'order', 'asc');
      const fromIdx = _permissions.findIndex(m => m.id === PID);

      if (fromIdx === destIdx) {
        return o;
      }

      for (let idx = 0; idx < o.length; idx++) {
        const permission = _permissions[idx];
        if (permission.id === PID) {
          continue;
        }

        if (idx === destIdx && destIdx === 1) {
          const dragged = _permissions[fromIdx];
          dragged.order = output.length;
          output.push(dragged);
        }

        permission.order = output.length;
        output.push(permission);

        if (idx === destIdx && destIdx > 1) {
          const dragged = _permissions[fromIdx];
          dragged.order = output.length;
          output.push(dragged);
        }
      }
      return output;
    });
    reorder();
  }, [reorder]);

  const addNewPermissionGroup = useCallback(() => {
    const data = Object.assign(new Permissions(), {
      id:                 v4(),
      name:               nanoid(),
      isCorePermission:   false,
      isWaterfallAllowed: true,
      automation:         'none',
      order:              items.length - 1,
      userIds:            [],
      excludeUserIds:     [],
      filters:            [],
    });
    setItems(permissions => {
      permissions.push(data);
      return [...permissions];
    });
    setTimeout(() => reorder(), 10); // include save
    return;
  }, [ items, reorder ]);

  const orderedPermissions = useMemo(() => {
    return orderBy(items, 'order', 'asc').filter(o =>
      o.id !== '4300ed23-dca0-4ed9-8014-f5f2f7af55a9' // exclude casters
      && o.id !== '0efd7b1c-e460-4167-8e06-8aaf2c170311', // exclude viewers
    );
  }, [ items ]);

  const handlePermissionChange = useCallback(<T extends keyof Permissions>(key: T, value: Permissions[T]) => {
    if (!selectedItem) {
      return;
    }
    const update = cloneDeep(selectedItem);
    update[key] = value;
    setSelectedItem(update);
  }, [ selectedItem ]);

  const removeSelectedPermission = useCallback(() => {
    if (!selectedItem || selectedItem.isCorePermission) {
      return;
    }
    setRemoving(true);
    getSocket('/core/permissions').emit('generic::deleteById', selectedItem.id, async () => {
      enqueueSnackbar(`Permissions ${selectedItem.name} removed.`, { variant: 'success' });
      navigate('/settings/permissions/edit/4300ed23-dca0-4ed9-8014-f5f2f7af55a9');
      setRemoving(false);
      await refresh();
    });
  }, [ enqueueSnackbar, selectedItem, refresh, navigate, reorder ]);

  const saveSelectedPermission = useCallback(() => {
    setSaving(true);
    if (!selectedItem || selectedItem.isCorePermission) {
      return;
    }
    getSocket('/core/permissions').emit('permission::save', [...items, selectedItem] as any, async () => {
      enqueueSnackbar(`Permissions ${selectedItem.name} updated.`, { variant: 'success' });
      await refresh();
    });
    setSaving(false);
  }, [ enqueueSnackbar, selectedItem, refresh, items, reorder ]);

  return (
    <>
      <Backdrop open={loading} >
        <CircularProgress color="inherit"/>
      </Backdrop>

      <Grid container spacing={1}>
        <Grid item xs={4}>
          <Box sx={{
            width: '100%', bgcolor: grey[900], border: `1px solid ${grey[800]}`,
          }}>
            <Toolbar sx={{
              backgroundColor: blueGrey[900], minHeight: '47px !important',
            }}>
              <Typography
                variant="button"
                component="div"
                fontSize={'16px'}
                fontWeight={'bold'}
                sx={{ flexGrow: 1 }}
              >
                { translate('core.permissions.permissionsGroups') }
              </Typography>

              <IconButton
                onClick={() => addNewPermissionGroup()}
                color="inherit"
                aria-label="open drawer"
                edge="start"
              >
                <AddTwoTone />
              </IconButton>
            </Toolbar>

            <Stack>
              {items.length > 0
              && <PermissionsListItem permission={items.find(o => o.id === '4300ed23-dca0-4ed9-8014-f5f2f7af55a9')!}/>
              }

              <DragDropContext onDragEnd={onDragEndHandler}>
                <Droppable droppableId="droppable">
                  {(droppableProvided) => (<>
                    <Stack ref={droppableProvided.innerRef}>
                      {orderedPermissions.map((permission) => (
                        <Draggable key={permission.id} draggableId={permission.id} index={permission.order} isDragDisabled={permission.id === '4300ed23-dca0-4ed9-8014-f5f2f7af55a9'}>
                          {(draggableProvided) => (
                            <PermissionsListItem permission={permission} draggableProvided={draggableProvided}/>
                          )}
                        </Draggable>
                      ))}
                    </Stack>
                    {droppableProvided.placeholder}
                  </>
                  )}
                </Droppable>
              </DragDropContext>

              {items.length > 0 && <PermissionsListItem permission={items.find(o => o.id === '0efd7b1c-e460-4167-8e06-8aaf2c170311')!}/>}

              <Alert severity='info' sx={{ width: '100%' }}>
                { translate('core.permissions.higherPermissionHaveAccessToLowerPermissions') }
              </Alert>
            </Stack>
          </Box>
        </Grid>
        <Grid item xs={8}>
          {selectedItem && <Box sx={{
            width: '100%', bgcolor: grey[900], border: `1px solid ${grey[800]}`,
          }} key={selectedItem.id}>
            <Toolbar sx={{
              backgroundColor: blueGrey[900], minHeight: '47px !important',
            }}>
              <Typography
                variant="button"
                component="div"
                fontSize={'16px'}
                fontWeight={'bold'}
                sx={{ flexGrow: 1 }}
              >
                { translate('core.permissions.settings') }
              </Typography>
            </Toolbar>
            <Box
              component="form"
              sx={{
                px:                       1,
                '& .MuiFormControl-root': { my: 1 },
              }}
              noValidate
              autoComplete="off"
            >
              <TextField
                fullWidth
                disabled={selectedItem.isCorePermission}
                variant="filled"
                value={selectedItem.name}
                required
                onChange={(event) => handlePermissionChange('name', event.target.value)}
                label={capitalize(translate('core.permissions.name'))}
              />

              {!selectedItem.isCorePermission
                && <FormControl fullWidth variant="filled" >
                  <InputLabel id="permission-select-label" shrink>{translate('permissions')}</InputLabel>
                  <Select
                    value={selectedItem.automation}
                    onChange={(event) => handlePermissionChange('automation', event.target.value)}
                    label={capitalize(translate('core.permissions.baseUsersSet'))}
                  >
                    {['none', 'casters', 'moderators', 'subscribers', 'vip', 'viewers'].map(item => <MenuItem key={item} value={item}>{translate(`core.permissions.${item}`)}</MenuItem>)}
                  </Select>
                </FormControl>}

              <TestUserField permissionId={selectedItem.id}/>

              {!selectedItem.isCorePermission
                && <FormGroup>
                  <FormControlLabel control={<Checkbox checked={selectedItem.isWaterfallAllowed} onClick={() => handlePermissionChange('isWaterfallAllowed', !selectedItem.isWaterfallAllowed)} />} label={capitalize(translate('core.permissions.allowHigherPermissions'))} />
                </FormGroup>}

              {!selectedItem.isCorePermission
                && <>
                  <Divider sx={{ m: 1.5 }}>
                    <FormLabel>{ translate('responses.variable.users') }</FormLabel>
                  </Divider>
                  <UserSearchlist label={translate('core.permissions.manuallyAddedUsers')} users={selectedItem.userIds} onChange={(value) => {
                    handlePermissionChange('userIds', value);
                  }}/>
                  <UserSearchlist label={translate('core.permissions.manuallyExcludedUsers')} users={selectedItem.excludeUserIds} onChange={(value) => {
                    handlePermissionChange('excludeUserIds', value);
                  }}/>
                </>}

              {!selectedItem.isCorePermission
                && <FilterMaker model={selectedItem.filters} onChange={filters => handlePermissionChange('filters', filters)}/>
              }

              <Divider sx={{ mt: 1.5 }}/>

              {!selectedItem.isCorePermission
                && <Grid container sx={{ py: 1 }} justifyContent='space-between'>
                  <Grid item>
                    <ConfirmButton loading={removing} variant="contained" color='error' sx={{ minWidth: '250px' }} handleOk={() => removeSelectedPermission()}>{ translate('delete') }</ConfirmButton>
                  </Grid>
                  <Grid item>
                    <LoadingButton loading={saving} variant="contained" sx= {{ minWidth: '250px' }} onClick={() => saveSelectedPermission()}>{ translate('dialog.buttons.saveChanges.idle') }</LoadingButton>
                  </Grid>
                </Grid>
              }
            </Box>
          </Box>}

        </Grid>
      </Grid>
    </>
  );
};
export default PageSettingsPermissions;
