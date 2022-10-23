import { Permissions } from '@entity/permissions';
import {
  DragDropContext, Draggable, Droppable,
} from '@hello-pangea/dnd';
import { AddTwoTone } from '@mui/icons-material';
import {
  Alert,
  Backdrop,
  Box,
  CircularProgress,
  IconButton,
  List,
  ListItem,
  Toolbar,
  Typography,
} from '@mui/material';
import { blueGrey, grey } from '@mui/material/colors';
import {
  cloneDeep, orderBy, sortBy,
} from 'lodash';
import { useRouter } from 'next/router';
import { useSnackbar } from 'notistack';
import {
  ReactElement, useCallback, useEffect, useMemo, useState,
} from 'react';
import shortid from 'shortid';
import { v4 } from 'uuid';
import { defaultPermissions } from '~/../backend/src/helpers/permissions/defaultPermissions';

import { NextPageWithLayout } from '~/pages/_app';
import { Layout } from '~/src/components/Layout/main';
import { PermissionsListItem } from '~/src/components/Permissions/ListItem';
import { getSocket } from '~/src/helpers/socket';
import { useTranslation } from '~/src/hooks/useTranslation';
import { StripTypeORMEntity } from '~/src/types/stripTypeORMEntity';

const PageSettingsPermissions: NextPageWithLayout = () => {
  const router = useRouter();
  const { translate } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();

  const [ items, setItems ] = useState<StripTypeORMEntity<Permissions>[]>([]);
  const [ loading, setLoading ] = useState(true);

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

  useEffect(() => {
    refresh();
  }, [router, refresh ]);

  const reorder = useCallback(() => {
    setItems((permissions) => {
      const viewers = cloneDeep(permissions.find(o => o.id === defaultPermissions.VIEWERS));
      const sorted = sortBy(permissions.filter(o => o.id !== defaultPermissions.VIEWERS), 'order', 'asc');
      if (viewers) {
        viewers.order = items.length;
        sorted.push(viewers);
      }
      getSocket('/core/permissions').emit('permission::save', sorted as Permissions[], () => {
        enqueueSnackbar('Permissions updated.', { variant: 'success' });
        return;
      });
      return [...sorted];
    });
  }, [items, enqueueSnackbar]);

  const onDragEndHandler = useCallback((value: any) => {
    if (!value.destination) {
      return;
    }
    const destIdx = value.destination.index;
    const PID = value.draggableId;

    setItems(o => {
      const output: StripTypeORMEntity<Permissions>[] = [];

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
  }, [ items, reorder ]);

  const orderedPermissions = useMemo(() => {
    return orderBy(items, 'order', 'asc').filter(o =>
      o.id !== '4300ed23-dca0-4ed9-8014-f5f2f7af55a9' // exclude casters
      && o.id !== '0efd7b1c-e460-4167-8e06-8aaf2c170311' // exclude viewers
    );
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

        {items.length > 0 && <List disablePadding dense>
          <PermissionsListItem permission={items.find(o => o.id === '4300ed23-dca0-4ed9-8014-f5f2f7af55a9')!}/>
        </List>}

        <DragDropContext onDragEnd={onDragEndHandler}>
          <Droppable droppableId="droppable">
            {(droppableProvided) => (<>
              <List disablePadding dense
                ref={droppableProvided.innerRef}
              >
                {orderedPermissions.map((permission) => (
                  <Draggable key={permission.id} draggableId={permission.id} index={permission.order} isDragDisabled={permission.id === '4300ed23-dca0-4ed9-8014-f5f2f7af55a9'}>
                    {(draggableProvided) => (
                      <PermissionsListItem permission={permission} draggableProvided={draggableProvided}/>
                    )}
                  </Draggable>
                ))}
              </List>
              {droppableProvided.placeholder}
            </>
            )}
          </Droppable>
        </DragDropContext>

        {items.length > 0 && <List disablePadding dense>
          <PermissionsListItem permission={items.find(o => o.id === '0efd7b1c-e460-4167-8e06-8aaf2c170311')!}/>
        </List>}

        <ListItem disableGutters sx={{ padding: 0 }}>
          <Alert severity='info' sx={{ width: '100%' }}>
            { translate('core.permissions.higherPermissionHaveAccessToLowerPermissions') }
          </Alert>
        </ListItem>
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
