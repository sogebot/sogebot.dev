import at from 'lodash/at';
import isNil from 'lodash/isNil';
import React from 'react';

import { useAppSelector } from './useAppDispatch';
import { selectTranslationState } from '../store/loaderSlice';

function castObject (key: string, value: string | { [x: string]: any }) {
  if (typeof value === 'string') {
    return { [key]: value };
  } else {
    return value;
  }
}

export const useTranslation = () => {
  const translation = useAppSelector(selectTranslationState);

  const translate = React.useCallback((key: string) => {
    return isNil(at(translation, `ui.${key}`)[0] || at(translation, `webpanel.${key}`)[0])
      ? `{${key}}`
      : at(translation, `ui.${key}`)[0] || at(translation, `webpanel.${key}`)[0] as string;
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