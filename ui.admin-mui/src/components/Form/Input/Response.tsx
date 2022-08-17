import {
  Button,
  FilledInput,
  FormControl,
  Grid,
  InputAdornment, InputLabel, MenuItem, Select, TextField,
} from '@mui/material';
import {
  ChangeEventHandler,
  useCallback,
  useEffect, useState,
} from 'react';

import { FormInputAdornmentCustomVariable } from '~/src/components/Form/Input/Adornment/CustomVariables';
import { usePermissions } from '~/src/hooks/usePermissions';
import { useTranslation } from '~/src/hooks/useTranslation';

export const FormResponse: React.FC<{
  value: any,
  idx: number,
  onChange?: (value: any) => void,
}> = ({
  value,
  idx,
  onChange,
}) => {
  const [propsValue, setPropsValue] = useState(value);
  const { translate } = useTranslation();
  const { permissions } = usePermissions();

  useEffect(() => {
    if (onChange) {
      onChange(propsValue);
    }
  }, [ propsValue, onChange ]);

  const onResponseChangeHandler: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement> = useCallback((event) => {
    setPropsValue((o: any) => {
      return { ...o, response: event.target.value };
    });
  }, []);

  const onResponseAddHandler = useCallback((val: string) => {
    setPropsValue((o: { response: string; }) => {
      return { ...o, response: o.response + val };
    });
  }, []);

  const onFilterChangeHandler: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement> = useCallback((event) => {
    setPropsValue((o: any) => {
      return { ...o, filter: event.target.value };
    });
  }, []);

  const onFilterAddHandler = useCallback((val: string) => {
    setPropsValue((o: { filter: string; }) => {
      return { ...o, filter: o.filter + val };
    });
  }, []);

  const onPermissionChangeHandler = useCallback((val: string | null) => {
    setPropsValue((o: any) => {
      return { ...o, permission: String(val).length === 0 ? null : val };
    });
  }, []);

  const onExecutionToggleHandler = useCallback(() => {
    setPropsValue((o: { stopIfExecuted: any; }) => {
      return { ...o, stopIfExecuted: !o.stopIfExecuted };
    });
  }, []);

  return (
    <>
      <TextField
        variant='filled'
        label={`${translate('response')}#${idx + 1}`}
        value={propsValue.response}
        onChange={onResponseChangeHandler}
        InputProps={{
          endAdornment: <>
            <InputAdornment position="end">
              <FormInputAdornmentCustomVariable onSelect={onResponseAddHandler}/>
            </InputAdornment>
          </>,
        }}
      />

      <Grid container spacing={1} mb={1}>
        <Grid item sm>
          <FormControl fullWidth variant="filled" >
            <InputLabel id="permission-select-label">{translate('filter')}</InputLabel>
            <FilledInput
              value={propsValue.filter}
              onChange={onFilterChangeHandler}
              endAdornment={<>
                <InputAdornment position="end">
                  <FormInputAdornmentCustomVariable onSelect={onFilterAddHandler}/>
                </InputAdornment>
              </>
              }
            />
          </FormControl>
        </Grid>
        <Grid item sm>
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
        </Grid>
        <Grid item>
          <Button sx={{ height: '100%' }} variant="contained" color={propsValue.stopIfExecuted ? 'error' : 'success'} onClick={onExecutionToggleHandler}>{ propsValue.stopIfExecuted ? translate('commons.stop-if-executed') : translate('commons.continue-if-executed') }</Button>
        </Grid>
      </Grid>
    </>
  );
};