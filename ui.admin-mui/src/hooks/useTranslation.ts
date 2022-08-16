import at from 'lodash/at';
import isNil from 'lodash/isNil';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { getSocket } from '~/src/helpers/socket';
import { setTranslation } from '~/src/store/loaderSlice';

function castObject (key: string, value: string | { [x: string]: any }) {
  if (typeof value === 'string') {
    return { [key]: value };
  } else {
    return value;
  }
}

export const useTranslation = () => {
  const dispatch = useDispatch();
  const { translation, state } = useSelector<any, { translation: Record<string, any>, state: boolean } >(s => s.loader);

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

  return { translate, translateAsObject };
};