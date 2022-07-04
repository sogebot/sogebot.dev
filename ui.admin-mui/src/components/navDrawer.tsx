import BuildIcon from '@mui/icons-material/Build';
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
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';

import translate from '~/src/helpers/translate';

import customTheme, { theme } from '../theme';
import { MenuItemDeep } from './drawer/menuItemDeep';
import { UserMenu } from './User/userMenu';

interface LinkedListItemProps {
  path: string;
  icon: any;
  title: string;
}
const LinkedListItem = function (props: LinkedListItemProps) {
  const router = useRouter();
  const reducer = useSelector((state: any) => state.loader);

  const isActive = router.asPath === props.path;
  return (
    <Link href={props.path} passHref>
      <MuiListItemButton
        selected={isActive}
        sx={{ justifyContent: 'center', height: reducer.drawerWidth }}
        key={props.title}>
        <Stack alignContent={'center'} sx={{ color: isActive ? theme.palette.primary.main : 'inherit' }}>
          <ListItemIcon sx={{ placeContent: 'center', color: isActive ? `${theme.palette.primary.main} !important` : 'inherit' }}>
            {props.icon}
          </ListItemIcon>
          <Typography variant="caption" sx={{ textAlign: 'center', fontSize: '0.7rem' }}>
            {props.title}
          </Typography>
        </Stack>
      </MuiListItemButton>
    </Link>
  );
};

export default function NavDrawer() {
  const reducer = useSelector((state: any) => state.loader);
  const router = useRouter();

  const handleServerLogout = () => {
    delete localStorage.serverAutoConnect;
    router.push('/').then(() => router.reload());
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

      <Tooltip title="Logout from server">
        <Button color="error" sx={{ mb: 2 }} onClick={handleServerLogout}>
          <LogoutIcon/>
        </Button>
      </Tooltip>
    </Drawer>
  );
}