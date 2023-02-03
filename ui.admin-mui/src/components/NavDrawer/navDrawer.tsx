import BuildIcon from '@mui/icons-material/Build';
import CookieIcon from '@mui/icons-material/Cookie';
import DashboardIcon from '@mui/icons-material/Dashboard';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import LogoutIcon from '@mui/icons-material/Logout';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import SettingsIcon from '@mui/icons-material/Settings';
import {
  Button, ListItem, ListItemIcon, Paper, Stack, Toolbar, Tooltip, Typography,
} from '@mui/material';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import MuiListItemButton from '@mui/material/ListItemButton';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Link, useLocation, useNavigate,
} from 'react-router-dom';

import { MenuItemDeep } from './menuItemDeep';
import { useTranslation } from '../../hooks/useTranslation';
import { toggleCookieManager } from '../../store/loaderSlice';
import customTheme, { theme } from '../../theme';
import { UserMenu } from '../User/userMenu';

interface LinkedListItemProps {
  path: string;
  icon: any;
  title: string;
}
const LinkedListItem = function (props: LinkedListItemProps) {
  const location = useLocation();
  const reducer = useSelector((state: any) => state.loader);

  const isActive = location.pathname?.split('?')[0] === props.path;

  return (
    <Link to={`${props.path}?server=${JSON.parse(sessionStorage.server)}`} style={{
      textDecoration: 'none', color: 'white',
    }}>
      <MuiListItemButton
        selected={isActive}
        sx={{
          justifyContent: 'center', height: reducer.drawerWidth, p: '4px',
        }}
        key={props.title}>
        <Stack alignContent={'center'} sx={{ color: isActive ? theme.palette.primary.main : 'inherit' }}>
          <ListItemIcon sx={{
            placeContent: 'center', color: isActive ? `${theme.palette.primary.main} !important` : 'inherit',
          }}>
            {props.icon}
          </ListItemIcon>
          <Typography variant="caption" sx={{
            textAlign: 'center', fontSize: '0.7rem',
          }}>
            {props.title}
          </Typography>
        </Stack>
      </MuiListItemButton>
    </Link>
  );
};

export default function NavDrawer() {
  const { translate } = useTranslation();
  const reducer = useSelector((state: any) => state.loader);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleServerLogout = () => {
    delete localStorage.serverAutoConnect;
    navigate('/');
    window.location.reload();
  };

  return (
    <Drawer
      sx={{
        width:                reducer.drawerWidth,
        flexShrink:           0,
        '& .MuiDrawer-paper': {
          overflow: 'hidden',
          width:    reducer.drawerWidth,
        },
      }}
      variant="permanent"
      anchor="left">

      {<Paper><Toolbar sx={{
        '&': {
          margin: 0, padding: 0, paddingLeft: '5px',
        },
      }}><UserMenu key='user-menu-drawer'/></Toolbar></Paper>}
      <List
        sx={{
          flex:                          1,
          // selected and (selected + hover) states
          '&& .dashboard-button-active': {
            bgcolor:                      customTheme.palette.primary.main,
            '&, & .MuiListItemIcon-root': { color: customTheme.palette.primary.contrastText },
          },
          // hover states
          '& .MuiListItemButton-root:hover': {
            bgcolor:                      customTheme.palette.primary.main,
            '&, & .MuiListItemIcon-root': { color: customTheme.palette.primary.contrastText },
          },
        }}>
        <ListItem disablePadding>
          <LinkedListItem path="/" icon={<DashboardIcon/>} title={translate('menu.index')}/>
        </ListItem>
        <ListItem disablePadding>
          <MenuItemDeep icon={<PriorityHighIcon/>} title={translate('menu.commands')} category="commands"/>
        </ListItem>
        <ListItem disablePadding>
          <MenuItemDeep icon={<BuildIcon/>} title={translate('menu.manage')} category="manage"/>
        </ListItem>
        <ListItem disablePadding>
          <MenuItemDeep icon={<SettingsIcon/>} title={translate('menu.settings')} category="settings"/>
        </ListItem>
        <ListItem disablePadding>
          <MenuItemDeep icon={<FormatListBulletedIcon/>} title={translate('menu.registry')} category="registry"/>
        </ListItem>
        <ListItem disablePadding>
          <MenuItemDeep icon={<QueryStatsIcon/>} title={translate('menu.stats')} category="stats"/>
        </ListItem>
      </List>

      <Tooltip title="Cookie management" placement='right'>
        <Button color='light' sx={{ py: 2 }} onClick={() => dispatch(toggleCookieManager(true))}>
          <CookieIcon/>
        </Button>
      </Tooltip>

      <Tooltip title="Logout from server" placement='right'>
        <Button color="error" sx={{
          mb: 2, py: 2,
        }} onClick={handleServerLogout}>
          <LogoutIcon/>
        </Button>
      </Tooltip>
    </Drawer>
  );
}