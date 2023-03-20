import { TextField, TextFieldProps } from '@mui/material';
import React, {
  ChangeEventHandler, KeyboardEventHandler, useCallback, useEffect, useState,
} from 'react';

export const FormNumericInput: React.FC<{
  min?: number,
  max?: number,
  value?: number,
  onChange?: (value: number) => void,
} & TextFieldProps> = ({
  value,
  onChange,
  min,
  max,
  ...props
}) => {
  const [propsValue, setPropsValue] = useState(value || 0);

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

    if (key === 'ArrowUp') {
      const newValue = propsValue + offset;
      setPropsValue(newValue);
    } else if (key === 'ArrowDown') {
      const newValue = propsValue - offset;
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
    const val = Number(event.target.value);
    if (isNaN(val)) {
      // if deleted set min value else ignore input
      if (event.target.value.length === 0) {
        setPropsValue(min ?? 0);
      }
    } else {
      setPropsValue(val);
    }
  }, []);

  useEffect(() => {
    if (onChange) {
      onChange(propsValue);
    }
  }, [ propsValue, onChange ]);

  return (
    <TextField
      {...props}
      value={value}
      onChange={onChangeHandler}
      inputProps={{ onKeyDown: keydownHandler }}
    />
  );
};