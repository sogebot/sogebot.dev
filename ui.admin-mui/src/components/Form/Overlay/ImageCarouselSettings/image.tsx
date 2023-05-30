import {
  DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import {
  Button, Dialog, DialogActions, DialogContent, DialogTitle, FormLabel, Grid, Stack,
} from '@mui/material';
import { Carousel } from '@sogebot/backend/dest/database/entity/overlay';
import React from 'react';
import { v4 } from 'uuid';

import { ImageItem } from './imageItem';
import { FormSelectorGallery } from '../../Selector/Gallery';

type Props = {
  model: Carousel['images'],
  onChange(value: Carousel['images']): void,
};
export const ImageDialog: React.FC<Props> = ({ onChange, model }) => {
  const [ open, setOpen ] = React.useState(false);

  const [activeId, setActiveId] = React.useState<null | string>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: { active: any; over: any; }) {
    const { active, over } = event;

    if (active === null || !over) {
      return;
    }
    if (active.id !== over.id) {
      onChange(arrayMove(model, model.findIndex(o => o.id === active.id), model.findIndex(o => o.id === over.id)));
    }
    setActiveId(null);
  }

  const removeImage = (id: string) => {
    onChange(model.filter(o => o.id !== id));
  };

  const updateImage = (image: typeof model[number]) => {
    onChange(model.map(o => o.id === image.id ? image : o));
  };

  function handleDragStart(event: { active: any; }) {
    const { active } = event;
    setActiveId(active.id);
  }

  return <>
    <Stack direction='row' spacing={2} justifyContent='space-between' alignItems="center" sx={{ padding: '15px 20px 0px 0' }}>
      <FormLabel sx={{ width: '170px' }}>Images</FormLabel>
      <Button onClick={() => setOpen(true)} variant='contained'>Edit</Button>
    </Stack>

    <Dialog
      fullWidth
      maxWidth='xl'
      onClose={() => setOpen(false)}
      open={open}>
      <DialogTitle>
        Images
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2}>
          <DndContext
            sensors={sensors}
            onDragEnd={handleDragEnd}
            onDragStart={handleDragStart}
          >
            <SortableContext
              items={model}
              strategy={rectSortingStrategy}
            >
              {model.map(image => <ImageItem
                onUpdate={updateImage}
                onDelete={() => removeImage(image.id)}
                key={image.id}
                image={image}
                isDragging={image.id === activeId}
              />)}
            </SortableContext>
          </DndContext>
        </Grid>
      </DialogContent>
      <DialogActions>
        <FormSelectorGallery type='image' announce='Item was added to carousel' button label='Add image' onChange={(value) => value && onChange([...model, {
          id:                   v4(),
          url:                  value,
          animationIn:          'fade',
          animationInDuration:  1000,
          animationOut:         'fade',
          animationOutDuration: 1000,
          duration:             60000,
          waitAfter:            60000,
          waitBefore:           60000,
        }])}/>
        <Button onClick={() => setOpen(false)}>Close</Button>
      </DialogActions>
    </Dialog>
  </>;
};