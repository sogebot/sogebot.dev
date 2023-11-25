import { AddTwoTone, RemoveTwoTone } from '@mui/icons-material';
import { Box, Button, ButtonGroup, TextField, TextFieldProps } from '@mui/material';
import React, { ChangeEventHandler, KeyboardEventHandler, useCallback, useEffect, useState } from 'react';

export const FormNumericInput: React.FC<{
  min?:          number,
  max?:          number,
  value?:        number | null,
  onChange?:     (value: number | '') => void,
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

    if (event.target.value.length === 0) {
      setPropsValue(min ?? 0);
      return;
    }
    let val = Number(event.target.value);
    val = isNaN(val) ? 0 : val;
    setPropsValue(val);
  }, []);

  useEffect(() => {
    props.onInput && props.onInput({} as any);
    if (onChange) {
      onChange(propsValue);
    }
  }, [ propsValue ]);

  return (
    <TextField
      {...props}
      value={value}
      sx={{
        '& .MuiFilledInput-input': { p: props.label ? undefined : '10px !important' },
        '&:hover .MuiBox-root':    { opacity: 1 },
      }}
      onChange={onChangeHandler}
      inputProps={{ onKeyDown: keydownHandler }}
      InputLabelProps={{ shrink: displayEmpty ?? undefined }}
      InputProps={{
        ...props.InputProps,
        inputMode:    'numeric',
        endAdornment: <>
          <Box
            sx={{
              display:    'flex',
              '& > *':    { m: 1 },
              opacity:    0,
              transition: 'all 100ms',
            }}
          >
            <ButtonGroup
              orientation="vertical"
              aria-label="vertical outlined button group"
              color='light'
            >
              <Button size='small' onClick={() => {
                const newValue = (value ?? 0) + 1;
                if (typeof min === 'number' && newValue < min) {
                  setPropsValue(min);
                  return;
                }
                if (typeof max === 'number'  && newValue > max) {
                  setPropsValue(max);
                  return;
                }
                setPropsValue(newValue);
              }}
              sx={{
                padding:  0,
                minWidth: '10px !important',
                '& svg':  {
                  width: '0.7em', height: '0.7em',
                },
              }}><AddTwoTone /></Button>
              <Button size='small' onClick={() => {
                const newValue = (value ?? 0) - 1;
                if (typeof min === 'number' && newValue < min) {
                  setPropsValue(min);
                  return;
                }
                if (typeof max === 'number'  && newValue > max) {
                  setPropsValue(max);
                  return;
                }
                setPropsValue(newValue);
              }} sx={{
                padding:  0,
                minWidth: '10px !important',
                '& svg':  {
                  width: '0.7em', height: '0.7em',
                },
              }}><RemoveTwoTone /></Button>
            </ButtonGroup>
          </Box>
          {props.InputProps?.endAdornment}
        </>,
      }}
    />
  );
};