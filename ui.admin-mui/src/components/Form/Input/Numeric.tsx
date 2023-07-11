import { TextField, TextFieldProps } from '@mui/material';
import React, {
  ChangeEventHandler, KeyboardEventHandler, useCallback, useEffect, useState,
} from 'react';

export const FormNumericInput: React.FC<{
  min?: number,
  max?: number,
  value?: number | null,
  onChange?: (value: number | '') => void,
  displayEmpty?: boolean,
} & TextFieldProps> = ({
  value,
  onChange,
  min,
  max,
  displayEmpty,
  ...props
}) => {
  const [propsValue, setPropsValue] = useState<number | ''>(value || 0);

  const keydownHandler: KeyboardEventHandler<HTMLInputElement | HTMLTextAreaElement> = useCallback((event) => {
    const key = event.key;
    const shiftKey = event.shiftKey;
    const ctrlKey = event.ctrlKey;

    if (key === 'ArrowUp' || key === 'ArrowDown') {
      event.preventDefault(); // disable move up/down
    }

    let offset = 1;
    if (shiftKey && ctrlKey) {
      offset *= 1000;
    } else if (shiftKey) {
      offset *= 100;
    } else if (ctrlKey) {
      offset *= 10;
    }

    let newValue = 0;

    if (key === 'ArrowUp') {
      if (propsValue === '') {
        newValue = (min ?? 0) + offset;
      } else {
        newValue = propsValue + offset;
      }
      setPropsValue(newValue);
    } else if (key === 'ArrowDown') {
      if (propsValue === '') {
        newValue = (min ?? 0);
      } else {
        newValue = propsValue - offset;
      }
      if (typeof min === 'number' && newValue < min) {
        setPropsValue(min);
        return;
      }
      if (typeof max === 'number'  && newValue > max) {
        setPropsValue(max);
        return;
      }
      setPropsValue(newValue);
    }
  }, [ propsValue ]);

  const onChangeHandler: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement> = useCallback((event) => {
    if (event.target.value.length === 0 && displayEmpty) {
      setPropsValue(displayEmpty ? '' : (min ?? 0));
      return;
    }
    const val = Number(event.target.value);
    setPropsValue(val);
  }, []);

  useEffect(() => {
    if (onChange) {
      onChange(propsValue);
    }
  }, [ propsValue ]);

  return (
    <TextField
      {...props}
      value={value}
      onChange={onChangeHandler}
      inputProps={{ onKeyDown: keydownHandler }}
      InputLabelProps={{ shrink: displayEmpty ?? undefined }}
    />
  );
};