import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Box,
  Button,
  Grid,
  Paper,
  Stack,
} from '@mui/material';
import { orange } from '@mui/material/colors';
import { Carousel } from '@sogebot/backend/dest/database/entity/overlay';
import React from 'react';
import { useLocalstorageState } from 'rooks';

export function ImageItem(props: { image: Carousel['images'][number], isDragging: boolean, onClick: () => void, isClicked: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: props.image.id });
  const [server] = useLocalstorageState('server', 'https://demobot.sogebot.xyz');

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity:   props.isDragging ? 0.5 : 1,
    transition,
  };

  return (
    <Grid item key={props.image.id}
      ref={setNodeRef} style={style} {...attributes}
      onPointerDown={() => props.onClick()}
      xs={6}
      lg={3}
      md={4}
      sm={4}>
      <Paper
        variant='outlined'
        sx={{
          cursor:          'pointer',
          transition:      'all 300ms',
          height:          '100%',
          backgroundColor: props.isClicked ? orange[400]: '#000',
          '&:hover':       { borderColor: orange[700] },
        }}>
        <Stack spacing={1} alignItems={'center'}>
          <Button {...listeners} sx={{
            width:  '100%',
            height: '4px',
            p:      0,
            cursor: 'grab',
          }} variant='contained'></Button>
          <Box>
            <img src={`${server}/gallery/${props.image.url}`} style={{ maxHeight: '150px' }}/>
          </Box>
        </Stack>
      </Paper>
    </Grid>
  );
}