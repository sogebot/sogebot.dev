import at from 'lodash/at';
import isNil from 'lodash/isNil';
import React from 'react';

import { useAppDispatch, useAppSelector } from './useAppDispatch';
import { getSocket } from '../helpers/socket';
import { selectStateState, selectTranslationState, setTranslation } from '../store/loaderSlice';

function castObject (key: string, value: string | { [x: string]: any }) {
  if (typeof value === 'string') {
    return { [key]: value };
  } else {
    return value;
  }
}

export const useTranslation = () => {
  const dispatch = useAppDispatch();

  const translation = useAppSelector(selectTranslationState);
  const state = useAppSelector(selectStateState);

  const refresh = React.useCallback(() => {
    getSocket('/', true).emit('translations', (translations) => {
      dispatch(setTranslation(translations));
    });
  }, [dispatch]);

  React.useEffect(() => {
    if (state && Object.keys(translation).length === 0) {
      refresh();
    }
  }, [ refresh, state, translation ]);

  const translate = React.useCallback((key: string) => {
    return isNil(at(translation, key)[0])
      ? `{${key}}`
      : at(translation, key)[0] as string;
  }, [ translation ]);

  const translateAsObject = React.useCallback((key: string) => {
    return isNil(at(translation, key)[0])
      ? {}
      : castObject(key, at(translation, key)[0] as { [x: string]: any });
  }, [ translation ]);

  return {
    translate, translateAsObject,
  };
};