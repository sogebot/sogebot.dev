
import List from '@mui/material/List';
import { Avatar, ListItem, ListItemIcon, Tooltip } from '@mui/material';
import customTheme from '../theme';
import { useRouter } from 'next/router';
import Drawer from '@mui/material/Drawer';
import MuiListItemButton from '@mui/material/ListItemButton';
import DashboardTwoToneIcon from '@mui/icons-material/DashboardTwoTone';
import Link from 'next/link';
import PlaylistPlayTwoToneIcon from '@mui/icons-material/PlaylistPlayTwoTone';
import FormatQuoteTwoToneIcon from '@mui/icons-material/FormatQuoteTwoTone';
import QueueMusicTwoToneIcon from '@mui/icons-material/QueueMusicTwoTone';

const drawerWidth: number = 42;

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
        key={props.title}
        dense
        className={isActive ? 'dashboard-button-active' : 'dashboard-button-inactive'}>
        <ListItemIcon>
          {props.icon}
        </ListItemIcon>
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
  <Avatar alt="Sogeking!" src="https://i.pravatar.cc/32" sx={{ marginBottom: '1rem', marginTop: '1rem' }} />
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
            <LinkedListItem path="/" icon={<DashboardTwoToneIcon/>} title="Dashboard"/>
        </ListItem>
      </Tooltip>
      <Tooltip title="Playlist" placement="right">
        <ListItem disablePadding>
            <LinkedListItem path="/playlist" icon={<PlaylistPlayTwoToneIcon/>} title="Playlist"/>
        </ListItem>
      </Tooltip>
      <Tooltip title="Quotes" placement="right">
        <ListItem disablePadding>
            <LinkedListItem path="/quotes" icon={<FormatQuoteTwoToneIcon/>} title="Quotes"/>
        </ListItem>
      </Tooltip>
      <Tooltip title="Song Requests" placement="right">
        <ListItem disablePadding>
            <LinkedListItem path="/song-requests" icon={<QueueMusicTwoToneIcon/>} title="Song Requests"/>
        </ListItem>
      </Tooltip>
  </List>
  </Drawer>
  )
}