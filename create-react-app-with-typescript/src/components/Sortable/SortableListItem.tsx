import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DragIndicatorTwoTone } from '@mui/icons-material';
import {
  Box,
  IconButton,
  ListItem,
  Paper,
  Stack,
  Switch,
} from '@mui/material';
import { grey, orange } from '@mui/material/colors';
import React from 'react';

export function SortableListItem(props: { draggable?: boolean, id: string, isDragging: boolean, visible: boolean, onVisibilityChange: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: props.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity:   props.isDragging ? 0.5 : 1,
    transition,
  };

  return (
    <ListItem key={props.id}
      ref={setNodeRef} style={style} {...attributes}
      sx={{
        p: 0, m: 0,
      }}
    >
      <Paper variant='outlined' sx={{
        cursor:     'pointer',
        transition: 'all 300ms',
        width:      '100%',
        '&:hover':  { borderColor: orange[700] },
      }}>
        <Stack direction='row' spacing={1} alignItems={'center'}>
          <Box>
            {props.draggable && <IconButton {...listeners}><DragIndicatorTwoTone/></IconButton>}
          </Box>
          <Box sx={{ width: '100%' }}>
            {props.id}
          </Box>
          <Box>
            <Switch checked={props.visible} onClick={props.onVisibilityChange} sx={{
              opacity:                   props.visible ? 1 : 0.5,
              '& .MuiSwitch-switchBase': {
                margin:          2,
                padding:         0,
                transform:       'translate(-15px, -10px)',
                '&.Mui-checked': {
                  transform:            'translate(12px, -10px)',
                  '& .MuiSwitch-thumb': {
                    backgroundColor: '#ffa000',
                    '&:before':      {
                      backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="24" width="24" viewBox="0 0 24 24"><path fill="${encodeURIComponent(
                        '#fff',
                      )}" d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>')`,
                    },
                  },
                },

                '& .MuiSwitch-thumb': {
                  width:      26,
                  height:     26,
                  color:      grey[800],
                  '&:before': {
                    content:            '\'\'',
                    position:           'absolute',
                    width:              '100%',
                    height:             '100%',
                    left:               0,
                    top:                0,
                    backgroundRepeat:   'no-repeat',
                    backgroundPosition: 'center',
                    backgroundImage:    `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="24" width="24" viewBox="0 0 24 24"><path fill="${encodeURIComponent(
                      '#fff',
                    )}" d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78 3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/></svg>')`,
                  },
                },
              },
            }}/>
          </Box>
        </Stack>
      </Paper>
    </ListItem>
  );
}