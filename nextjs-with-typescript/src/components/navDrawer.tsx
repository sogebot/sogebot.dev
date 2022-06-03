
import List from '@mui/material/List';
import { Avatar, ListItem, ListItemIcon, Stack, Tooltip, Typography } from '@mui/material';
import customTheme from '../theme';
import { useRouter } from 'next/router';
import Drawer from '@mui/material/Drawer';
import MuiListItemButton from '@mui/material/ListItemButton';
import DashboardIcon from '@mui/icons-material/Dashboard';
import Link from 'next/link';
import PlaylistPlayIcon from '@mui/icons-material/PlaylistPlay';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import QueueMusicIcon from '@mui/icons-material/QueueMusic';

const drawerWidth: number = 72;

interface LinkedListItemProps {
  path: string;
  icon: any;
  title: string;
}
const LinkedListItem = function (props: LinkedListItemProps) {
  const router = useRouter();
  const isActive = router.asPath === props.path;

  return (
    <Link href={props.path} passHref>
      <MuiListItemButton
        sx={{ justifyContent: 'center', height: drawerWidth }}
        key={props.title}
        dense
        className={isActive ? 'dashboard-button-active' : 'dashboard-button-inactive'}>
          <Stack alignContent={"center"}>
            <ListItemIcon sx={{ placeContent: 'center'}}>
              {props.icon}
            </ListItemIcon>
            <Typography variant="caption" sx={{textAlign: 'center', fontSize: '0.7rem'}}>
              {props.title}
            </Typography>
          </Stack>
      </MuiListItemButton>
    </Link>
  );
};

export default function NavDrawer() {
  return (
  <Drawer
  sx={{
    width: drawerWidth,
    flexShrink: 0,
    '& .MuiDrawer-paper': {
      overflow: 'hidden',
      width: drawerWidth,
      boxSizing: 'border-box',
    },
  }}
  variant="permanent"
  anchor="left">
  <List
    sx={{
    marginTop: '56px',

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
            <LinkedListItem path="/" icon={<DashboardIcon/>} title="Dashboard"/>
        </ListItem>
      </Tooltip>
      <Tooltip title="Playlist" placement="right">
        <ListItem disablePadding>
            <LinkedListItem path="/playlist" icon={<PlaylistPlayIcon/>} title="Playlist"/>
        </ListItem>
      </Tooltip>
      <Tooltip title="Quotes" placement="right">
        <ListItem disablePadding>
            <LinkedListItem path="/quotes" icon={<FormatQuoteIcon/>} title="Quotes"/>
        </ListItem>
      </Tooltip>
      <Tooltip title="Song Requests" placement="right">
        <ListItem disablePadding>
            <LinkedListItem path="/song-requests" icon={<QueueMusicIcon/>} title="Song Requests"/>
        </ListItem>
      </Tooltip>
  </List>
  </Drawer>
  )
}