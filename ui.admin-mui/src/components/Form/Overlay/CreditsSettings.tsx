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

import { CreditsSettingsClips } from './CreditsSettings/Clips';
import { CreditsSettingsCustom } from './CreditsSettings/Custom';
import { CreditsSettingsEvents } from './CreditsSettings/Events';
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

export const creditsDefaultScreens = [
  {
    id:     v4(),
    height: 1080,
    items:  [
      {
        id:       v4(),
        alignX:   (1920 - 1600) / 2,
        alignY:   100,
        css,
        height:   1015,
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
    name:               'Title Screen',
    type:               'custom',
    waitBetweenScreens: 10000,
    speed:              null,
  },
  {
    id:            v4(),
    type:          'events',
    name:          'Events',
    columns:       3,
    excludeEvents: [
      'custom', 'promo', 'rewardredeem',
    ],
    waitBetweenScreens: null,
    speed:              null,
    headers:            {},
    headerFont:         {
      family:      'PT Sans',
      align:       'left',
      weight:      900,
      color:       '#ffffff',
      size:        50,
      borderColor: '#000000',
      borderPx:    10,
      shadow:      [],
      pl:          100,
      pr:          0,
      pb:          50,
      pt:          100,
    },
    itemFont: {
      family:      'PT Sans',
      align:       'center',
      weight:      500,
      color:       '#ffffff',
      size:        35,
      borderColor: '#000000',
      borderPx:    10,
      shadow:      [],
      pl:          0,
      pr:          0,
      pb:          20,
      pt:          0,
    },
    highlightFont: {
      family:      'PT Sans',
      align:       'center',
      weight:      900,
      color:       '#FFD700',
      size:        35,
      borderColor: '#000000',
      borderPx:    10,
      shadow:      [],
    },
  },
  {
    id:                 v4(),
    type:               'clips',
    name:               'Clips',
    play:               true,
    period:             'stream',
    periodValue:        2,
    numOfClips:         3,
    volume:             30,
    waitBetweenScreens: null,
    speed:              null,
    gameFont:           {
      family:      'PT Sans',
      align:       'left',
      weight:      500,
      color:       '#ffffff',
      size:        35,
      borderColor: '#000000',
      borderPx:    10,
      shadow:      [],
      pl:          40,
      pr:          0,
      pb:          0,
      pt:          0,
    },
    titleFont: {
      family:      'PT Sans',
      align:       'left',
      weight:      500,
      color:       '#ffffff',
      size:        60,
      borderColor: '#000000',
      borderPx:    10,
      shadow:      [],
      pl:          40,
      pr:          0,
      pb:          0,
      pt:          30,
    },
    createdByFont: {
      family:      'PT Sans',
      align:       'left',
      weight:      500,
      color:       '#FFD700',
      size:        30,
      borderColor: '#000000',
      borderPx:    10,
      shadow:      [],
      pl:          40,
      pr:          0,
      pb:          0,
      pt:          0,
    },
  },
  {
    id:     v4(),
    height: 1080,
    items:  [
      {
        id:       v4(),
        alignX:   (1920 - 1600) / 2,
        alignY:   (1080 - 250) / 2,
        css,
        height:   185,
        width:    1600,
        rotation: 0,
        html:     'Thanks for watching!',
        font:     {
          family:      'PT Sans',
          align:       'center',
          weight:      900,
          color:       '#ffffff',
          size:        130,
          borderColor: '#000000',
          borderPx:    10,
          shadow:      [],
        },
      },
    ],
    name:               'Ending Screen',
    type:               'custom',
    waitBetweenScreens: 10000,
    speed:              null,
  },
] as Credits['screens'];

type Props = {
  model: Credits;
  canvas: {
    height: number, width: number
  };
  onUpdate: (value: Credits) => void;
};

function SortableCard(props: {
  name: string,
  id: string,
  isDragging: boolean,
  item?: Credits['screens'][number],
  canvas: { height: number, width: number } ,
  onUpdate?: (value: Credits['screens'][number]) => void;
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

  function handleScreenChange(id: string, value: Credits['screens'][number]) {
    const update = cloneDeep(model);
    const idx = update.screens.findIndex(o => o.id === id);
    update.screens[idx] = value;
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

  const addNewScreen = () => {
    // const update = cloneDeep(model);
    // // update.screens = ;
    // onUpdate(update);
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
          onUpdate={(value) => handleScreenChange(o.id, value)}
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