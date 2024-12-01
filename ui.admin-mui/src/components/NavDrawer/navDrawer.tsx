import BuildIcon from '@mui/icons-material/Build';
import DashboardIcon from '@mui/icons-material/Dashboard';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import SettingsIcon from '@mui/icons-material/Settings';
import { ListItem, ListItemIcon, Paper, Stack, Toolbar, Typography } from '@mui/material';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import MuiListItemButton from '@mui/material/ListItemButton';
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

import { MenuItemDeep } from './menuItemDeep';
import { useAppSelector } from '../../hooks/useAppDispatch';
import useMobile from '../../hooks/useMobile';
import { useTranslation } from '../../hooks/useTranslation';
import customTheme, { theme } from '../../theme';
import { UserMenu } from '../User/userMenu';

interface LinkedListItemProps {
  path:  string;
  icon:  any;
  title: string;
}
const LinkedListItem = function (props: LinkedListItemProps) {
  const location = useLocation();
  const reducer = useAppSelector(state => state.loader);
  const isMobile = useMobile();

  const isActive = location.pathname?.split('?')[0] === props.path;

  return (
    <Link to={`${props.path}?server=${JSON.parse(localStorage.server)}`} style={{
      textDecoration: 'none', color: 'white',
    }}>
      <MuiListItemButton
        selected={isActive}
        sx={{
          justifyContent: 'center',
          height:         reducer.drawerWidth,
          p:              '4px',
          minWidth:       'unset',
          width:          isMobile ? 'clamp(20px, 14.35vw, 65px)' : undefined,
          aspectRatio:    '1/1',
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
  const reducer = useAppSelector(state => state.loader);
  const isMobile = useMobile();

  return (
    <Drawer
      sx={{
        width:                !isMobile ? reducer.drawerWidth : undefined,
        flexShrink:           0,
        '& .MuiDrawer-paper': {
          overflow: 'hidden',
          width:    !isMobile ? reducer.drawerWidth : undefined,
        },
      }}
      variant="permanent"
      anchor={isMobile ? 'bottom' : 'left'}>

      <Stack direction={isMobile ? 'row' : undefined} spacing={0} sx={{
        width: '100%', height: '100%',
      }}>

        {isMobile ? <UserMenu key='user-menu-drawer'/> : <Paper><Toolbar sx={{
          '&': {
            margin: 0, padding: 0, paddingLeft: '5px',
          },
        }}><UserMenu key='user-menu-drawer'/></Toolbar></Paper>}
        <List
          sx={{
            display:                       'flex',
            flexDirection:                 isMobile ? 'row' : 'column',
            py:                            isMobile ? 0 : 1,
            // selected and (selected + hover) states
            '&& .dashboard-button-active': {
              bgcolor:                      customTheme.palette.primary.main,
              '&, & .MuiListItemIcon-root': { color: customTheme.palette.primary.contrastText },
            },
            '& .MuiListItem-root': {
              width: isMobile ? 'clamp(20px, 14.35vw, 65px)' : undefined, aspectRatio: '1/1',
            },
            // hover states
            '& .MuiListItemButton-root:hover': !isMobile ? {
              bgcolor:                      customTheme.palette.primary.main,
              '&, & .MuiListItemIcon-root': { color: customTheme.palette.primary.contrastText },
            }: {},
            '& .MuiTypography-root': { fontSize: 'clamp(0.65rem, 3vw, 0.7rem)' },

          }}>
          <ListItem disablePadding>
            <LinkedListItem path="/" icon={<DashboardIcon/>} title={translate('menu.index')}/>
          </ListItem>
          <MenuItemDeep icon={<PriorityHighIcon/>} title={translate('menu.commands')} category="commands"/>
          <MenuItemDeep icon={<BuildIcon/>} title={translate('menu.manage')} category="manage"/>
          <MenuItemDeep icon={<SettingsIcon/>} title={translate('menu.settings')} category="settings"/>
          <MenuItemDeep icon={<FormatListBulletedIcon/>} title={translate('menu.registry')} category="registry"/>
          <MenuItemDeep icon={<QueryStatsIcon/>} title={translate('menu.stats')} category="stats"/>
        </List>
      </Stack>
    </Drawer>
  );
}