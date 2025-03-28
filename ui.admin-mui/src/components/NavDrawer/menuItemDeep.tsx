import { ChevronRight } from '@mui/icons-material';
import { ListItem, ListItemIcon, Menu, MenuItem, Stack, Typography } from '@mui/material';
import MuiListItemButton from '@mui/material/ListItemButton';
import axios from 'axios';
import capitalize from 'lodash/capitalize';
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import getAccessToken from '../../getAccessToken';
import { useAppSelector } from '../../hooks/useAppDispatch';
import useMobile from '../../hooks/useMobile';
import { useScope } from '../../hooks/useScope';
import { useTranslation } from '../../hooks/useTranslation';
import theme from '../../theme';

interface LinkedListItemProps {
  icon:     any;
  title:    string;
  category: 'commands' | 'manage' | 'settings' | 'registry' | 'stats';
}
export const MenuItemDeep: React.FC<LinkedListItemProps> = (props) => {
  const servicesScope = useScope('services');
  const integrationsScope = useScope('integrations');
  const gamesScope = useScope('games');
  const dashboardScope = useScope('dashboard');
  const systemsScope = useScope('systems');
  const coreScope = useScope('core');

  const location = useLocation();
  const { translate } = useTranslation();
  const reducer = useAppSelector(state => state.loader);
  const [ menuItems, setMenuItems ] = useState<any[]>([]);
  const [ isActive, setIsActive ] = useState<boolean>(true);
  const { state, connectedToServer } = useAppSelector(s => s.loader);
  const isMobile = useMobile();

  const settingsScopes = useMemo(() => {
    const scopes = ['core', 'services', 'systems', 'integrations', 'games', 'import'];

    if (!servicesScope.manage) {
      scopes.splice(scopes.indexOf('services'), 1);
    }
    if (!integrationsScope.manage) {
      scopes.splice(scopes.indexOf('integrations'), 1);
    }
    if (!gamesScope.manage) {
      scopes.splice(scopes.indexOf('games'), 1);
    }
    if (!dashboardScope.manage) {
      scopes.splice(scopes.indexOf('core'), 1);
    }
    if (!systemsScope.manage) {
      scopes.splice(scopes.indexOf('systems'), 1);
    }
    if (!coreScope.manage) {
      scopes.splice(scopes.indexOf('core'), 1);
    }

    return scopes;
  }, [ servicesScope, integrationsScope, gamesScope, dashboardScope, systemsScope, coreScope ]);

  useEffect(() => {
    if (!state || !connectedToServer) {
      return;
    }
    axios.get(`/api/ui/menu`, { headers: { authorization: `Bearer ${getAccessToken()}` } }).then(({ data }) => {
      const items = data.data as any[];
      setMenuItems(items
        // get only items that are in the category
        .filter(o => o.category === props.category)
        // filter settings modules, return only if there are at least 1 settingsScopes
        .filter((o) => {
          if (props.category === 'settings' && o.category === 'settings' && o.name === 'modules') {
            return settingsScopes.length > 0;
          }
          return true;
        })
        // sort items by name
        .sort((a: { name: string; }, b: { name: string; }) => {
          return translate('menu.' + a.name).localeCompare(translate('menu.' + b.name));
        }));
    });
  }, [state, connectedToServer, props, translate, settingsScopes]);

  useEffect(() => {
    setIsActive(!!menuItems.find((item: any) => location.pathname.includes(item.id)));
  }, [menuItems, location.pathname]);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<any>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const [anchorElModules, setAnchorElModules] = useState<null | HTMLElement>(null);
  const openModules = Boolean(anchorElModules);

  const handleClickModules = (event: React.MouseEvent<any>) => {
    setAnchorElModules(event.currentTarget);
  };
  const handleCloseModules = () => {
    setAnchorElModules(null);
  };

  const isItemActive = (item: { id: string; enabled: boolean; }) => {
    return location.pathname.includes(item.id);
  };

  const getColorOfItem = (item: { id: string; enabled: boolean; }) => {
    if (isItemActive(item)) {
      return theme.palette.primary.main;
    }
    return item.enabled ? 'inherit' : '#9e9e9e';
  };

  return (
    menuItems.length > 0 ? <ListItem disablePadding>
      <MuiListItemButton
        selected={isActive || !!anchorEl}
        sx={{
          justifyContent: 'center', height: reducer.drawerWidth,
        }}
        key={props.title}
        onClick={handleClick}>
        <Stack alignContent={'center'}  sx={{ color: isActive || !!anchorEl ? theme.palette.primary.main : 'inherit' }}>
          <ListItemIcon sx={{
            placeContent: 'center', color: isActive || !!anchorEl ? `${theme.palette.primary.main} !important` : 'inherit',
          }}>
            {props.icon}
            {!isMobile && <ChevronRight sx={{
              position: 'absolute',
              right:    '7px',
              top:      '17px',
              fontSize: '12px',
            }}/>}
          </ListItemIcon>
          <Typography variant="caption" sx={{
            textAlign: 'center', fontSize: '0.7rem',
          }}>
            {props.title}
          </Typography>
        </Stack>
      </MuiListItemButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: isMobile ? {
            width: '100%', left: 0,
          } : undefined,
        }}
        anchorOrigin={{
          vertical:   'top',
          horizontal: isMobile ? 'center' : 'right',
        }}
        transformOrigin={{
          vertical:   isMobile ? 'bottom' : 'top',
          horizontal: isMobile ? 'center' : 'left',
        }}
      >
        {menuItems.map(item => {
          if (item.name === 'modules') {

            return settingsScopes.length > 0 ? (
              <MenuItem selected={isItemActive(item) || !!anchorElModules} sx={{
                fontSize: '14px', color: getColorOfItem(item),
              }} key={item.id} onClick={handleClickModules}>
                {translate(`menu.${item.name}`)}
                {!isMobile && <ChevronRight sx={{
                  position: 'absolute',
                  right:    '7px',
                  top:      '6px',
                  fontSize: '20px',
                }}/>}
              </MenuItem>
            ) : <> </>;
          }
          return (
            <Link to={`/${item.id}?server=${JSON.parse(localStorage.server)}`}  key={item.id} style={{
              textDecoration: 'none', color: 'white',
            }}>
              <MenuItem selected={isItemActive(item)} sx={{
                fontSize: '14px', color: getColorOfItem(item),
              }} onClick={() => {
                handleClose();
              }}>{translate(`menu.${item.name}`)}</MenuItem>
            </Link>
          );
        })}
      </Menu>
      <Menu
        anchorEl={anchorElModules}
        open={openModules}
        onClose={handleCloseModules}
        sx={{ transform: 'translateY(-8px)' }}
        PaperProps={{
          sx: isMobile ? {
            width: '100%', left: 0,
          } : undefined,
        }}
        anchorOrigin={{
          vertical:   'top',
          horizontal: isMobile ? 'center' : 'right',
        }}
        transformOrigin={{
          vertical:   isMobile ? 'bottom' : 'top',
          horizontal: isMobile ? 'center' : 'left',
        }}
      >
        {settingsScopes.map(item => <Link to={`/settings/modules/${item}?server=${JSON.parse(localStorage.server)}`} key={item} style={{
          textDecoration: 'none', color: 'white',
        }}>
          <MenuItem sx={{ fontSize: '14px' }}
            onClick={() => {
              handleClose(); handleCloseModules();
            }}
            selected={isItemActive({
              id: item, enabled: true,
            })}>{translate('menu.' + item).startsWith('{') ? capitalize(item) : translate('menu.' + item)}</MenuItem>
        </Link>,
        )}
      </Menu>
    </ListItem> : <></>
  );
};