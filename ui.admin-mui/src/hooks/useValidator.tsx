import { Stack, Typography } from '@mui/material';
import { ValidationError } from 'class-validator';
import { isEqual } from 'lodash';
import capitalize from 'lodash/capitalize';
import { useSnackbar } from 'notistack';
import {
  useCallback, useEffect, useMemo, useReducer, useState,
} from 'react';

import { useTranslation } from '~/src/hooks/useTranslation';

export const useValidator = () => {
  const { translate } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();

  const [ dirty, setDirty ] = useState<string[]>([]);
  const [ errors, setErrors ] = useReducer((_state: ValidationError[], err: string | ValidationError[] | Error | null) => {
    if (typeof err === 'string' || err instanceof Error || err === null) {
      if (err !== null) {
        console.error(err);
      }
      return [];
    } else {
      return err;
    }
  }, []);

  const haveErrors = useMemo(() => {
    const filteredErrors = errors.filter(o => dirty.includes(o.property));
    return filteredErrors.length > 0;
  }, [ errors, dirty ]);

  useEffect(() => {
    const filteredErrors = errors.filter(o => dirty.includes(o.property));
    if (!isEqual(filteredErrors, errors)) {
      setErrors(filteredErrors);
    }
  }, [ errors, dirty ]);

  const errorsPerAttribute = useMemo(() => {
    const _errors: { [field:string]: string[] } = {};
    for (const error of errors) {
      if (!error.constraints) {
        continue;
      }
      for (const [type, constraint] of Object.entries(error.constraints)) {
        if (!_errors[error.property]) {
          _errors[error.property] = [];
        }

        const translation = translate(`errors.${type[0].toLowerCase() + type.substring(1)}`).replace('$property', translate('properties.' + error.property));
        if (translation.startsWith('{')) {
          _errors[error.property].push(capitalize(`${constraint}`));
        } else {
          _errors[error.property].push(capitalize(translate(`errors.${type[0].toLowerCase() + type.substring(1)}`).replace('$property', translate('properties.thisvalue'))));
        }
      }
    }
    return _errors;
  }, [ errors, translate ]);

  const errorsList = useCallback((errorsArg: ValidationError[]) => {
    const _errors: string[] = [];
    for (const error of errorsArg) {
      if (!error.constraints) {
        continue;
      }
      for (const [type, constraint] of Object.entries(error.constraints)) {
        const translation = translate(`errors.${type[0].toLowerCase() + type.substring(1)}`).replace('$property', translate('properties.' + error.property));
        if (translation.startsWith('{')) {
          // no translation found
          _errors.push(capitalize(`${constraint}`));
        } else {
          _errors.push(capitalize(translation));
        }
      }
    }
    return _errors;
  }, [ translate ]);

  const reset = useCallback(() => {
    setDirty([]);
  }, [ ]);

  const propsError = useCallback((attribute: string) => {
    const onInput = () => {
      if (!dirty.includes(attribute)) {
        console.log('Dirtying', attribute);
        setDirty([...dirty, attribute]);
      }
    };

    if (errorsPerAttribute[attribute] && errorsPerAttribute[attribute].length > 0 && dirty.includes(attribute)) {
      const helperText = <Typography component='span'>{errorsPerAttribute[attribute][0]}</Typography>;
      return {
        className: 'prop-' + attribute,
        error:     true,
        helperText,
        onInput,
      };
    } else {
      return {
        className: 'prop-' + attribute,
        onInput,
      };
    }
  }, [ dirty, errorsPerAttribute ]);

  const validate = useCallback((err: typeof errors) => {
    console.error('Errors during validation', { err });
    setDirty(err.map(o => o.property));
    setErrors(err);
    enqueueSnackbar((<Stack>
      <Typography variant="body2">Unexpected errors during validation</Typography>
      <ul>{errorsList(err).map((o, i) => <li key={i}>{o}</li>)}</ul>
    </Stack>), { variant: 'error' });
  }, [errorsList, setDirty, enqueueSnackbar]);

  return {
    propsError, reset, setErrors, errorsList, validate, haveErrors,
  };
};