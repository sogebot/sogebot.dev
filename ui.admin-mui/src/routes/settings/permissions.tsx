import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import { AddTwoTone } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import { Alert, Backdrop, Box, Checkbox, CircularProgress, Divider, FormControl, FormControlLabel, FormGroup, FormLabel, Grid, IconButton, InputLabel, MenuItem, Stack, TextField, Toolbar, Typography } from '@mui/material';
import { blueGrey, grey } from '@mui/material/colors';
import Select from '@mui/material/Select';
import { Permissions } from '@sogebot/backend/dest/database/entity/permissions';
import defaultPermissions from '@sogebot/backend/src/helpers/permissions/defaultPermissions';
import axios from 'axios';
import { capitalize, cloneDeep, orderBy, set, sortBy } from 'lodash';
import { nanoid } from 'nanoid';
import { useSnackbar } from 'notistack';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { v4 } from 'uuid';

import { ConfirmButton } from '../../components/Buttons/ConfirmButton';
import { FilterMaker } from '../../components/Permissions/FilterMaker';
import { PermissionsListItem } from '../../components/Permissions/ListItem';
import { ScopesSelector } from '../../components/Permissions/ScopesSelector';
import { TestUserField } from '../../components/Permissions/TestUserField';
import { UserSearchlist } from '../../components/Permissions/UserSearchList';
import getAccessToken from '../../getAccessToken';
import { usePermissions } from '../../hooks/usePermissions';
import { useScope } from '../../hooks/useScope';
import { useTranslation } from '../../hooks/useTranslation';

const PageSettingsPermissions = () => {
  const scope = useScope('permissions');
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { translate } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();

  const [ items, setItems ] = useState<Permissions[]>([]);
  const { permissions, refresh: refreshPerm } = usePermissions();
  const [ loading, setLoading ] = useState(true);
  const [ removing, setRemoving ] = useState(false);
  const [ saving, setSaving ] = useState(false);

  React.useEffect(() => {
    setItems(permissions);
  }, [ permissions]);

  const refresh = useCallback(async () => {
    setLoading(true);
    await refreshPerm();
    setLoading(false);

    if (!id) {
      navigate(`/settings/permissions/edit/4300ed23-dca0-4ed9-8014-f5f2f7af55a9`);
    }
  }, [ id, navigate ]);

  useEffect(() => {
    refresh();
  }, [location.pathname, refresh ]);

  React.useEffect(() => {
    for (let i = 0; i < items.length; i++) {
      if (items[i].order !== i) {
        // order is not correct, reorder
        reorder();
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
    console.log('permissions', 'Saving', sorted, new Error().stack);
    axios.post(`/api/core/permissions/`, sorted, {
      headers: {
        Authorization: `Bearer ${getAccessToken()}`
      }
    })
      .then(() => {
        if (!quiet) {
          enqueueSnackbar('Permissions updated.', { variant: 'success' });
        }
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

    const permissionId = value.draggableId;
    const ordered = orderBy(cloneDeep(items), 'order', 'asc');

    const destIdx = value.destination.index;
    const fromIdx = ordered.findIndex(m => m.id === permissionId);
    const fromItem = ordered.find(m => m.id === permissionId);

    if (fromIdx === destIdx || !fromItem) {
      return;
    }

    // remove fromIdx
    ordered.splice(fromIdx, 1);

    // insert into destIdx
    ordered.splice(destIdx, 0, fromItem);

    const reordered = ordered.map((o: any, idx) => ({
      ...o, order: idx + 1, // move everything by 1 so it forces save
    }));
    setItems(reordered);
  }, [items]);

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
      haveAllScopes:      false,
      excludeSensitiveScopes: true,
      scopes:             [],
    });
    setItems(it => {
      return [...it, data];
    });
    return;
  }, [ items, reorder ]);

  const orderedPermissions = useMemo(() => {
    return orderBy(items, 'order', 'asc').filter(o =>
      o.id !== '4300ed23-dca0-4ed9-8014-f5f2f7af55a9' // exclude casters
      && o.id !== '0efd7b1c-e460-4167-8e06-8aaf2c170311', // exclude viewers
    );
  }, [ items ]);

  const handlePermissionChange = useCallback(<T extends keyof Permissions>(values: { [x in T]: Permissions[T] }) => {
    if (!selectedItem) {
      return;
    }
    const update = cloneDeep(selectedItem);
    for (const [key, value] of Object.entries(values)) {
      set(update, key, value);
    }
    setSelectedItem(update);
  }, [ selectedItem ]);

  const removeSelectedPermission = useCallback(async () => {
    if (!selectedItem || selectedItem.isCorePermission) {
      return;
    }
    setRemoving(true);
    axios.delete(`/api/core/permissions/${selectedItem.id}`, {
      headers: {
        Authorization: `Bearer ${getAccessToken()}`
      }
    })
      .then(() => {
        enqueueSnackbar(`Permissions ${selectedItem.name} removed.`, { variant: 'success' });
        navigate('/settings/permissions/edit/4300ed23-dca0-4ed9-8014-f5f2f7af55a9');
        setRemoving(false);
        refresh();
      });
  }, [ enqueueSnackbar, selectedItem, refresh, navigate, reorder ]);

  const saveSelectedPermission = useCallback(() => {
    setSaving(true);
    if (!selectedItem) {
      return;
    }
    axios.post(`/api/core/permissions/`, [...items, selectedItem], {
      headers: {
        Authorization: `Bearer ${getAccessToken()}`
      }
    })
      .then(async () => {
        enqueueSnackbar(`Permissions ${selectedItem.name} updated.`, { variant: 'success' });
        refresh();
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

              {scope.manage && <IconButton
                onClick={() => addNewPermissionGroup()}
                color="inherit"
                aria-label="open drawer"
                edge="start"
              >
                <AddTwoTone />
              </IconButton>}
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
                disabled={selectedItem.isCorePermission || !scope.manage}
                variant="filled"
                value={selectedItem.name}
                required
                onChange={(event) => handlePermissionChange({ name: event.target.value })}
                label={capitalize(translate('core.permissions.name'))}
              />

              {!selectedItem.isCorePermission
                && <FormControl fullWidth variant="filled" disabled={!scope.manage}>
                  <InputLabel id="permission-select-label" shrink>{translate('permissions')}</InputLabel>
                  <Select
                    value={selectedItem.automation}
                    onChange={(event) => handlePermissionChange({ automation: event.target.value })}
                    label={capitalize(translate('core.permissions.baseUsersSet'))}
                  >
                    {['none', 'casters', 'moderators', 'subscribers', 'vip', 'viewers'].map(item => <MenuItem key={item} value={item}>{translate(`core.permissions.${item}`)}</MenuItem>)}
                  </Select>
                </FormControl>}

              <TestUserField permissionId={selectedItem.id}/>

              {!selectedItem.isCorePermission
                && <FormGroup>
                  <FormControlLabel control={<Checkbox disabled={!scope.manage} checked={selectedItem.isWaterfallAllowed} onClick={() => handlePermissionChange({ isWaterfallAllowed: !selectedItem.isWaterfallAllowed })} />} label={capitalize(translate('core.permissions.allowHigherPermissions'))} />
                </FormGroup>}

              {!selectedItem.isCorePermission
                && <>
                  <Divider sx={{ m: 1.5 }}>
                    <FormLabel>{ translate('responses.variable.users') }</FormLabel>
                  </Divider>
                  <UserSearchlist disabled={!scope.manage} label={translate('core.permissions.manuallyAddedUsers')} users={selectedItem.userIds} onChange={(value) => {
                    handlePermissionChange({ userIds: value });
                  }}/>
                  <UserSearchlist disabled={!scope.manage} label={translate('core.permissions.manuallyExcludedUsers')} users={selectedItem.excludeUserIds} onChange={(value) => {
                    handlePermissionChange({ excludeUserIds: value });
                  }}/>
                </>}

              {!selectedItem.isCorePermission
                && <FilterMaker disabled={!scope.manage} model={selectedItem.filters} onChange={filters => handlePermissionChange({ filters: filters })}/>
              }

              {selectedItem.id !== defaultPermissions.CASTERS
              && <ScopesSelector
                modelSensitive={selectedItem.excludeSensitiveScopes ?? true}
                modelAll={selectedItem.haveAllScopes ?? false}
                model={selectedItem.scopes ?? []}
                onChange={values => {
                  handlePermissionChange({
                    scopes: values.scopes,
                    haveAllScopes: values.haveAllScopes,
                    excludeSensitiveScopes: values.excludeSensitiveScopes,
                  });
                }}/>}

              {scope.manage && <>
                <Divider sx={{ mt: 1.5 }}/>

                <Grid container sx={{ py: 1 }} justifyContent='space-between'>
                  <Grid item>
                    {!selectedItem.isCorePermission && <ConfirmButton loading={removing} variant="contained" color='error' sx={{ minWidth: '250px' }} handleOk={() => removeSelectedPermission()}>{ translate('delete') }</ConfirmButton>}
                  </Grid>
                  <Grid item>
                    <LoadingButton loading={saving} variant="contained" sx= {{ minWidth: '250px' }} onClick={() => saveSelectedPermission()}>{ translate('dialog.buttons.saveChanges.idle') }</LoadingButton>
                  </Grid>
                </Grid>
              </>}
            </Box>
          </Box>}

        </Grid>
      </Grid>
    </>
  );
};
export default PageSettingsPermissions;
