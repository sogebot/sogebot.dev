import { capitalize, Stack, Typography } from '@mui/material';
import { isEqual } from 'lodash';
import { useSnackbar } from 'notistack';
import React, { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { z } from 'zod';

import { useTranslation } from './useTranslation';

type Props = {
  translations?: Record<string, string>;
  /** Values needs to be changed to trigger errors  */
  mustBeDirty?:  boolean;
  localize?:     (key: string) => string;
  schema:        z.AnyZodObject;
};

export const useValidator = (props: Props) => {
  if (props.mustBeDirty === undefined) {
    props.mustBeDirty = true;
  }

  const { translate } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();

  const [ dirty, setDirty ] = useState<string[]>([]);
  const [ errors, setErrors ] = useReducer((_state: z.ZodIssue[], err: string | z.ZodIssue[] | Error | null) => {
    if (typeof err === 'string' || (err instanceof Error) || err === null) {
      if (err !== null) {
        console.error(err);
      }
      return [];
    } else {
      return err;
    }
  }, []);

  const haveErrors = useMemo(() => {
    if (props.mustBeDirty) {
      const filteredErrors = errors.filter(o => dirty.includes(o.path[o.path.length - 1] as string));
      return filteredErrors.length > 0;
    } else {
      return errors.length > 0;
    }
  }, [ errors, dirty, props.mustBeDirty ]);

  useEffect(() => {
    if (props.mustBeDirty) {
      const filteredErrors = errors.filter(o => dirty.includes(o.path[o.path.length - 1] as string));
      if (!isEqual(filteredErrors, errors)) {
        setErrors(filteredErrors);
      }
    }
  }, [ errors, dirty, props.mustBeDirty ]);

  const errorsPerAttribute = useMemo(() => {
    const _errors: { [field:string]: string[] } = {};
    for (const error of errors) {
      let translation = '';
      if (error.code === 'too_small') {
        translation = translate(`errors.minLength`)
          .replace('$property', translate('properties.thisvalue'))
          .replace('$constraint1', error.minimum.toString());
      } else if (error.code ==='custom') {
        translation = translate(`errors.` + error.message)
          .replace('$property', translate('properties.thisvalue'));
      } else {
        throw Error('Unknown error code: ' + error.code);
      }

      if (_errors[error.path[error.path.length - 1] as string] === undefined) {
        _errors[error.path[error.path.length - 1] as string] = [];
      }
      _errors[error.path[error.path.length - 1] as string].push(capitalize(translation));
    }
    return _errors;
  }, [ errors, translate, props.translations ]);

  const errorsList = useCallback((errorsArg: z.ZodIssue[]) => {
    const _errors: string[] = [];
    for (const error of errorsArg) {
      let translation = '';
      let property = error.path[error.path.length - 1] as string;
      if (property === 'rewardId') {
        property = capitalize(translate('event'));
      } else {
        if (props.localize) {
          property = capitalize(props.localize(property));
        }
      }
      property += ' - ';

      if (error.code === 'too_small') {
        translation = translate(`errors.minLength`)
          .replace('$property', property)
          .replace('$constraint1', error.minimum.toString());
      } else if (error.code ==='custom') {
        translation = translate(`errors.` + error.message)
          .replace('$property', property);
      } else {
        throw Error('Unknown error code: ' + error.code);
      }
      _errors.push(capitalize(translation));
    }
    return _errors;
  }, [ translate ]);

  const reset = useCallback(() => {
    setDirty([]);
  }, [ ]);

  const propsError = useCallback((attribute: string, opts: { helperText?: string } = {}) => {
    const onInput = () => {
      if (!dirty.includes(attribute)) {
        console.log('Dirtying', attribute);
        setDirty([...dirty, attribute]);
      }
    };

    if (errorsPerAttribute[attribute] && errorsPerAttribute[attribute].length > 0 && (!props.mustBeDirty || dirty.includes(attribute))) {
      const helperText = errorsPerAttribute[attribute][0];
      return {
        className: 'prop-' + attribute,
        error:     true,
        helperText,
        onInput,
      };
    } else {
      return {
        className:  'prop-' + attribute,
        helperText: opts.helperText,
        onInput,
      };
    }
  }, [ dirty, errorsPerAttribute, props.mustBeDirty ]);

  // TODO: fix typings
  /**
   * Validate values defined by zod schema
   */
  const validate = useCallback(async (values: any, dirtifyValues?: boolean) => {
    if (dirtifyValues) {
      setDirty(v => [...v, ...Object.keys(values)]);
    }

    try {
      props.schema.parse(values);
      setErrors(null);
      return true;
    } catch (e) {
      console.error('Errors during validation', e);
      if (e instanceof z.ZodError) {
        setErrors(e.errors);
      } else {
        setErrors(e as any);
      }
      return false;
    }
  }, [setErrors]);

  const showErrors = useCallback((err: z.ZodError | string) => {
    console.error('Errors during validation', { err });

    if (typeof err === 'string') {
      enqueueSnackbar((<Stack>
        <Typography variant="body2">{err}</Typography>
      </Stack>), { variant: 'error' });
    } else {
      setDirty(err.issues.map(o => o.path[o.path.length - 1] as string));
      setErrors(err.issues);
      enqueueSnackbar((<Stack>
        <Typography variant="body2">{translate('errors.errorDialogHeader')}</Typography>
        <ul>{errorsList(err.issues).map((o, i) => <li key={i}>{o}</li>)}</ul>
      </Stack>), { variant: 'error' });
    }
  }, [errorsList, setDirty, enqueueSnackbar, translate]);

  return {
    propsError, reset, setErrors, errorsList, validate, showErrors, haveErrors,
  };
};