import { Stack, Typography } from '@mui/material';
import { ValidationError } from 'class-validator';
import { isEqual } from 'lodash';
import capitalize from 'lodash/capitalize';
import { useSnackbar } from 'notistack';
import {
  createElement, useCallback, useEffect, useMemo, useReducer, useState,
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

  useEffect(() => {
    const filteredErrors = errors.filter(o => dirty.includes(o.property));
    if (!isEqual(filteredErrors, errors)) {
      setErrors(filteredErrors);
    }
  }, [ errors, dirty ])

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

        if (constraint.length === 0) {
          _errors[error.property].push(capitalize(translate(`errors.${type[0].toLowerCase() + type.substring(1)}`).replace('$property', error.property)));
        } else {
          _errors[error.property].push(capitalize(`${constraint}`));
        }
      }
    }
    return _errors;
  }, [ errors ]);

  const errorsList = useMemo(() => {
    const _errors: string[] = [];
    for (const error of errors) {
      if (!error.constraints) {
        continue;
      }
      for (const [type, constraint] of Object.entries(error.constraints)) {
        if (constraint.length === 0) {
          _errors.push(capitalize(translate(`errors.${type}`).replace('$property', error.property)));
        } else {
          _errors.push(capitalize(`${constraint}`));
        }
      }
    }
    return _errors;
  }, [ errors ])

  const reset = useCallback(() => {
    setDirty([]);
  }, [ ]);

  const propsError = useCallback((attribute: string) => {
    const onInput = () => {
      if (!dirty.includes(attribute)) {
        console.log('Dirtying', attribute)
        setDirty([...dirty, attribute])
      }
    };

    if (errorsPerAttribute[attribute] && errorsPerAttribute[attribute].length > 0 && dirty.includes(attribute)) {
      const helperText: React.ReactNode = createElement(Typography, undefined, errorsPerAttribute[attribute][0]);
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

  const validate = useCallback(() => {
    setDirty(errors.map(o => o.property));
    enqueueSnackbar((<Stack>
      <Typography variant="body2">Unexpected errors during validation</Typography>
      <ul>{errorsList.map((o, i) => <li key={i}>{o}</li>)}</ul>
    </Stack>), { variant: 'error' });
  }, [errors, errorsList, setDirty, enqueueSnackbar]);

  return {
    propsError, reset, setErrors, errorsList, validate,
  };
};