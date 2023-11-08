import {
  Button,
  FilledInput,
  FormControl,
  Grid,
  InputAdornment, InputLabel, MenuItem, Select, TextField,
} from '@mui/material';
import React, {
  ChangeEventHandler,
  useCallback,
  useEffect, useState,
} from 'react';

import { FormInputAdornmentCustomVariable } from './Adornment/CustomVariables';
import { usePermissions } from '../../../hooks/usePermissions';
import { useTranslation } from '../../../hooks/useTranslation';

export const AdditionalGridFormResponse: React.FC<{
  disablePermission?: boolean,
  disableFilter?: boolean,
  disableExecution?: boolean,
  value: any,
  onChange?: (value: any) => void,
}> = ({ disableExecution, disableFilter, disablePermission, value, onChange }) => {
  const { translate } = useTranslation();
  const { permissions } = usePermissions();
  const [ propsValue, setPropsValue ] = React.useState(value);

  React.useEffect(() => {
    if (onChange) {
      onChange(propsValue);
    }
  }, [ propsValue ]);

  const onFilterChangeHandler: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement> = useCallback((event) => {
    setPropsValue((o: any) => {
      return {
        ...o, filter: event.target.value,
      };
    });
  }, []);

  const onFilterAddHandler = useCallback((val: string) => {
    setPropsValue((o: { filter: string; }) => {
      return {
        ...o, filter: o.filter + val,
      };
    });
  }, []);

  const onPermissionChangeHandler = useCallback((val: string | null) => {
    setPropsValue((o: any) => {
      return {
        ...o, permission: String(val).length === 0 ? null : val,
      };
    });
  }, []);

  const onExecutionToggleHandler = useCallback(() => {
    setPropsValue((o: { stopIfExecuted: any; }) => {
      return {
        ...o, stopIfExecuted: !o.stopIfExecuted,
      };
    });
  }, []);

  if ((disableFilter && disablePermission && disableExecution)) {
    return <></>;
  }

  return <Grid container spacing={1} mb={1}>
    {!disableFilter && <Grid item sm>
      <FormControl fullWidth variant="filled" >
        <InputLabel id="permission-select-label">{translate('filter')}</InputLabel>
        <FilledInput
          value={propsValue.filter}
          onChange={onFilterChangeHandler}
          endAdornment={<InputAdornment position="end">
            <FormInputAdornmentCustomVariable onSelect={onFilterAddHandler}/>
          </InputAdornment>}
        />
      </FormControl>
    </Grid>}
    {!disablePermission && <Grid item sm>
      <FormControl fullWidth variant="filled" >
        <InputLabel id="permission-select-label" shrink>{translate('permissions')}</InputLabel>
        <Select
          label={translate('permissions')}
          labelId="permission-select-label"
          displayEmpty
          onChange={(event) => onPermissionChangeHandler(event.target.value)}
          value={propsValue.permission}
          renderValue={(selected) => {
            if (selected === null) {
              return <em>-- unset --</em>;
            }

            return permissions?.find(o => o.id === selected)?.name;
          }}
        >
          <MenuItem value="">
            <em>-- unset --</em>
          </MenuItem>
          {permissions?.map(o => (<MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>))}
        </Select>
      </FormControl>
    </Grid>}
    {!disableExecution && <Grid item sx={{ my: 0.5 }}>
      <Button sx={{ height: '100%' }} variant="contained" color={propsValue.stopIfExecuted ? 'error' : 'success'} onClick={onExecutionToggleHandler}>{ propsValue.stopIfExecuted ? translate('commons.stop-if-executed') : translate('commons.continue-if-executed') }</Button>
    </Grid>}
  </Grid>;
};

export const FormResponse: React.FC<{
  value: any,
  idx: number,
  onChange?: (value: any) => void,
  disablePermission?: boolean,
  disableFilter?: boolean,
  disableExecution?: boolean,
}> = ({
  value,
  idx,
  onChange,
  disablePermission,
  disableFilter,
  disableExecution,
}) => {
  const [propsValue, setPropsValue] = useState(value);
  const { translate } = useTranslation();

  useEffect(() => {
    if (onChange) {
      onChange(propsValue);
    }
  }, [ propsValue ]);

  const onResponseChangeHandler: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement> = useCallback((event) => {
    setPropsValue((o: any) => {
      return {
        ...o, response: event.target.value,
      };
    });
  }, []);

  const onResponseAddHandler = useCallback((val: string) => {
    setPropsValue((o: { response: string; }) => {
      return {
        ...o, response: o.response + val,
      };
    });
  }, []);

  return (
    <>
      <TextField
        fullWidth
        variant='filled'
        label={`${translate('response')}#${idx + 1}`}
        value={propsValue.response}
        multiline
        onKeyPress={(e) => {
          e.key === 'Enter' && e.preventDefault();
        }}
        onChange={onResponseChangeHandler}
        InputProps={{
          endAdornment: <>
            <InputAdornment position="end">
              <FormInputAdornmentCustomVariable onSelect={onResponseAddHandler}/>
            </InputAdornment>
          </>,
        }}
      />

      <AdditionalGridFormResponse disableExecution={disableExecution} disableFilter={disableFilter} disablePermission={disablePermission} value={propsValue} onChange={setPropsValue}/>
    </>
  );
};