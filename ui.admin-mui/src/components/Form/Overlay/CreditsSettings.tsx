import { DndContext, DragOverlay, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { arrayMove, rectSortingStrategy, SortableContext, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DragIndicatorTwoTone, SettingsTwoTone } from '@mui/icons-material';
import { Box, Button, Card, CardActionArea, CardContent, Dialog, DialogActions, DialogContent, FormControl, Grid, IconButton, InputAdornment, InputLabel, MenuItem, Paper, Select, Stack, Typography } from '@mui/material';
import orange from '@mui/material/colors/orange';
import { Credits } from '@sogebot/backend/src/database/entity/overlay';
import { cloneDeep } from 'lodash';
import React from 'react';
import { v4 } from 'uuid';

import { CreditsSettingsClips } from './CreditsSettings/Clips';
import { CreditsSettingsCustom } from './CreditsSettings/Custom';
import { CreditsSettingsEvents } from './CreditsSettings/Events';
import { screensList } from './CreditsSettings/src/ScreensList';
import { useAppDispatch } from '../../../hooks/useAppDispatch';
import { setParentDelKeyDisableStatus } from '../../../store/overlaySlice';
import { FormNumericInput } from '../Input/Numeric';

type Props = {
  model:  Credits;
  canvas: {
    height: number, width: number
  };
  onUpdate: (value: Credits) => void;
};

function SortableCard(props: {
  name:       string,
  id:         string,
  isDragging: boolean,
  item?:      Credits['screens'][number],
  canvas:     { height: number, width: number } ,
  onUpdate?:  (value: Credits['screens'][number]) => void;
  onRemove?:  () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: props.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity:   props.isDragging ? 0 : 1,
    transition,
  };

  const [ open, setOpen ] = React.useState(false);

  const dispatch = useAppDispatch();
  React.useEffect(() => {
    dispatch(setParentDelKeyDisableStatus(open));
  }, [open]);

  return (
    <Paper key={props.id} variant='outlined' sx={{
      transition: 'border 300ms',
      width:      '100%',
      '&:hover':  { borderColor: orange[700] },
    }}
    ref={setNodeRef} style={style} {...attributes}
    >
      <Stack direction='row' spacing={1} alignItems={'center'}>
        <Box>
          <IconButton {...listeners}><DragIndicatorTwoTone/></IconButton>
        </Box>
        <Box sx={{ width: '100%' }}>
          {props.name}
        </Box>
        <Box>
          { props.item && <>
            <IconButton onClick={() => setOpen(true)}><SettingsTwoTone/></IconButton>
            <Dialog
              open={open}
              fullScreen>
              {props.item.type === 'custom' && <CreditsSettingsCustom model={props.item} canvas={props.canvas} onUpdate={(value) => props.onUpdate ? props.onUpdate(value) : null}/>}
              {props.item.type === 'events' && <CreditsSettingsEvents model={props.item} canvas={props.canvas} onUpdate={(value) => props.onUpdate ? props.onUpdate(value) : null}/>}
              {props.item.type === 'clips' && <CreditsSettingsClips model={props.item} canvas={props.canvas} onUpdate={(value) => props.onUpdate ? props.onUpdate(value) : null}/>}
              <DialogActions sx={{ px: 2 }}>
                <Grid container sx={{ height: '100%' }} justifyContent={'space-between'}>
                  <Grid>
                    <Button sx={{ width: 300 }} variant='contained' color='error' onClick={() => {
                      props.onRemove ? props.onRemove() : null;
                      setOpen(false);
                    }}>Remove screen</Button>
                  </Grid>
                  <Grid>
                    <Button sx={{ width: 150 }} onClick={() => setOpen(false)}>Close</Button>
                  </Grid>
                </Grid>
              </DialogActions>
            </Dialog>
          </>}
        </Box>
      </Stack>
    </Paper>
  );
}

export const CreditsSettings: React.FC<Props> = ({ model, onUpdate, canvas }) => {
  const [activeId, setActiveId] = React.useState<null | string>(null);
  const [ openDialog, setOpenDialog ] = React.useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleScreenChange(id: string, value: Credits['screens'][number]) {
    const update = cloneDeep(model);
    const idx = update.screens.findIndex(o => o.id === id);
    update.screens[idx] = value;
    onUpdate(update);
  }

  function handleScreenRemove(id: string) {
    const update = cloneDeep(model);
    update.screens = update.screens.filter(o => o.id !== id);
    onUpdate(update);
  }

  function handleDragEnd(event: { active: any; over: any; }) {
    const { active, over } = event;
    setActiveId(null);

    if (active === null || !over) {
      return;
    }
    if (active.id !== over.id) {
      const update = cloneDeep(model);
      update.screens = arrayMove(update.screens, update.screens.findIndex(o => o.id === active.id), update.screens.findIndex(o => o.id === over.id));
      onUpdate(update);
    }
  }
  function handleDragStart(event: { active: any; }) {
    const { active } = event;
    console.debug('credits::dragstart', active);
    setActiveId(active.id);
  }

  const addNewScreen = (key: keyof typeof screensList) => {
    const update = cloneDeep(model);
    console.log(screensList[key].settings);
    update.screens.push({
      ...screensList[key].settings as any,
      id: v4(),
    });
    onUpdate(update);
  };

  return <>
    <Stack spacing={0.5}>
      <FormControl fullWidth>
        <InputLabel id="type-select-label">Rolling Speed</InputLabel>
        <Select
          MenuProps={{ PaperProps: { sx: { maxHeight: 200 } } }}
          label='Speed'
          value={model.speed}
          onChange={(ev) => onUpdate({
            ...model, speed: ev.target.value as typeof model.speed,
          })}
        >
          {['very slow', 'slow', 'medium', 'fast', 'very fast'].map(
            item => <MenuItem value={item} key={item}>{item}</MenuItem>,
          )}
        </Select>
      </FormControl>

      <FormNumericInput
        min={0}
        value={model.waitBetweenScreens}
        label='Wait between screens'
        helperText='Pauses rolling on screen end.'
        InputProps={{ endAdornment: <InputAdornment position='end'>ms</InputAdornment> }}
        onChange={val => {
          onUpdate({
            ...model,
            waitBetweenScreens: val as number,
          });
        }}
      />
    </Stack>

    <Button sx={{ py: 1.5 }} fullWidth onClick={() => setOpenDialog(true)} variant='contained'>Add new screen</Button>

    <Dialog open={openDialog} maxWidth="md" fullWidth>
      <DialogContent>
        <Grid container spacing={1}>
          {Object.entries(screensList).map(([key, val]) => <Grid item xs={4} key={key}>
            <Card>
              <CardActionArea onClick={(ev) => {
                ev.stopPropagation();
                ev.preventDefault();
                addNewScreen(key as keyof typeof screensList);
                setOpenDialog(false);
              }}>
                <CardContent sx={{ height: '140px' }}>
                  <Typography gutterBottom variant="h5" component="div">
                    {val.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {val.description}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>)}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button sx={{ width: 150 }} onClick={() => setOpenDialog(false)}>Close</Button>
      </DialogActions>
    </Dialog>

    <DndContext
      sensors={sensors}
      modifiers={[restrictToVerticalAxis]}
      onDragEnd={handleDragEnd}
      onDragStart={handleDragStart}
    >
      <SortableContext
        items={model.screens}
        strategy={rectSortingStrategy}
      >
        {model.screens.map(o => <SortableCard
          isDragging={o.id === activeId}
          id={o.id}
          key={o.id}
          item={o}
          canvas={canvas}
          onUpdate={(value) => handleScreenChange(o.id, value)}
          onRemove={() => handleScreenRemove(o.id)}
          name={o.name.length > 0 ? o.name : '<unnamed>'}/>)}
      </SortableContext>
      <DragOverlay>
        {activeId ? (
          <SortableCard
            isDragging={false}
            id={activeId}
            key={activeId}
            canvas={{
              height: 0, width: 0,
            }}
            name={model.screens.find(o => o.id === activeId)?.name || 'n/a'}/>
        ) : null }
      </DragOverlay>
    </DndContext>

  </>;
};