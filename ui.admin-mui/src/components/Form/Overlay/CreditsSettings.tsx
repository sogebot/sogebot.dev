import {
  DndContext, DragOverlay, KeyboardSensor, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DragIndicatorTwoTone, SettingsTwoTone } from '@mui/icons-material';
import {
  Box,
  Button,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
} from '@mui/material';
import orange from '@mui/material/colors/orange';
import { Credits } from '@sogebot/backend/dest/database/entity/overlay';
import { cloneDeep } from 'lodash';
import React from 'react';
import { v4 } from 'uuid';

import { FormNumericInput } from '../Input/Numeric';

type Props = {
  model: Credits;
  onUpdate: (value: Credits) => void;
};

function SortableCard(props: { type: string, id: string, isDragging: boolean }) {
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
          {props.type}
        </Box>
        <Box>
          <IconButton><SettingsTwoTone/></IconButton>
        </Box>
      </Stack>
    </Paper>
  );
}

export const CreditsSettings: React.FC<Props> = ({ model, onUpdate }) => {
  const [activeId, setActiveId] = React.useState<null | string>(null);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

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

  const addNewScreen = () => {
    const update = cloneDeep(model);
    update.screens = [
      {
        id:                  v4(),
        type:                'title',
        spaceBetweenScreens: 'full-screen-between',
        waitBetweenScreens:  10000,
        height:              1080,
        speed:               null,
      },
      {
        id:                  v4(),
        type:                'events',
        columns:             3,
        excludeEvents:       [],
        spaceBetweenScreens: null,
        waitBetweenScreens:  null,
        speed:               null,
      },
      {
        id:                  v4(),
        type:                'clips',
        play:                true,
        period:              'stream',
        periodValue:         2,
        numOfClips:          3,
        volume:              30,
        spaceBetweenScreens: null,
        waitBetweenScreens:  null,
        speed:               null,
      },
      {
        id:                  v4(),
        type:                'text',
        html:                'Thanks for watching!',
        css:                 '',
        spaceBetweenScreens: null,
        waitBetweenScreens:  null,
        speed:               null,
      },
    ];
    onUpdate(update);
    return;
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
        value={typeof model.spaceBetweenScreens === 'number' ? model.spaceBetweenScreens : undefined}
        label='Space between screens'
        disabled={typeof model.spaceBetweenScreens !== 'number'}
        InputProps={{
          startAdornment: <InputAdornment position='start'>
            <FormControl variant="standard" size='small' sx={{
              '*::before': { border: '0px !important' },
              position:    'relative',
              top:         '5px',
            }}>
              <Select
                MenuProps={{ PaperProps: { sx: { maxHeight: 200 } } }}
                label='Speed'
                value={model.spaceBetweenScreens}
                onChange={(ev) => {
                  let value: number | string = Number(ev.target.value);
                  if (isNaN(value)) {
                    value = ev.target.value;
                  }
                  onUpdate({
                    ...model, spaceBetweenScreens: value as typeof model.spaceBetweenScreens,
                  });
                }}
              >
                <MenuItem selected={typeof model.spaceBetweenScreens === 'number'} value={'250'}>Pixels</MenuItem>
                <MenuItem value={'full-screen-between'}>Full screen between</MenuItem>
                <MenuItem value={'none'}>None</MenuItem>
              </Select>
            </FormControl>
          </InputAdornment>,
          endAdornment: <InputAdornment position='end'>px</InputAdornment>,
        }}
        onChange={val => {
          onUpdate({
            ...model,
            spaceBetweenScreens: val as number,
          });
        }}
      />

      <FormNumericInput
        min={0}
        value={model.waitBetweenScreens}
        label='Wait between screens'
        helperText='Pauses rolling on screen end.'
        InputProps={{ endAdornment: <InputAdornment position='end'>ms</InputAdornment> }}
        onChange={val => {
          onUpdate({
            ...model,
            spaceBetweenScreens: val as number,
          });
        }}
      />
    </Stack>

    <Button sx={{ py: 1.5 }} fullWidth onClick={addNewScreen} variant='contained'>Add new screen</Button>

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
          type={o.type}/>)}
      </SortableContext>
      <DragOverlay>
        {activeId ? (
          <SortableCard
            isDragging={false}
            id={activeId}
            key={activeId}
            type={model.screens.find(o => o.id === activeId)?.type || 'n/a'}/>
        ) : null }
      </DragOverlay>
    </DndContext>

  </>;
};