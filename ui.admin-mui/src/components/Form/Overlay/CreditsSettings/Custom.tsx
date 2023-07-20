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
import {
  BorderInnerTwoTone, BorderStyleTwoTone,
  CropFreeTwoTone, DragIndicatorTwoTone, FitScreenTwoTone, ZoomInTwoTone, ZoomOutTwoTone,
} from '@mui/icons-material';
import {
  Box, Button, DialogContent, Divider, FormControl, Unstable_Grid2 as Grid, IconButton, InputAdornment, InputLabel, MenuItem, Paper, Select, Stack, TextField, Tooltip,
} from '@mui/material';
import orange from '@mui/material/colors/orange';
import { CreditsScreenCustom, Overlay } from '@sogebot/backend/dest/database/entity/overlay';
import { flatten } from '@sogebot/backend/dest/helpers/flatten';
import { cloneDeep } from 'lodash';
import set from 'lodash/set';
import React from 'react';
import Moveable from 'react-moveable';
import {
  useKey, useMouse, usePreviousImmediate,
} from 'rooks';
import SimpleBar from 'simplebar-react';
import { v4 } from 'uuid';

import { cssWrapper } from './src/Templates';
import { useValidator } from '../../../../hooks/useValidator';
import theme from '../../../../theme';
import { AccordionFont, loadFont } from '../../../Accordion/Font';
import { DimensionViewable, setZoomDimensionViewable } from '../../../Moveable/DimensionViewable';
import { RemoveButton, setZoomRemoveButton } from '../../../Moveable/RemoveButton';
import { CreditsCustomItem } from '../../../Overlay/CreditsCustomItem';
import { FormNumericInput } from '../../Input/Numeric';
import { CSSDialog } from '../HTMLSettings/css';
import { HTMLDialog } from '../HTMLSettings/html';
import { Settings } from '../Settings';

let isPositionChanging = false;
document.addEventListener('mouseup', () => isPositionChanging = false);

type Props = {
  model: CreditsScreenCustom;
  canvas: { width: number, height: number },
  onUpdate: (value: CreditsScreenCustom) => void;
};

function SortableCard(props: {
  name: string,
  id: string,
  isDragging: boolean,
  onClick?: () => void,
  isSelected?: boolean,
  item?: CreditsScreenCustom['items'][number],
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

  return (
    <Paper key={props.id} variant='outlined' onClick={() => props.onClick ? props.onClick() : null}
      sx={{
        userSelect:  'none',
        transition:  'border 300ms',
        width:       '100%',
        borderColor: props.isSelected ? orange[700] : undefined,
        '&:hover':   { borderColor: orange[700] },
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
      </Stack>
    </Paper>
  );
}

export const CreditsSettingsCustom: React.FC<Props> = ({ model, canvas, onUpdate }) => {
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
      update.items = arrayMove(update.items, update.items.findIndex(o => o.id === active.id), update.items.findIndex(o => o.id === over.id));
      setItem(update);
    }
  }
  function handleDragStart(event: { active: any; }) {
    const { active } = event;
    console.debug('credits::items::dragstart', active);
    setActiveId(active.id);
  }

  const [ accordion, setAccordion ] = React.useState('');
  const [ key, setKey ] = React.useState(Date.now());
  const [ moveableId, setMoveableId ] = React.useState<null | string>(null);
  const moveableRef = React.useMemo(() => document.getElementById(moveableId!), [ moveableId ]);

  const { x, y } = useMouse();
  const mouseX = usePreviousImmediate(x);
  const mouseY = usePreviousImmediate(y);
  const [elementGuidelines, setElementGuidelines] = React.useState<Element[]>([]);

  const containerRef = React.useRef<HTMLDivElement>();

  const [ zoom, setZoom ] = React.useState(1);
  const [frame, setFrame] = React.useState({
    translate: [0,0], rotate: 0,
  });

  const [ position, setPosition ] = React.useState([50, 0]);

  React.useEffect(() => {
    if (isPositionChanging && x && y && mouseX && mouseY) {
      setPosition(pos => {
        return [pos[0] + ((x - mouseX) / zoom), pos[1] + ((y - mouseY) / zoom)];
      });
    }
  }, [x, y, mouseY, mouseX, zoom]);

  const [bounds, setBounds] = React.useState<undefined | { top: number, left: number, right: number, bottom: number }>({
    top: 0, left: 0, right: 0, bottom: 0,
  });
  const [boundsEnabled, setBoundsEnabled] = React.useState(false);
  const [snapEnabled, setSnapEnabled] = React.useState(true);

  const [ item, setItem ] = React.useState<CreditsScreenCustom>(model);
  React.useEffect(() => {
    onUpdate(item);
  }, [ item ]);

  const selectedItem = item.items.find(o => o.id.replace(/-/g, '') === moveableId);

  useKey(['Delete'], () => {
    if (selectedItem) {
      setItem(o => ({
        ...o,
        items: o.items.filter(i => {
          return i.id.replace(/-/g, '') !== selectedItem.id && i.id !== selectedItem.id;
        }),
      }) as any);
      setMoveableId(null);
    }
  }, { when: !!selectedItem });

  const refresh = React.useCallback(() => setKey(Date.now()), [ setKey ]);

  const handleItemChange = React.useCallback((path: string, value: any) => {
    setItem((val) => {
      const updatedItems = val.items;
      const updatedItem = updatedItems.find(o => o.id.replace(/-/g, '') === moveableId);
      if (updatedItem) {
        set(updatedItem, path, value);
      }
      return {
        ...val,
        items: updatedItems,
      };
    });
  }, [moveableId]);
  React.useEffect(() => {
    // items to have snaps
    const els: any[] = [];
    for (const i of item.items) {
      els.push(document.getElementById(i.id.replace(/-/g, '')));
    }
    setElementGuidelines(els);

    // set bounds
    if (boundsEnabled) {
      setBounds({
        left:   0,
        top:    0,
        right:  canvas.width,
        bottom: item.height,
      });
    } else {
      setBounds(undefined);
    }
  }, [moveableId, item, boundsEnabled]);

  const { validate } = useValidator();

  React.useEffect(() => {
    // load fonts
    for (const items of item.items) {
      const flattenItem = flatten(items);
      Object.keys(flattenItem).filter(o => o.toLowerCase().includes('font') && o.toLowerCase().includes('family')).forEach((k) => {
        loadFont(flattenItem[k]);
      });
    }
  }, []);

  React.useEffect(() => {
    validate(Overlay, item);
  }, [item, validate]);

  const fitZoomOnScreen = React.useCallback((isZoomReset = false) => {
    if (containerRef.current) {
      if (!isZoomReset) {
        // we need to reset zoom first
        setZoom(1);
        setPosition([50, 0]);
        setTimeout(() => fitZoomOnScreen(true));
        return;
      }
      const zoomHeight = ((containerRef.current.getBoundingClientRect().height - 40) / containerRef.current.scrollHeight);
      const zoomWidth = ((containerRef.current.getBoundingClientRect().width - 40) / containerRef.current.scrollWidth);
      setZoom(Math.min(zoomHeight, zoomWidth));
    }
  }, [containerRef.current]);

  React.useEffect(() => {
    setZoomDimensionViewable(zoom);
    setZoomRemoveButton(zoom);
  }, [ zoom ]);

  const addNewItem = () => {
    setItem(o => {
      const update = cloneDeep(o.items);
      update.push({
        id:       v4(),
        alignX:   0,
        alignY:   0,
        css:      cssWrapper,
        height:   canvas.height,
        width:    canvas.width,
        rotation: 0,
        html:     '',
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
      });
      return {
        ...o,
        items: update,
      };
    });
  };

  return(<>
    <DialogContent sx={{
      p: 0, overflowX: 'hidden',
    }}>
      <Grid container spacing={0} sx={{
        height: '100%', m: 0,
      }}>
        <Grid sx={{
          backgroundColor: '#1e1e1e', p: 1, width: '352px',
        }}>
          <Box sx={{ p: 1 }}>
            <Tooltip title="Snap">
              <IconButton onClick={() => setSnapEnabled(o => !o)} sx={{ backgroundColor: snapEnabled ? `${theme.palette.primary.main}55` : undefined }}><BorderInnerTwoTone/></IconButton>
            </Tooltip>
            <Tooltip title="Bounds">
              <IconButton  onClick={() => setBoundsEnabled(o => !o)} sx={{ backgroundColor: boundsEnabled ? `${theme.palette.primary.main}55` : undefined }}><BorderStyleTwoTone/></IconButton>
            </Tooltip>
            <Tooltip title="Zoom in">
              <IconButton onClick={() => setZoom(o => o + 0.05)}><ZoomInTwoTone/></IconButton>
            </Tooltip>
            <Tooltip title="Zoom out">
              <IconButton onClick={() => setZoom(o => o - 0.05)}><ZoomOutTwoTone/></IconButton>
            </Tooltip>
            <Tooltip title="Fit screen">
              <IconButton onClick={() => fitZoomOnScreen()}><FitScreenTwoTone/></IconButton>
            </Tooltip>
            <Tooltip title='Reset zoom'>
              <IconButton onClick={() => {
                setZoom(1);
                setPosition([50, 0]);
              }}><CropFreeTwoTone/></IconButton>
            </Tooltip>
          </Box>

          <SimpleBar style={{ maxHeight: 'calc(100vh - 125px)' }} autoHide={false}>
            <Stack spacing={0.5}>
              <TextField
                sx={{ mb: 0.5 }}
                label={'Name'}
                fullWidth
                value={item.name}
                onChange={(ev) => {
                  setItem({
                    ...item, name: ev.currentTarget.value,
                  });
                }}
              />

              <FormNumericInput
                min={0}
                value={item.height}
                label='Height'
                InputProps={{ endAdornment: <InputAdornment position='end'>px</InputAdornment> }}
                onChange={val => {
                  setItem({
                    ...item,
                    height: val as number,
                  });
                }}
              />

              <FormControl fullWidth>
                <InputLabel id="type-select-label" shrink>Rolling Speed</InputLabel>
                <Select
                  MenuProps={{ PaperProps: { sx: { maxHeight: 200 } } }}
                  label='Speed'
                  displayEmpty
                  value={item.speed ?? ''}
                  onChange={(ev) => setItem({
                    ...item, speed: ev.target.value === '' ? null : (ev.target.value as typeof item.speed),
                  })}
                >
                  <MenuItem value={''}>--- use global value ---</MenuItem>
                  {['very slow', 'slow', 'medium', 'fast', 'very fast'].map(
                    it => <MenuItem value={it} key={it}>{it}</MenuItem>,
                  )}
                </Select>
              </FormControl>

              <FormNumericInput
                min={0}
                value={item.waitBetweenScreens}
                displayEmpty
                placeholder='Use global value'
                label='Wait between screens'
                helperText='Pauses rolling on screen end.'
                InputProps={{ endAdornment: <InputAdornment position='end'>ms</InputAdornment> }}
                onChange={val => {
                  setItem({
                    ...item,
                    waitBetweenScreens: val as number,
                  });
                }}
              />

              <Divider variant='middle'/>

              <DndContext
                sensors={sensors}
                modifiers={[restrictToVerticalAxis]}
                onDragEnd={handleDragEnd}
                onDragStart={handleDragStart}
              >
                <SortableContext
                  items={item.items}
                  strategy={rectSortingStrategy}
                >
                  {item.items.map((o, idx) => <SortableCard
                    isDragging={o.id === activeId}
                    id={o.id}
                    key={o.id}
                    item={o}
                    onClick={() => setMoveableId(moveableId === o.id.replace(/-/g, '') ? null : o.id.replace(/-/g, ''))}
                    isSelected={moveableId === o.id.replace(/-/g, '')}
                    name={`Item ${Number(idx + 1)}`}/>)}
                </SortableContext>
                <DragOverlay>
                  {activeId ? (
                    <SortableCard
                      isDragging={false}
                      id={activeId}
                      key={activeId}
                      name={`Item ${item.items.findIndex(it => it.id === activeId) + 1}`}/>
                  ) : null }
                </DragOverlay>
              </DndContext>

              <Button variant='contained' onClick={addNewItem} fullWidth>Add new item</Button>
            </Stack>

          </SimpleBar>
        </Grid>
        <Grid xs sx={{ height: '100%' }}
          onContextMenu={(e) => {
            setMoveableId(null);
            e.stopPropagation();
            e.preventDefault();
          }}>
          <Box id="container"
            onMouseDown={() => isPositionChanging = true}
            onWheel={(e) => {
              setZoom(o => o + (e.deltaY < 0 ? 0.025 : -0.025));
            }}
            sx={{
              backgroundColor: '#343434',
              width:           '100%',
              height:          '100%',
              position:        'relative',
              overflow:        'hidden',
              cursor:          isPositionChanging ? 'grabbing' : 'grab',
              p:               5,
            }}  ref={containerRef}>
            <Paper
              sx={{
                height:          `${item.height}px`,
                width:           `${canvas.width}px`,
                position:        'absolute',
                border:          `${1/zoom}px solid grey !important`,
                transformOrigin: '0 0',
                transform:       `scale(${zoom}) translate(${position[0]}px, ${position[1]}px)`,
                backgroundImage: `linear-gradient(45deg, #222 25%, transparent 25%),
                                      linear-gradient(135deg, #222 25%, transparent 25%),
                                      linear-gradient(45deg, transparent 75%, #222 75%),
                                      linear-gradient(135deg, transparent 75%, #222 75%)`,
                backgroundSize:     `20px 20px`, /* Must be a square */
                backgroundPosition: `0 0, 10px 0, 10px -10px, 0px 10px`, /* Must be half of one side of the square */
              }}>
              {item.items.map(o => <Paper
                id={o.id.replace(/-/g, '')}
                key={`${o.id}`}
                onMouseDown={(e) => {
                  if (e.button !== 1) {
                    e.stopPropagation();
                    e.preventDefault();
                  }
                }}
                onClick={(e) => {
                  setMoveableId(o.id.replace(/-/g, ''));
                  e.stopPropagation();
                  e.preventDefault();
                }}
                elevation={0}
                sx={{
                  position:        'absolute',
                  width:           `${o.width}px`,
                  height:          `${o.height}px`,
                  backgroundColor: `transparent`,
                  border:          `0 !important`,
                  left:            `${o.alignX}px`,
                  top:             `${o.alignY}px`,
                  fontWeight:      '900',
                  fontSize:        `${20}px`,
                  textTransform:   'uppercase',
                  userSelect:      'none',
                  cursor:          moveableId === o.id.replace(/-/g, '') ? 'move' : 'pointer',
                  lineHeight:      `${12}px`,
                  '& small':       { fontSize: `${12}px` },
                  transform:       `rotate(${ o.rotation ?? 0 }deg)`,
                }}
              >
                <Box key={`${o.id}-${JSON.stringify(o)}` /* force refresh on opts change */} sx={{
                  width: '100%', height: '100%',
                }}>
                  <CreditsCustomItem height={o.height} width={o.width} id={o.id} item={o} groupId={''}/>
                </Box>
              </Paper>)}
              {moveableId && <Moveable
                key={`${moveableId}-${key}-${snapEnabled}`}
                ables={[DimensionViewable, RemoveButton]}
                props={{
                  dimensionViewable: true, removeButton: true,
                }}
                target={moveableRef}
                resizable={true}
                origin={false}
                bounds={bounds}
                onDelete={() => {
                  setItem(o => ({
                    ...o,
                    items: o.items.filter(i => i.id.replace(/-/g, '') !== moveableId),
                  }) as any);
                  setMoveableId(null);
                }}
                horizontalGuidelines={[item.height / 4, item.height / 2, (item.height / 4) * 3]}
                verticalGuidelines={[canvas.width / 4, canvas.width / 2, (canvas.width / 4) * 3]}
                isDisplayInnerSnapDigit={true}
                elementGuidelines={elementGuidelines}
                snappable={true}
                snapThreshold={5}
                isDisplaySnapDigit={true}
                snapGap={true}
                snapDirections={{
                  top:    snapEnabled,
                  right:  snapEnabled,
                  bottom: snapEnabled,
                  left:   snapEnabled,
                  center: snapEnabled,
                  middle: snapEnabled,

                }}
                elementSnapDirections={{
                  top:    snapEnabled,
                  right:  snapEnabled,
                  bottom: snapEnabled,
                  left:   snapEnabled,
                  center: snapEnabled,
                  middle: snapEnabled,

                }}
                snapDigit={0}
                draggable={true}
                checkInput
                throttleDrag={0}
                startDragRotate={0}
                throttleDragRotate={0}
                padding={{
                  'left': 0,'top': 0,'right': 0,'bottom': 0,
                }}
                rotationPosition={'top'}
                rotatable={true}
                throttleRotate={0}
                onRotateStart={e => {
                  e.set(frame.rotate);
                }}
                onRotate={e => {
                  frame.rotate =  e.beforeRotate;
                  e.target.style.transform = `rotate(${ e.beforeRotate}deg)`;
                }}
                onRotateEnd={e => {
                  if (selectedItem) {
                    handleItemChange('rotation', frame.rotate);
                    // reset things
                    e.target.style.removeProperty('transform');
                    refresh();
                  }
                }}
                onResizeEnd={e => {
                  if (selectedItem) {
                    handleItemChange('width', Math.round((e.target as any).offsetWidth));
                    handleItemChange('height', Math.round((e.target as any).offsetHeight));
                    handleItemChange('alignX', Math.round(selectedItem.alignX + frame.translate[0]));
                    handleItemChange('alignY', Math.round(selectedItem.alignY + frame.translate[1]));
                    // reset things
                    e.target.style.removeProperty('width');
                    e.target.style.removeProperty('height');
                    e.target.style.removeProperty('transform');
                    refresh();
                  }
                }}
                onResizeStart={e => {
                  e.setOrigin(['%', '%']);
                  e.dragStart && e.dragStart.set(frame.translate);
                }}
                onResize={e => {
                  const beforeTranslate = e.drag.beforeTranslate;

                  frame.translate = beforeTranslate;
                  e.target.style.width = `${e.width}px`;
                  e.target.style.height = `${e.height}px`;
                  e.target.style.transform = `translate(${beforeTranslate[0]}px, ${beforeTranslate[1]}px) rotate(${selectedItem?.rotation ?? 0}deg)`;
                }}
                onDragEnd={(e) => {
                  if (selectedItem) {
                    handleItemChange('alignX', Math.round(selectedItem.alignX + frame.translate[0]));
                    handleItemChange('alignY', Math.round(selectedItem.alignY + frame.translate[1]));
                    e.target.style.transform = `translate(0px, 0px) rotate(${selectedItem?.rotation ?? 0}deg)`;
                    refresh();
                  }
                }}
                onDragStart={(e) => {
                  if (e.clientY < e.target.getBoundingClientRect().top) {
                    // disable drag if clicking outside of the box
                    // checking currently only top side of moveable
                    e.stopDrag();
                    return;
                  }
                  setFrame(val => ({
                    translate: [0, 0], rotate: val.rotate,
                  }));
                }}
                onDrag={e => {
                  setFrame(val => ({
                    translate: e.beforeTranslate, rotate: val.rotate,
                  }));
                  e.target.style.transform = `translate(${e.beforeTranslate[0]}px, ${e.beforeTranslate[1]}px) rotate(${selectedItem?.rotation ?? 0}deg)`;
                }}
              />}
            </Paper>
          </Box>
        </Grid>
        {selectedItem && <Grid sx={{
          backgroundColor: '#1e1e1e', p: 1, width: '352px',
        }}>
          <SimpleBar style={{
            maxHeight: 'calc(100vh - 70px)', paddingRight: '15px',
          }} autoHide={false}>
            <Settings model={selectedItem} onUpdate={(path, value) => {
              handleItemChange(path, value);
              refresh();
            }}>
              <AccordionFont
                disableExample
                label='Font'
                accordionId='customFont'
                model={selectedItem.font}
                open={accordion}
                onClick={(val) => typeof val === 'string' && setAccordion(val)}
                onChange={(val) => {
                  handleItemChange('font', val);
                }}/>
              <Divider variant='middle'/>
              <HTMLDialog model={selectedItem.html} onChange={value =>  handleItemChange('html', value ?? '')}/>
              <CSSDialog model={selectedItem.css} onChange={value =>  handleItemChange('css', value ?? '')}/>
            </Settings>
          </SimpleBar>
        </Grid>}
      </Grid>
    </DialogContent>
    <Divider/>
  </>);
};