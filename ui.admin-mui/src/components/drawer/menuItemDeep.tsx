import { ChevronRight } from '@mui/icons-material';
import {
  ListItemIcon, Menu, MenuItem, Stack, Typography,
} from '@mui/material';
import MuiListItemButton from '@mui/material/ListItemButton';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { getSocket } from '~/src/helpers/socket';
import translate from '~/src/helpers/translate';

import theme from '../../theme';

interface LinkedListItemProps {
  icon: any;
  title: string;
  category: 'commands' | 'manage' | 'settings' | 'registry' | 'stats';
}
export const MenuItemDeep: React.FC<LinkedListItemProps> = (props) => {
  const router = useRouter();
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
  }, [state, connectedToServer, props]);

  useEffect(() => {
    setIsActive(!!menuItems.find((item: any) => '/' + item.id === router.asPath));
  }, [menuItems, router]);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<any>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const isItemActive = (item: { id: string; enabled: boolean; }) => {
    return '/' + item.id === router.asPath;
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
        sx={{ justifyContent: 'center', height: reducer.drawerWidth }}
        key={props.title}
        onClick={handleClick}>
        <Stack alignContent={'center'}  sx={{ color: isActive || !!anchorEl ? theme.palette.primary.main : 'inherit' }}>
          <ListItemIcon sx={{ placeContent: 'center', color: isActive || !!anchorEl ? `${theme.palette.primary.main} !important` : 'inherit' }}>
            {props.icon}
            <ChevronRight sx={{
              position: 'absolute',
              right:    '7px',
              top:      '17px',
              fontSize: '12px',
            }}/>
          </ListItemIcon>
          <Typography variant="caption" sx={{ textAlign: 'center', fontSize: '0.7rem' }}>
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
          return (
            <MenuItem selected={isItemActive(item)} sx={{ fontSize: '14px', color: getColorOfItem(item) }} onClick={() => {
              handleClose(); router.push(`/${item.id}`);
            }} key={item.id}>{translate(`menu.${item.name}`)}</MenuItem>
          );
        })}
      </Menu></>
  );
};