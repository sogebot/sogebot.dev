import { Stack, Typography } from '@mui/material';
import { ValidationError } from 'class-validator';
import { isEqual } from 'lodash';
import capitalize from 'lodash/capitalize';
import { useSnackbar } from 'notistack';
import React, {
  useCallback, useEffect, useMemo, useReducer, useState,
} from 'react';

import { useTranslation } from './useTranslation';

type Props = {
  translations?: Record<string, string>
  mustBeDirty?: boolean,
};

const regexps = { 'minLength': 'must be longer than or equal to (\\d+) characters' };

export const useValidator = (props: Props = { mustBeDirty: true }) => {
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
      console.log(err);
      return err;
    }
  }, []);

  const haveErrors = useMemo(() => {
    if (props.mustBeDirty) {
      const filteredErrors = errors.filter(o => dirty.includes(o.property));
      return filteredErrors.length > 0;
    } else {
      return errors.length > 0;
    }
  }, [ errors, dirty, props.mustBeDirty ]);

  useEffect(() => {
    if (props.mustBeDirty) {
      const filteredErrors = errors.filter(o => dirty.includes(o.property));
      if (!isEqual(filteredErrors, errors)) {
        setErrors(filteredErrors);
      }
    }
  }, [ errors, dirty, props.mustBeDirty ]);

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

        const property = props.translations && props.translations[error.property] ? props.translations[error.property] : translate('properties.' + error.property);
        const constraints = constraint.split('|');
        const translation = translate(`errors.${type[0].toLowerCase() + type.substring(1)}`);
        if (translation.startsWith('{')) {
          _errors[error.property].push(capitalize(`${constraint}`)
            .replace('$property', property)
            .replace('$constraint1', constraints[0]),
          );
        } else {
          if (type === 'minLength') {
            // we need to parse argument
            const match = new RegExp(regexps.minLength).exec(constraints[0]);
            constraints[0] = match ? match[1] : '0';
          }
          _errors[error.property].push(capitalize(translate(`errors.${type[0].toLowerCase() + type.substring(1)}`)
            .replace('$property', translate('properties.thisvalue'))
            .replace('$constraint1', constraints[0]),
          ));
        }
      }
    }
    return _errors;
  }, [ errors, translate, props.translations ]);

  const errorsList = useCallback((errorsArg: ValidationError[]) => {
    const _errors: string[] = [];
    for (const error of errorsArg) {
      if (!error.constraints) {
        continue;
      }
      for (let [type, constraint] of Object.entries(error.constraints)) {
        const translation = translate(`errors.${type[0].toLowerCase() + type.substring(1)}`).replace('$property', translate('properties.' + error.property));
        if (translation.startsWith('{')) {
          // no translation found
          _errors.push(capitalize(`${constraint}`));
        } else {
          if (type === 'minLength') {
            // we need to parse argument
            const match = new RegExp(regexps.minLength).exec(constraint);
            console.log({
              constraint, match,
            });
            constraint = match ? match[1] : 'n/a';
          }
          _errors.push(capitalize(translation).replace('$constraint1', constraint));
        }
      }
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
      const helperText = <Typography component='span'>{errorsPerAttribute[attribute][0]}</Typography>;
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

  const validate = useCallback((err: typeof errors) => {
    console.error('Errors during validation', { err });

    if (typeof err === 'string') {
      enqueueSnackbar((<Stack>
        <Typography variant="body2">{err}</Typography>
      </Stack>), { variant: 'error' });
    } else {
      console.debug({ err });
      console.log(err.map(o => o.property));
      setDirty(err.map(o => o.property));
      setErrors(err);
      enqueueSnackbar((<Stack>
        <Typography variant="body2">{translate('errors.errorDialogHeader')}</Typography>
        <ul>{errorsList(err).map((o, i) => <li key={i}>{o}</li>)}</ul>
      </Stack>), { variant: 'error' });
    }
  }, [errorsList, setDirty, enqueueSnackbar, translate]);

  return {
    propsError, reset, setErrors, errorsList, validate, haveErrors,
  };
};