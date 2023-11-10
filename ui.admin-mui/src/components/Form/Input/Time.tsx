import { SxProps, TextField, TextFieldProps, Theme } from '@mui/material';
import React, { ChangeEventHandler, KeyboardEventHandler, useCallback, useEffect, useMemo, useState } from 'react';

import { DAY, HOUR, MINUTE, SECOND } from '../../../constants';

export const FormInputTime: React.FC<{
  label?:      string,
  disabled?:   boolean,
  fullWidth?:  boolean,
  helperText?: string,
  sx?:         SxProps<Theme>,
  variant?:    'filled' | 'outlined' | 'standard',
  value?: number, onChange?: (value: number) => void,
  InputProps?: TextFieldProps['InputProps']
}> = ({
  label, disabled, sx, variant, value, onChange, InputProps, fullWidth, helperText
}) => {
  const [propsValue, setPropsValue] = useState(value || 0);

  const outputValue = useMemo(() => {
    if (propsValue < 0) {
      return `0d 0h 0m 0s`;
    }
    const days = Math.floor(propsValue / DAY);
    const hours = Math.floor((propsValue - days * DAY) / HOUR);
    const minutes = Math.floor((propsValue - (days * DAY) - (hours * HOUR)) / MINUTE);
    const seconds = Math.floor((propsValue - (days * DAY) - (hours * HOUR) - (minutes * MINUTE)) / SECOND);
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  }, [ propsValue ]);

  const keydownHandler: KeyboardEventHandler<HTMLInputElement | HTMLTextAreaElement> = useCallback((event) => {
    const key = event.key;
    const shiftKey = event.shiftKey;
    const ctrlKey = event.ctrlKey;

    let offset = SECOND;
    if (shiftKey && ctrlKey) {
      offset = HOUR;
    } else if (shiftKey) {
      offset = MINUTE;
    } else if (ctrlKey) {
      offset = 15 * SECOND;
    }

    if (key === 'ArrowUp') {
      const newValue = propsValue + offset;
      setPropsValue(newValue);
    } else if (key === 'ArrowDown') {
      const newValue = propsValue - offset;
      if (newValue < 0) {
        setPropsValue(0);
      } else {
        setPropsValue(newValue);
      }
    }
  }, [ propsValue ]);

  const onChangeHandler: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement> = useCallback((event) => {
    const val = event.target.value;
    const regex = /((?<days>\d+)d)? ?((?<hours>\d+)h)? ?((?<minutes>\d+)m)? ?((?<seconds>\d+)s)?/g;
    const exec = regex.exec(val);
    if (exec?.groups) {
      let newTime = 0;
      for (const key of Object.keys(exec.groups)) {
        if (key === 'days') {
          newTime += Number(exec.groups[key] ?? 0) * DAY;
        } else if (key === 'hours') {
          newTime += Number(exec.groups[key] ?? 0) * HOUR;
        } else if (key === 'minutes') {
          newTime += Number(exec.groups[key] ?? 0) * MINUTE;
        } else if (key === 'seconds') {
          newTime += Number(exec.groups[key] ?? 0) * SECOND;
        }
      }
      setPropsValue(newTime);
    }
  }, []);

  useEffect(() => {
    if (onChange) {
      onChange(propsValue);
    }
  }, [ propsValue, onChange ]);

  return (
    <TextField
      sx={sx}
      fullWidth={fullWidth}
      helperText={helperText}
      disabled={disabled}
      variant={variant}
      label={label}
      hiddenLabel={!label || label.length === 0}
      value={outputValue}
      onChange={onChangeHandler}
      inputProps={{ onKeyDown: keydownHandler }}
      InputProps={InputProps}
    />
  );
};