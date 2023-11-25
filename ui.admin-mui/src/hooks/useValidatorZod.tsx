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
      const filteredErrors = errors.filter(o => dirty.includes(o.path.join('.') as string));
      return filteredErrors.length > 0;
    } else {
      return errors.length > 0;
    }
  }, [ errors, dirty, props.mustBeDirty ]);

  useEffect(() => {
    if (props.mustBeDirty) {
      const filteredErrors = errors.filter(o => dirty.includes(o.path.join('.') as string));
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
        if (error.type === 'number') {
          translation = translate(`errors.min`)
            .replace('$property', translate('properties.thisvalue'))
            .replace('$constraint1', error.minimum.toString());
        } else {
          translation = translate(`errors.minLength`)
            .replace('$property', translate('properties.thisvalue'))
            .replace('$constraint1', error.minimum.toString());
        }
      } else if (error.code ==='custom') {
        translation = translate(`errors.` + error.message)
          .replace('$property', translate('properties.thisvalue'));
      } else if (error.code === 'invalid_union_discriminator') {
        translation = `${translate('properties.thisvalue')} must be one of these options: ${error.options.join(', ')}`;
      } else {
        console.error({ error });
        throw Error('Unknown error code: ' + error.code);
      }

      if (_errors[error.path.join('.')] === undefined) {
        _errors[error.path.join('.')] = [];
      }
      _errors[error.path.join('.')].push(capitalize(translation));
    }
    return _errors;
  }, [ errors, translate, props.translations ]);

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
  const validate = async (values: any, dirtifyValues?: boolean) => {
    if (dirtifyValues) {
      setDirty(v => [...v, ...Object.keys(values)]);
    }

    try {
      props.schema.parse(values);
      setErrors(null);
      return true;
    } catch (e) {
      if (e instanceof z.ZodError) {
        setErrors(e.errors);
      } else {
        setErrors(e as any);
      }
      return false;
    }
  };

  const showErrors = useCallback((err: z.ZodError | string) => {
    console.error(err);

    if (typeof err === 'string') {
      enqueueSnackbar((<Stack>
        <Typography variant="body2">{err}</Typography>
      </Stack>), { variant: 'error' });
    } else {
      setDirty(err.issues.map(o => o.path.join('.') as string));
      setErrors(err.issues);
      enqueueSnackbar((<Stack>
        <Typography variant="body2">{translate('errors.errorDialogHeader')}</Typography>
      </Stack>), { variant: 'error' });
    }
  }, [setDirty, enqueueSnackbar, translate]);

  const dirtify = (attribute: string) => {
    setDirty(val => {
      if (!val.includes(attribute)) {
        return [...val, attribute];
      } else {
        return val;
      }
    });
  };

  return {
    dirtify,
    propsError,
    reset,
    setErrors,
    validate,
    showErrors,
    haveErrors,
  };
};