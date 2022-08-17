import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { PermissionsInterface } from '~/../backend/src/database/entity/permissions';

import { getSocket } from '~/src/helpers/socket';
import { setPermissions } from '~/src/store/pageSlice';

export const usePermissions = () => {
  const dispatch = useDispatch();
  const { permissions } = useSelector<any, { permissions: Required<PermissionsInterface>[] } >(state => state.page);

  const refresh = React.useCallback(() => {
    if (permissions.length === 0) {
      getSocket('/core/permissions').emit('generic::getAll', (err, res) => {
        if (err) {
          return console.error(err);
        }
        dispatch(setPermissions(res));
      });
    }
  }, [ dispatch, permissions ]);

  React.useEffect(() => {
    if (permissions.length === 0) {
      refresh();
    }
  }, [ refresh, permissions ]);

  return { permissions };
};