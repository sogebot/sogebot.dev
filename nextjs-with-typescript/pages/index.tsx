import * as React from 'react';
import { styled, createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import MuiDrawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { Avatar, ListItem, ListItemIcon, Tooltip } from '@mui/material';
import { NextPage } from 'next/types';
import customTheme from '../src/theme';
import MuiListItemButton from '@mui/material/ListItemButton';
import DashboardTwoToneIcon from '@mui/icons-material/DashboardTwoTone';
import { useRouter } from 'next/router'
import Link from 'next/link';

const drawerWidth: number = 62;

const AppBar = styled(MuiAppBar, {})<MuiAppBarProps>(({ theme }) => ({
  zIndex: theme.zIndex.drawer + 1,
  marginLeft: drawerWidth,
  width: `calc(100% - ${drawerWidth}px)`,
}));

const Drawer = styled(MuiDrawer, { })(
  ({ theme }) => ({
    '& .MuiDrawer-paper': {
      padding: '10px',
      overflow: 'hidden',
      position: 'relative',
      whiteSpace: 'nowrap',
      width: drawerWidth,
      transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
      }),
      boxSizing: 'border-box',
    },
  }),
);

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

const Home: NextPage = () => {
  return (
    <ThemeProvider theme={customTheme}>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
    <AppBar position="absolute">
      <Toolbar
        sx={{
          pr: '24px', // keep right padding when drawer closed
        }}
      >
        <Typography
          component="h1"
          variant="h6"
          color="inherit"
          noWrap
          sx={{ flexGrow: 1 }}
        >
          Dashboard
        </Typography>
      </Toolbar>
    </AppBar>
      <Drawer variant="permanent">
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
          <Divider />
        </Drawer>
        </Box>
        </ThemeProvider>
  );
};

export default Home;
