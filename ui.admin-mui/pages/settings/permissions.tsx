import { Permissions } from '@entity/permissions';
import { AddTwoTone, ManageAccountsTwoTone } from '@mui/icons-material';
import {
  Alert,
  Backdrop,
  Box,
  Card,
  CardContent,
  CircularProgress,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material';
import { blueGrey, grey } from '@mui/material/colors';
import { cloneDeep, sortBy } from 'lodash';
import { useRouter } from 'next/router';
import {
  ReactElement, useCallback, useEffect, useState,
} from 'react';
import shortid from 'shortid';
import { v4 } from 'uuid';

import { defaultPermissions } from '~/../backend/src/helpers/permissions/defaultPermissions';
import { NextPageWithLayout } from '~/pages/_app';
import { Layout } from '~/src/components/Layout/main';
import { getSocket } from '~/src/helpers/socket';
import { useTranslation } from '~/src/hooks/useTranslation';

const PageSettingsPermissions: NextPageWithLayout = () => {
  const router = useRouter();
  const { translate } = useTranslation();

  const [ items, setItems ] = useState<Permissions[]>([]);
  const [ loading, setLoading ] = useState(true);

  useEffect(() => {
    refresh();
  }, [router]);

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

          if (!router.query.permissionId) {
            router.push(`/settings/permissions/4300ed23-dca0-4ed9-8014-f5f2f7af55a9`);
          }
          resolve();
        });
      }),
    ]);
    setLoading(false);
  }, [ router ]);

  const reorder = () => {
    setItems((permissions) => {
      const viewers = cloneDeep(permissions.find(o => o.id === defaultPermissions.VIEWERS));
      const sorted = sortBy(permissions.filter(o => o.id !== defaultPermissions.VIEWERS), 'order', 'asc');
      if (viewers) {
        viewers.order = items.length;
        sorted.push(viewers);
      }
      getSocket('/core/permissions').emit('permission::save', sorted, () => {});
      return [...sorted];
    });
  };

  const addNewPermissionGroup = useCallback(() => {
    const id = v4();
    const data = new Permissions({
      id,
      name:               shortid.generate(),
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
    reorder(); // include save
    return;
  }, [ items ]);

  return (
    <>
      <Backdrop open={loading} >
        <CircularProgress color="inherit"/>
      </Backdrop>

      <Box sx={{
        width: '100%', maxWidth: 400, bgcolor: grey[900], border: `1px solid ${grey[800]}`,
      }}>
        <Toolbar sx={{ backgroundColor: blueGrey[900] }}>
          <Typography
            variant="button"
            component="div"
            fontSize={'16px'}
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
        <List disablePadding dense>
          {
            items.map(permission => <ListItem disablePadding key={permission.id}>
              <ListItemButton selected={router.query.permissionId === permission.id} onClick={() => router.push(`/settings/permissions/${permission.id}`)}>
                <ListItemIcon sx={{ fontSize: '30px' }}>
                  { permission.isWaterfallAllowed ? '≥' : '=' }
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Stack direction='row' alignItems={'center'}>
                      <Typography  color={permission.isCorePermission ? 'white' : grey[400]} sx={{
                        fontWeight: permission.isCorePermission ? 'bold' : 'normal', flexGrow: 1,
                      }}>
                        {permission.name}
                      </Typography>
                      <Box sx={{ height: '24px' }}>
                        <Stack direction='row' alignItems={'center'} color={grey[400]} spacing={1}>
                          <ManageAccountsTwoTone/>
                          <Typography variant='button' fontSize={12}>
                            { translate('core.permissions.' + permission.automation) }
                          </Typography>
                        </Stack>
                      </Box>
                    </Stack>} />
              </ListItemButton>
            </ListItem>)
          }
          <ListItem disableGutters sx={{ padding: 0 }}>
            <Alert severity='info' sx={{ width: '100%' }}>
              { translate('core.permissions.higherPermissionHaveAccessToLowerPermissions') }
            </Alert>
          </ListItem>
        </List>
      </Box>
    </>
  );
};

PageSettingsPermissions.getLayout = function getLayout(page: ReactElement) {
  return (
    <Layout>
      {page}
    </Layout>
  );
};

export default PageSettingsPermissions;
