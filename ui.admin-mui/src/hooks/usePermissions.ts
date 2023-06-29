import React from 'react';

import { useAppDispatch, useAppSelector } from './useAppDispatch';
import { getSocket } from '../helpers/socket';
import { setPermissions } from '../store/pageSlice';

export const usePermissions = () => {
  const dispatch = useAppDispatch();
  const { permissions } = useAppSelector(state => state.page);

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