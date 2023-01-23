import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CircleTwoTone, DragIndicatorTwoTone } from '@mui/icons-material';
import {
  Box,
  Grid,
  IconButton,
  Paper,
  Stack,
} from '@mui/material';
import { orange } from '@mui/material/colors';
import { capitalize } from 'lodash';
import { Twitch } from 'mdi-material-ui';
import React from 'react';

export function DashboardSortableItem(props: { draggable?: boolean, id: string, isDragging: boolean, onClick: () => void, isClicked: boolean }) {
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
    <Grid item key={props.id}
      ref={setNodeRef} style={style} {...attributes}
      onPointerDown={() => props.onClick()}
      xs={6}
      lg={3}
      md={4}
      sm={4}>
      <Paper variant='outlined' sx={{
        p:               1,
        cursor:          'pointer',
        transition:      'all 300ms',
        backgroundColor: props.isClicked ? orange[400]: '#000',
        '&:hover':       { borderColor: orange[700] },
      }}>
        <Stack direction='row' spacing={1} alignItems={'center'}>
          <Box>
            {props.draggable && <IconButton {...listeners}><DragIndicatorTwoTone/></IconButton>}
          </Box>
          <Box sx={{ transform: 'translateY(4px)' }}>
            { props.id.split('|')[0] === 'twitch' && <Twitch/> }
            { props.id.split('|')[0] === 'general' && <CircleTwoTone/> }
          </Box>
          <Box>
            { capitalize(props.id.split('|')[1].replace(/([A-Z])/g, '$1')) }
          </Box>
        </Stack>
      </Paper>
    </Grid>
  );
}