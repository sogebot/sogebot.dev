import {
  LockOpenTwoTone, LockTwoTone, PriorityHighTwoTone,
} from '@mui/icons-material';
import {
  Box,
  IconButton,
  InputAdornment,
  Tab,
  Tabs,
} from '@mui/material';
import { red } from '@mui/material/colors';
import { Permissions } from '@sogebot/backend/dest/database/entity/permissions';
import get from 'lodash/get';
import orderBy from 'lodash/orderBy';
import React, { ChangeEvent } from 'react';

import { usePermissions } from '~/src/hooks/usePermissions';

const getIgnoredPermissions = (settings: Record<string, any>, category: string) => {
  const ignored = [];
  const attributeKey = Object.keys(settings.__permission_based__[category])[0];
  for (const key of Object.keys(settings.__permission_based__[category][attributeKey][0])) {
    if (settings.__permission_based__[category][attributeKey][0][key] === '%%%%___ignored___%%%%') {
      ignored.push(key);
    }
  }
  return ignored;
};

export const PermissionTabs: React.FC<{
  settings: Record<string, any>
  errors: { propertyName: string, message: string }[],
  ignoredPermissionsCategory?: string,
  handleChangePermissionBased: (key: string, pid: string, value?: any) => void,
  getPermissionSettingsValue: (permId: string, values: {
    [x: string]: string | null;
  }) => string | null,
  children: (opts: {
    permission: Permissions,
    isEditable: (key: string) => boolean,
    toggle: (key: string, handleChange: (key: string, pid: string) => void) => void,
    isToggable: boolean,
    TextFieldProps: (key: string) => Record<string, any>
  }) => void,
}> = ({
  settings,
  errors,
  ignoredPermissionsCategory,
  handleChangePermissionBased,
  getPermissionSettingsValue,
  children,
}) => {
  const { permissions } = usePermissions();
  const [tab, setTab] = React.useState(0);

  const handleChangeTab = (event: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
  };

  const toggle = (key: string, permId: string, handleChange: (key: string, pid: string) => void) => {
    handleChange(key, permId);
  };

  return <><Box>
    <Tabs value={tab} onChange={handleChangeTab} centered>
      {orderBy(permissions, 'order', 'desc')
        .filter(permission => !getIgnoredPermissions(settings, ignoredPermissionsCategory ?? 'default').includes(permission.id))
        .map(permission => <Tab key={permission.id} label={<span style={{
          color:      errors.find(o => o.propertyName.includes(permission.id)) ? red[500] : 'inherit',
          transition: 'all 200ms',
        }}>
          {errors.find(o => o.propertyName.includes(permission.id)) && <PriorityHighTwoTone sx={{
            position: 'absolute',
            left:     0,
            top:      '10px',
          }}/>}
          <span style={{ paddingLeft: errors.find(o => o.propertyName.includes(permission.id)) ? '4px' : 'inherit' }}>
            {permission.name}
          </span>
        </span>} />)}
    </Tabs>
  </Box>
  <Box>
    <>
      {
        orderBy(permissions, 'order', 'desc')
          .filter(permission => !getIgnoredPermissions(settings, ignoredPermissionsCategory ?? 'default').includes(permission.id))
          .map((permission, idx) => idx === tab && children({
            permission,
            isEditable:     (key => get(settings.__permission_based__, `${key}[0][${permission.id}]`, null) === null),
            toggle:         ((key, handleChange) => toggle(key, permission.id, handleChange)),
            isToggable:     permission.id !== '0efd7b1c-e460-4167-8e06-8aaf2c170311',
            TextFieldProps: (key: string) => ({
              variant:    'filled',
              fullWidth:  true,
              value:      getPermissionSettingsValue(permission.id, get(settings.__permission_based__, `${key}[0]`)),
              disabled:   get(settings.__permission_based__, `${key}[0][${permission.id}]`, null) === null,
              error:      !!errors.find(o => o.propertyName === `__permission_based__.${key}|${permission.id}`),
              helperText: errors.find(o => o.propertyName === `__permission_based__.${key}|${permission.id}`)?.message,
              onChange:   (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => handleChangePermissionBased(key, permission.id, event.target.value),
              InputProps: {
                endAdornment: permission.id !== '0efd7b1c-e460-4167-8e06-8aaf2c170311' && <InputAdornment position="end">
                  <IconButton onClick={() => toggle(key, permission.id, handleChangePermissionBased)}>
                    {get(settings.__permission_based__, `${key}[0][${permission.id}]`, null) !== null
                      ? <LockOpenTwoTone/>
                      : <LockTwoTone/>}
                  </IconButton>
                </InputAdornment>,
              },
            }),
          }))
      }
    </>
  </Box></>;
};