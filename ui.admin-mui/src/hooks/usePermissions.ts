import { Permissions } from '@sogebot/backend/dest/database/entity/permissions';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { getSocket } from '../helpers/socket';
import { setPermissions } from '../store/pageSlice';

export const usePermissions = () => {
  const dispatch = useDispatch();
  const { permissions } = useSelector<any, { permissions: Required<Permissions>[] } >(state => state.page);

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