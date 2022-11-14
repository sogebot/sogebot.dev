import {
  Box,
  Tab,
  Tabs,
} from '@mui/material';
import { Permissions } from '@sogebot/backend/dest/database/entity/permissions';
import get from 'lodash/get';
import orderBy from 'lodash/orderBy';
import React from 'react';

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
  ignoredPermissionsCategory?: string,
  children: (opts: {
    permission: Permissions,
    isEditable: (key: string) => boolean,
    toggle: (key: string, handleChange: (key: string, pid: string) => void) => void,
    isToggable: boolean,
  }) => void,
  onValidityChange?: (valid: boolean) => void;
}> = ({
  settings,
  ignoredPermissionsCategory,
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
        .map(permission => <Tab key={permission.id} label={permission.name} />)}
    </Tabs>
  </Box>
  <Box>
    <>
      {
        orderBy(permissions, 'order', 'desc')
          .filter(permission => !getIgnoredPermissions(settings, ignoredPermissionsCategory ?? 'default').includes(permission.id))
          .map((permission, idx) => idx === tab && children({
            permission,
            isEditable: (key => get(settings.__permission_based__, `${key}[0][${permission.id}]`, null) === null),
            toggle:     ((key, handleChange) => toggle(key, permission.id, handleChange)),
            isToggable: permission.id !== '0efd7b1c-e460-4167-8e06-8aaf2c170311',
          }))
      }
    </>
  </Box></>;
};