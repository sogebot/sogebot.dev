import { ChevronRight } from '@mui/icons-material';
import {
  ListItemIcon, Menu, MenuItem, Stack, Typography,
} from '@mui/material';
import MuiListItemButton from '@mui/material/ListItemButton';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';

import { getSocket } from '../../helpers/socket';
import { useTranslation } from '../../hooks/useTranslation';
import theme from '../../theme';

interface LinkedListItemProps {
  icon: any;
  title: string;
  category: 'commands' | 'manage' | 'settings' | 'registry' | 'stats';
}
export const MenuItemDeep: React.FC<LinkedListItemProps> = (props) => {
  const location = useLocation();
  const { translate } = useTranslation();
  const reducer = useSelector((state: any) => state.loader);
  const [ menuItems, setMenuItems ] = useState<any[]>([]);
  const [ isActive, setIsActive ] = useState<boolean>(true);
  const { state, connectedToServer } = useSelector((s: any) => s.loader);

  useEffect(() => {
    if (!state || !connectedToServer) {
      return;
    }
    getSocket('/core/general').emit('menu::private', (items) => {
      setMenuItems(items.filter(o => o.category === props.category).sort((a: { name: string; }, b: { name: string; }) => {
        return translate('menu.' + a.name).localeCompare(translate('menu.' + b.name));
      }));
    });
  }, [state, connectedToServer, props, translate]);

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
    <>
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
            <ChevronRight sx={{
              position: 'absolute',
              right:    '7px',
              top:      '17px',
              fontSize: '12px',
            }}/>
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
        anchorOrigin={{
          vertical:   'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical:   'top',
          horizontal: 'left',
        }}
      >
        {menuItems.map(item => {
          if (item.name === 'modules') {
            return (
              <MenuItem selected={isItemActive(item) || !!anchorElModules} sx={{
                fontSize: '14px', color: getColorOfItem(item),
              }} key={item.id} onClick={handleClickModules}>
                {translate(`menu.${item.name}`)}
                <ChevronRight sx={{
                  position: 'absolute',
                  right:    '7px',
                  top:      '6px',
                  fontSize: '20px',
                }}/>
              </MenuItem>
            );
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
        anchorOrigin={{
          vertical:   'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical:   'top',
          horizontal: 'left',
        }}
      >
        {['core', 'services', 'systems', 'integrations', 'games'].map(item => <Link to={`/settings/modules/${item}?server=${JSON.parse(localStorage.server)}`} key={item} style={{
          textDecoration: 'none', color: 'white',
        }}>
          <MenuItem sx={{ fontSize: '14px' }}
            onClick={() => {
              handleClose(); handleCloseModules();
            }}
            selected={isItemActive({
              id: item, enabled: true,
            })}>{translate('menu.' + item).startsWith('{') ? item : translate('menu.' + item)}</MenuItem>
        </Link>,
        )}
      </Menu>
    </>
  );
};