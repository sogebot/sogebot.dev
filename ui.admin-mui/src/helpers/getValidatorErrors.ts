import { ValidationError } from 'class-validator';
import capitalize from 'lodash/capitalize';

export const getValidatorErrors = (err: string | Error | ValidationError[]) => {
  if (typeof err === 'string' || err instanceof Error) {
    return [];
  }

  const errors: string[] = [];
  for (const error of err) {
    if (!error.constraints) {
      continue;
    }
    for (const constraint of Object.values(error.constraints)) {
      errors.push(capitalize(`${constraint}`))
    }
  }
  return errors;
}