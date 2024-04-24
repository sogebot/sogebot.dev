import axios from 'axios';
import { useAtom } from 'jotai';
import React from 'react';

import { useAppDispatch, useAppSelector } from './useAppDispatch';
import { scopesAtom } from '../atoms';
import getAccessToken from '../getAccessToken';
import { setPermissions } from '../store/pageSlice';

export const usePermissions = () => {
  const dispatch = useAppDispatch();
  const { permissions } = useAppSelector(state => state.page);
  const [ scopes, setScopes ] = useAtom(scopesAtom);

  const refresh = React.useCallback(() => {
    return Promise.all([
      new Promise<void>(resolve => {
        axios.get(`/api/core/permissions`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
          .then(({ data }) => {
            if (data.status === 'success') {
              console.log('permissions', data.data);
              dispatch(setPermissions(data.data));
              resolve();
            }
          });
      }),
      new Promise<void>(resolve => {
        axios.get(`/api/core/permissions/availableScopes`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
          .then(({ data }) => {
            if (data.status === 'success') {
              console.log('scopes', data.data);
              setScopes(data.data);
              resolve();
            }
          });
      })
    ]);
  }, [ dispatch, permissions, scopes ]);

  React.useEffect(() => {
    if (permissions.length === 0) {
      refresh();
    }
  }, [ refresh, permissions ]);

  return { permissions, refresh, scopes };
};