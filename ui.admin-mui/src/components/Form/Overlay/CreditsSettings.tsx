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
  Dialog,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
} from '@mui/material';
import orange from '@mui/material/colors/orange';
import { Credits } from '@sogebot/backend/src/database/entity/overlay';
import { cloneDeep } from 'lodash';
import React from 'react';
import { v4 } from 'uuid';

import { CreditsSettingsCustom } from './CreditsSettings/Custom';
import { FormNumericInput } from '../Input/Numeric';

const css
= `
/* Any customized css should be in #wrapped to not affect anything outside
#wrapper {}
*/

#wrapper .title {
  font-size: 2.5vw;
  text-transform: uppercase;
}
#wrapper .game {
  font-size: 4vw;
  text-transform: uppercase;
}
#wrapper .thumbnail {
  padding-top: 50px;
}
`;
const html
= `
<div class="title">$title</div>
<div class="game">$game</div>
<img class="thumbnail" src="$thumbnail(200x266)" width="200"/>
`;

type Props = {
  model: Credits;
  canvas: {
    height: number, width: number
  };
  onUpdate: (value: Credits) => void;
};

function SortableCard(props: { name: string, id: string, isDragging: boolean, item?: Credits['screens'][number], canvas: { height: number, width: number } }) {
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
              {props.item.type === 'custom' && <CreditsSettingsCustom model={props.item} canvas={props.canvas}/>}
              <Box sx={{ p: 1 }}>
                <Grid container sx={{ height: '100%' }} justifyContent={'end'} spacing={1}>
                  <Grid>
                    <Button sx={{ width: 150 }} onClick={() => setOpen(false)}>Close</Button>
                  </Grid>
                </Grid>
              </Box>
            </Dialog>
          </>}
        </Box>
      </Stack>
    </Paper>
  );
}

export const CreditsSettings: React.FC<Props> = ({ model, onUpdate, canvas }) => {
  const [activeId, setActiveId] = React.useState<null | string>(null);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const spaceBetweenScreensSelect = isNaN(Number(model.spaceBetweenScreens)) ? model.spaceBetweenScreens : 'pixels';

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
        id:    v4(),
        items: [
          {
            id:       v4(),
            alignX:   (1920 - 1600) / 2,
            alignY:   100,
            css,
            height:   300,
            width:    1600,
            rotation: 0,
            html,
            font:     {
              family:      'Cabin Condensed',
              align:       'center',
              weight:      500,
              color:       '#ffffff',
              size:        20,
              borderColor: '#000000',
              borderPx:    1,
              shadow:      [],
            },
          },
        ],
        name:                'Title Screen',
        type:                'custom',
        spaceBetweenScreens: 'full-screen-between',
        waitBetweenScreens:  10000,
        speed:               null,
      },
      {
        id:                  v4(),
        type:                'events',
        name:                'Events',
        columns:             3,
        excludeEvents:       [],
        spaceBetweenScreens: null,
        waitBetweenScreens:  null,
        speed:               null,
      },
      {
        id:                  v4(),
        type:                'clips',
        name:                'Clips',
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
        id:    v4(),
        items: [
          {
            id:       v4(),
            alignX:   1920 / 2,
            alignY:   100,
            css,
            height:   300,
            width:    400,
            rotation: 0,
            html:     'Thanks for watching!',
            font:     {
              family:      'PT Sans',
              align:       'center',
              weight:      500,
              color:       '#ffffff',
              size:        80,
              borderColor: '#000000',
              borderPx:    1,
              shadow:      [],
            },
          },
        ],
        name:                'Ending Screen',
        type:                'custom',
        spaceBetweenScreens: 'full-screen-between',
        waitBetweenScreens:  10000,
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
        value={typeof model.spaceBetweenScreens === 'number' ? model.spaceBetweenScreens : 0}
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
                value={spaceBetweenScreensSelect}
                onChange={(ev) => {
                  const value = ev.target.value === 'pixels' ? 250 : ev.target.value;
                  onUpdate({
                    ...model, spaceBetweenScreens: value as typeof model.spaceBetweenScreens,
                  });
                }}
              >
                <MenuItem value={'pixels'}>Pixels</MenuItem>
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
            waitBetweenScreens: val as number,
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
          item={o}
          canvas={canvas}
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