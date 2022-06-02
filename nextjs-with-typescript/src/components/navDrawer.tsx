
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import { Avatar, ListItem, ListItemIcon, Tooltip } from '@mui/material';
import customTheme from '../theme';
import { useRouter } from 'next/router';
import * as React from 'react';
import { styled } from '@mui/material/styles';
import Drawer from '@mui/material/Drawer';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import NotificationsIcon from '@mui/icons-material/Notifications';
import MuiListItemButton from '@mui/material/ListItemButton';
import DashboardTwoToneIcon from '@mui/icons-material/DashboardTwoTone';
import Link from 'next/link';

const drawerWidth: number = 42;

interface LinkedListItemProps {
  path: string;
}
const LinkedListItem = React.forwardRef((props: LinkedListItemProps, ref) => {
  const router = useRouter();
  const isActive = router.asPath === props.path;
  return (
    <Link href={props.path} passHref >
      <MuiListItemButton
        key={42}
        dense
        className={isActive ? 'dashboard-button-active' : 'dashboard-button-inactive'}>
        <ListItemIcon>
          <DashboardTwoToneIcon />
        </ListItemIcon>
      </MuiListItemButton>
    </Link>
  );
});

export default function NavDrawer() {
  return (
  <Drawer
  sx={{
    width: drawerWidth,
    flexShrink: 0,
    '& .MuiDrawer-paper': {
      width: drawerWidth,
      boxSizing: 'border-box',
    },
  }}
  variant="permanent"
  anchor="left">
  <Avatar alt="Sogeking!" src="https://i.pravatar.cc/32" />
  <List
    sx={{
    // selected and (selected + hover) states
    '&& .dashboard-button-active': {
    bgcolor: customTheme.palette.primary.main,
    '&, & .MuiListItemIcon-root': {
      color: customTheme.palette.primary.contrastText,
    },
    },
    // hover states
    '& .MuiListItemButton-root:hover': {
    bgcolor: customTheme.palette.primary.main,
    '&, & .MuiListItemIcon-root': {
      color: customTheme.palette.primary.contrastText,
    },
    },
    }}>
      <Tooltip title="Dashboard" placement="right">
    <ListItem disablePadding>
        <LinkedListItem path="/"/>
    </ListItem>
      </Tooltip>
      <Tooltip title="Dashboard2" placement="right">
    <ListItem disablePadding>
        <LinkedListItem path="/2"/>
    </ListItem>
      </Tooltip>
  </List>
  </Drawer>
  )
}