import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Box, Button, Grid, Paper, Stack } from '@mui/material';
import { orange } from '@mui/material/colors';
import { Carousel } from '@sogebot/backend/src/database/entity/overlay';
import React from 'react';
import { useLocalstorageState } from 'rooks';

import { ImageItemDialog } from './imageItemDialog';

export function ImageItem(props: {
  image:      Carousel['images'][number],
  isDragging: boolean,
  onUpdate:   (value: Carousel['images'][number]) => void,
  onDelete:   () => void,
}) {
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
      xs={6}
      lg={3}
      md={4}
      sm={4}>
      <Paper
        variant='outlined'
        sx={{
          position:   'relative',
          transition: 'all 300ms',
          height:     '100%',
          '&:hover':  { borderColor: orange[700] },
        }}>
        <ImageItemDialog image={props.image} onDelete={props.onDelete} onUpdate={props.onUpdate}/>
        <Stack spacing={1} alignItems={'center'}>
          <Button {...listeners}
            onPointerDown={(ev) => {
              listeners?.onPointerDown(ev);
              ev.stopPropagation();
            }}
            sx={{
              width:  '100%',
              height: '4px',
              p:      0,
              cursor: 'grab',
            }}
            variant='contained'/>
          <Box sx={{ width: '100%' }}>
            <img src={`${server}/gallery/${props.image.url}`} style={{
              height:    '150px',
              width:     '100%',
              objectFit: 'scale-down',
            }}/>
          </Box>
        </Stack>
      </Paper>
    </Grid>
  );
}