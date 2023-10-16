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
  CropFreeTwoTone, DeleteTwoTone, DragIndicatorTwoTone,
  ExpandMore, FitScreenTwoTone, ZoomInTwoTone, ZoomOutTwoTone,
} from '@mui/icons-material';
import ContentCopyTwoToneIcon from '@mui/icons-material/ContentCopyTwoTone';
import { LoadingButton } from '@mui/lab';
import {
  Accordion, AccordionDetails, AccordionSummary,
  Box, Chip, DialogContent, Divider, FormControl,
  Grid, IconButton, InputLabel, MenuItem, Paper, Select, Stack,
  TextField, Tooltip, Typography,
} from '@mui/material';
import orange from '@mui/material/colors/orange';
import { Alerts } from '@sogebot/backend/src/database/entity/overlay';
import {
  Atom, useAtom, useAtomValue,
} from 'jotai';
import {
  capitalize, cloneDeep, set,
} from 'lodash';
import React from 'react';
import Moveable from 'react-moveable';
import {
  useKey, useMouse, usePreviousImmediate,
} from 'rooks';
import shortid from 'shortid';
import SimpleBar from 'simplebar-react';

import { AccordionAnimationIn } from './Accordion/AnimationIn';
import { AccordionAnimationOut } from './Accordion/AnimationOut';
import { AccordionAnimationText } from './Accordion/AnimationText';
import { AccordionDuration } from './Accordion/Duration';
import { AccordionFilter } from './Accordion/Filter';
import AlertSettingsAudio from './Audio';
import AlertSettingsCustom from './Custom';
import NewAlertDialog from './Dialog/newAlertDialog';
import NewComponentDialog from './Dialog/newComponentDialog';
import AlertSettingsGallery from './Gallery';
import { alertList } from './src/alertList';
import {
  anItems,
  anSelectedAlert, anSelectedAlertId, anSelectedAlertVariant, anSelectedVariantId,
} from './src/atoms';
import { rules } from './src/rules';
import AlertSettingsText from './Text';
import AlertSettingsTTS from './TTS';
import { useTranslation } from '../../../../hooks/useTranslation';
import theme from '../../../../theme';
import { DimensionViewable, setZoomDimensionViewable } from '../../../Moveable/DimensionViewable';
import { RemoveButton, setZoomRemoveButton } from '../../../Moveable/RemoveButton';
import { AlertItemAudio } from '../../../Overlay/AlertItemAudio';
import { AlertItemCustom } from '../../../Overlay/AlertItemCustom';
import { AlertItemImage } from '../../../Overlay/AlertItemImage';
import { AlertItemText } from '../../../Overlay/AlertItemText';
import { anSelectedItemOpts } from '../../atoms';

let isPositionChanging = false;
document.addEventListener('mouseup', () => isPositionChanging = false);

type Props = {
  canvas: { width: number, height: number },
  onUpdate: (value: Alerts['items']) => void;
};

function SortableAccordion(props: {
  name: string,
  id: string,
  isDragging: boolean,
  onClick?: () => void,
  isSelected?: boolean,
  onSelect?: (id: string | null) => void,
  onUpdate?: (value: Alerts['items'][number]['items'][number]) => void
  onDelete?: () => void
  item?: Alerts['items'][number]['items'][number],
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: props.id });

  const onUpdate = (item: Alerts['items'][number]['items'][number]) => {
    if (props.onUpdate) {
      props.onUpdate(item);
    }
  };

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity:   props.isDragging ? 0 : 1,
    transition,
  };

  return (
    <Accordion
      expanded={props.isSelected ?? false}
      sx={{
        userSelect: 'none',
        transition: 'all 200ms',
        width:      '100%',
        border:     `1px solid ${props.isSelected ? orange[700] : 'transparent'}`,
        '&:hover':  { borderColor: orange[700] },
      }}
      ref={setNodeRef} style={style} {...attributes}
    >
      <AccordionSummary expandIcon={<Box
        sx={{
          display:                            'flex',
          '.Mui-expanded & > .dragIndicator': { opacity: 0 },
          '& > .dragIndicator':               {
            opacity: 1, display: 'inline-block', transition: 'opacity 200ms',
          },
          '.Mui-expanded & > .expandIndicator': { transform: 'rotate(180deg) !important' },
          '& > .expandIndicator':               { transition: 'transform 200ms' },
        }}
      >
        <DragIndicatorTwoTone {...listeners} className='dragIndicator'/>
        <ExpandMore className='expandIndicator' />
      </Box>} sx={{ '& .Mui-expanded': { transform: 'rotate(0deg) !important' } }}
      onClick={() => props.onSelect && (!props.isSelected ? props.onSelect(props.id) : props.onSelect(null))}
      >
        <Typography sx={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', width: '100%',
        }}>
          {props.name.toUpperCase()}
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        {props.item?.type === 'tts' && <AlertSettingsTTS model={props.item} onChange={onUpdate} onDelete={props.onDelete ?? function() {}}/>}
        {props.item?.type === 'text' && <AlertSettingsText model={props.item} onChange={onUpdate} onDelete={props.onDelete ?? function() {}}/>}
        {props.item?.type === 'custom' && <AlertSettingsCustom model={props.item} onChange={onUpdate} onDelete={props.onDelete ?? function() {}}/>}
        {props.item?.type === 'gallery' && <AlertSettingsGallery model={props.item} onChange={onUpdate} onDelete={props.onDelete ?? function() {}}/>}
        {props.item?.type === 'audio' && <AlertSettingsAudio model={props.item} onChange={onUpdate} onDelete={props.onDelete ?? function() {}}/>}
      </AccordionDetails>
    </Accordion>
  );
}

export const AlertSettingsGroup: React.FC<Props> = ({ canvas, onUpdate }) => {
  const [ selectedAlertId, setSelectedAlertId ] = useAtom(anSelectedAlertId);
  const [ selectedAlert, setSelectedAlert ] = useAtom(anSelectedAlert);
  const [ selectedVariantId, setSelectedVariant ] = useAtom(anSelectedVariantId);
  const [ accordionId, setAccordionId ] = React.useState('');
  const [ activeId, setActiveId ] = React.useState<null | string>(null);
  const { translate } = useTranslation();

  const model = useAtomValue(anItems);
  const parent = useAtomValue(anSelectedItemOpts as Atom<Alerts>);

  const [ animationTest, setAnimationTest ] = React.useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: { active: any; over: any; }) {
    console.debug('alerts::items::dragend', event);

    const { active, over } = event;
    setActiveId(null);

    if (active === null || !over) {
      return;
    }
    if (active.id !== over.id) {
      if (!selectedAlert) {
        return;
      }
      const alertUpdate = cloneDeep(selectedAlert);
      alertUpdate.items = arrayMove(alertUpdate.items, alertUpdate.items.findIndex(o => o.id === active.id), alertUpdate.items.findIndex(o => o.id === over.id));
      const update = cloneDeep(model);
      update[update.findIndex(o => o.id === selectedAlert.id)] = alertUpdate;
      setItems(update);
    }
  }
  function handleDragStart(event: { active: any; }) {
    const { active } = event;
    console.debug('alerts::items::dragstart', active);
    setActiveId(active.id);
  }

  const toggleSelectedAlert = (id: string) => {
    setSelectedVariant(null);
    setSelectedAlertId(selectedAlertId === id ? '' : id);
  };

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

  const addNewComponent = (value: any) => {
    setItems(it => {
      const update = cloneDeep(it);
      let updateItem = [];
      if (selectedVariantId) {
        updateItem = update.find(o => o.id === selectedAlertId)!.variants.find(o => o.id === selectedVariantId)!.items;
      } else {
        updateItem = update.find(o => o.id === selectedAlertId)!.items;
      }
      updateItem.push(value);
      return update;
    });
  };

  const addNewAlert = (type: keyof typeof alertList) => {
    console.log('alert', 'Adding new alert', type);
    const update = cloneDeep(items) as Alerts['items'];
    const it = alertList[type].item;

    const calculateAlignY = (height: number, itemType: string) => {
      switch(itemType) {
        case 'text':
          return canvas.height - canvas.height / 2.25;
        case 'text2':
          return canvas.height - canvas.height / 2.6;
        case 'audio':
        case 'tts':
          return 20;
        default:
          return canvas.height / 2 - height / 1.25;
      }
    };

    const calculateWidth = (width: number, itemType: string) => {
      switch(itemType) {
        case 'text':
          return canvas.width - canvas.width / 3;
        case 'audio':
          return 20;
        default:
          // by default no change
          return width;
      }
    };

    const newAlert: Alerts['items'][number] = {
      id:                   shortid(),
      hooks:                [...it.hooks as any],
      name:                 it.name,
      weight:               it.weight,
      filter:               it.filter,
      alertDuration:        it.alertDuration,
      animationInDuration:  it.animationInDuration,
      animationIn:          it.animationIn as any,
      animationOutDuration: it.animationOutDuration,
      animationOut:         it.animationOut as any,
      animationText:        it.animationText as any,
      animationTextOptions: it.animationTextOptions as any,
      variants:             [...it.variants as any],
      items:                [...it.items.map(o => ({
        ...(o as any),
        id:     shortid.generate(),
        width:  calculateWidth(o.width, o.type),
        alignX: canvas.width / 2 - calculateWidth(o.width, o.type) / 2,
        alignY: calculateAlignY(o.height, o.type === 'text' && o.globalFont === 'globalFont2' ? 'text2' : o.type),
      }))],
    };
    update.push(newAlert);
    setItems(update);
  };

  const [ items, setItems ] = React.useState<Alerts['items']>(model);
  React.useEffect(() => {
    onUpdate(items);
  }, [ items ]);

  React.useEffect(() => {
    setSelectedAlert(items.find(o => o.id === selectedAlertId) ?? null);
  }, [ selectedAlertId, items ]);

  React.useEffect(() => {
    // items to have snaps
    const els: any[] = [];
    for (const i of items) {
      els.push(document.getElementById(i.id));
    }
    setElementGuidelines(els);

    // set bounds
    if (boundsEnabled) {
      setBounds({
        left:   0,
        top:    0,
        right:  canvas.width,
        bottom: canvas.height,
      });
    } else {
      setBounds(undefined);
    }
  }, [moveableId, items, boundsEnabled]);

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

  const handleItemDelete = React.useCallback(() => {
    setItems((val) => {
      const updatedItems = cloneDeep(val);
      for (const alert of updatedItems) {
        alert.items = alert.items.filter(o => o.id !== moveableId);
      }
      return updatedItems;
    });
  }, [moveableId]);

  const handleAlertChange = React.useCallback((changes: Record<string, any>) => {
    setItems(m => {
      const update = cloneDeep(m);
      for (const alert of update) {
        if (alert.id === selectedAlertId) {
          if (selectedVariantId) {
            for (const [path, value] of Object.entries(changes)) {
              set(alert.variants.find(o => o.id === selectedVariantId)!,path,value);
            }
          } else {
            for (const [path, value] of Object.entries(changes)) {
              set(alert,path,value);
            }
          }
        }
      }
      return update;
    });
  }, [selectedAlertId, selectedVariantId]);

  const clone = (item: Alerts['items'][number] | Alerts['items'][number]['variants'][number]) => {
    const variant: Alerts['items'][number]['variants'][number] = cloneDeep(item);
    // generate new ids
    variant.id = shortid();
    for (const it of variant.items) {
      it.id = shortid();
    }
    'variants' in variant && delete variant.variants;
    console.log('Cloning', item);

    setItems((val) => {
      const updatedItems = cloneDeep(val);
      for (const alert of updatedItems) {
        if (alert.id === selectedAlertId) {
          alert.variants.push(variant);
        }
      }
      return updatedItems;
    });
  };

  const deleteVariant = (item: Alerts['items'][number]['variants'][number]) => {
    setItems((val) => {
      const updatedItems = cloneDeep(val);
      for (const alert of updatedItems) {
        if (alert.id === selectedAlertId) {
          alert.variants = alert.variants.filter(o => o.id !== item.id);
        }
      }
      return updatedItems;
    });
  };

  const selectedAlertVariant = useAtomValue(anSelectedAlertVariant);
  React.useEffect(() =>{
    if (!selectedAlertVariant) {
      setSelectedVariant(null);
    }
  }, [ selectedAlertVariant ]);
  const selectedItem = selectedAlertVariant?.items.find(o => o.id === moveableId);

  React.useEffect(() => {
    if (selectedAlertVariant) {
      if (!selectedAlertVariant.items.find(o => o.id === moveableId)) {
        // deselect if moveable is not part of selected alert
        setMoveableId(null);
      }

      for (const item of selectedAlertVariant.items) {
        // set styles
        const element = document.getElementById(item.id);
        if (!element) {
          continue;
        }

        element.style.width = `${item.width}px`;
        element.style.height = `${item.height}px`;
        element.style.left = `${item.alignX}px`;
        element.style.top = `${item.alignY}px`;
        element.style.transform = `rotate(${ item.rotation ?? 0 }deg)`;
      }
    }
  }, [ selectedAlertVariant ]);

  const handleItemReplace = React.useCallback((value: Alerts['items'][number]['items'][number]) => {
    setItems((val) => {
      const updatedItems = cloneDeep(val);
      for (const updatedItem of updatedItems) {
        let itemToUpdate;
        if (!selectedVariantId) {
          for (const variantItem of updatedItem.items) {
            if (variantItem.id !== value.id) {
              continue;
            } else {
              itemToUpdate = variantItem;
              break;
            }
          }
        } else {
          const variants = updatedItem.variants!;
          for (const variantItem of variants) {
            for (const variantUpdatedItem of variantItem.items) {
              if (variantUpdatedItem.id !== value.id) {
                continue;
              } else {
                itemToUpdate = variantUpdatedItem;
                break;
              }
            }
          }
        }
        if (itemToUpdate) {
          for (const valueKey of Object.keys(value)) {
            set(itemToUpdate, valueKey, value[valueKey as keyof typeof value]);
          }
        }
      }
      return updatedItems;
    });
  }, [moveableId, selectedVariantId]);

  const handleItemChange = React.useCallback((changes: { [path: string]: any }) => {
    setItems((val) => {
      const updatedItems = cloneDeep(val);
      if (selectedItem) {
        let itemToUpdate;
        for (const updatedItem of updatedItems) {
          if (itemToUpdate) {
            break;
          }
          if (!selectedVariantId) {
            itemToUpdate = updatedItem.items.find(o => o.id === selectedItem.id);
          } else {
            const variant = updatedItem.variants.find(o => o.id === selectedVariantId);
            if (!variant) {
              continue;
            }

            itemToUpdate = variant.items.find(o => o.id === selectedItem.id);
          }
        }
        if (itemToUpdate) {
          for (const [path, value] of Object.entries(changes)) {
            set(itemToUpdate, path, value);
          }
        }
      }
      return updatedItems;
    });
  }, [moveableId, selectedVariantId]);

  useKey(['Delete'], () => {
    const focusedElement = document.activeElement;
    if (focusedElement?.tagName === 'INPUT'
    || focusedElement?.tagName === 'TEXTAREA'
    || focusedElement?.tagName === 'SELECT') {
      console.log('Del key disabled, because we are focusing input');
      return;
    }

    if (selectedItem) {
      handleItemDelete();
      setMoveableId(null);
    }
  }, { when: !!selectedItem });

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
              {items.map((o) => <Paper key={o.id} variant='outlined' onClick={() => toggleSelectedAlert(o.id)}
                sx={{
                  userSelect:      'none',
                  transition:      'border 300ms',
                  width:           '100%',
                  p:               1,
                  '&:hover':       { borderColor: orange[700] },
                  backgroundColor: selectedAlertId === o.id ? `${theme.palette.primary.main}55` : undefined,
                  color:           selectedAlertId === o.id ? '#fff' : undefined,
                }}
              >
                <Stack spacing={0.2}>
                  <Typography sx={{ width: '100%' }}>
                    {o.name}
                  </Typography>
                  <Box>
                    {o.hooks.map(hook => <Chip sx={{ mr: 0.5 }} size='small' label={hook} key={hook}/>)}
                  </Box>
                </Stack>
              </Paper>)}

              <NewAlertDialog onAdd={addNewAlert}/>
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
                height:          `${canvas.height}px`,
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
              {(selectedAlertVariant && selectedAlert) && selectedAlertVariant.items.map(o => <Paper
                id={o.id}
                key={`${o.id}`}
                onMouseDown={(e) => {
                  if (e.button !== 1) {
                    e.stopPropagation();
                    e.preventDefault();
                  }
                }}
                onClick={(e) => {
                  setMoveableId(o.id);
                  e.stopPropagation();
                  e.preventDefault();
                }}
                elevation={0}
                sx={{
                  position:        'absolute',
                  backgroundColor: `transparent`,
                  border:          `0 !important`,
                  userSelect:      'none',
                  cursor:          moveableId === o.id ? 'move' : 'pointer',
                }}
              >
                <Box key={`${o.id}-${JSON.stringify(o)}` /* force refresh on opts change */} sx={{
                  width: '100%', height: '100%',
                }}>
                  {o.type === 'audio' && <AlertItemAudio height={o.height} width={o.width} id={o.id} item={o} groupId={''} active={animationTest} variant={selectedAlert}/>}
                  {o.type === 'gallery' && <AlertItemImage height={o.height} width={o.width} id={o.id} item={o} groupId={''} variant={selectedAlert} active={animationTest}/>}
                  {o.type === 'text' && <AlertItemText parent={parent} height={o.height} width={o.width} id={o.id} item={o} groupId={''} variant={selectedAlert} active={animationTest}/>}
                  {o.type === 'custom' && <AlertItemCustom parent={parent} height={o.height} width={o.width} id={o.id} item={o} groupId={''}/>}
                </Box>
              </Paper>)}
              {moveableId && <Moveable
                key={`${moveableId}-${snapEnabled}`}
                ables={[DimensionViewable, RemoveButton]}
                props={{
                  dimensionViewable: true, removeButton: true,
                }}
                target={moveableRef}
                resizable={true}
                origin={false}
                bounds={bounds}
                onDelete={() => {
                  handleItemDelete();
                  setMoveableId(null);
                }}
                horizontalGuidelines={[canvas.height / 4, canvas.height / 2, (canvas.height / 4) * 3]}
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
                onRotate={e => {
                  e.target.style.transform = e.transform;
                }}
                onRotateEnd={(e) => {
                  const rotate = Number(e.target.style.transform.replace('rotate(', '').replace('deg)', ''));
                  if (selectedItem) {
                    handleItemChange({ 'rotation': rotate });
                  }
                }}
                onResizeEnd={e => {
                  if (selectedItem) {
                    handleItemChange({
                      'width':  Math.round((e.target as any).offsetWidth),
                      'height': Math.round((e.target as any).offsetHeight),
                      'alignX': Math.round(selectedItem.alignX + frame.translate[0]),
                      'alignY': Math.round(selectedItem.alignY + frame.translate[1]),
                    });
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
                onDragEnd={() => {
                  if (selectedItem) {
                    handleItemChange({
                      'alignX': Math.round(selectedItem.alignX + frame.translate[0]),
                      'alignY': Math.round(selectedItem.alignY + frame.translate[1]),
                    });
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
        {(selectedAlert && selectedAlertVariant) && <Grid sx={{
          backgroundColor: '#1e1e1e', p: 1, width: `400px`,
        }}>
          <SimpleBar style={{
            maxHeight: 'calc(100vh - 70px)', paddingRight: '15px',
          }} autoHide={false}>
            <TextField
              fullWidth
              variant="filled"
              required
              value={selectedAlert.name}
              label={translate('registry.alerts.name.name')}
              onChange={(event) => handleAlertChange({ 'name': event.target.value })}
            />
            <FormControl fullWidth variant="filled" >
              <InputLabel id="hook-select-label">Hook</InputLabel>
              <Select
                label={'Hooks'}
                labelId="hook-select-label"
                onChange={(event) => handleAlertChange({ hooks: [event.target.value as any] })}
                value={selectedAlert.hooks}
              >
                {[
                  'follow', 'sub', 'resub', 'subgift', 'subcommunitygift', 'raid',
                  'custom', 'promo', 'tip', 'cheer', 'rewardredeem',
                ].map(o => (<MenuItem key={o} value={o}>{capitalize(o)}</MenuItem>))}
              </Select>
            </FormControl>
            <Divider variant='middle' sx={{ my: 1 }}>Variants</Divider>
            <Paper sx={{
              cursor:          'pointer',
              backgroundColor: selectedVariantId === null ? `${theme.palette.primary.main}55` : undefined,
              color:           selectedVariantId === null ? '#fff' : undefined,
              px:              1,
              py:              0.5,
            }} variant='outlined' onClick={() => setSelectedVariant(null)}>
              <Stack direction='row' sx={{ alignItems: 'center' }}>
                <Typography sx={{ width: '100%' }}>Main</Typography>
                <IconButton onClick={() => clone(selectedAlert)}><ContentCopyTwoToneIcon/></IconButton>
              </Stack>
            </Paper>
            {selectedAlert.variants.map((k, idx) =>
              <Paper sx={{
                cursor:          'pointer',
                backgroundColor: selectedVariantId === k.id ? `${theme.palette.primary.main}55` : undefined,
                color:           selectedVariantId === k.id ? '#fff' : undefined,
                px:              1,
                py:              0.5,
              }} key={k.id} variant='outlined' onClick={() => setSelectedVariant(k.id)}>
                <Stack direction='row' sx={{ alignItems: 'center' }}>
                  <Typography sx={{ width: '100%' }}>Variant {idx + 1}</Typography>
                  <IconButton color='error' onClick={() => deleteVariant(k)}><DeleteTwoTone/></IconButton>
                  <IconButton onClick={() => clone(k)}><ContentCopyTwoToneIcon/></IconButton>
                </Stack>
              </Paper>,
            )}

            <Divider variant='middle' sx={{ my: 1 }}>Settings</Divider>

            <AccordionDuration
              label={translate('registry.alerts.variant.name')}
              model={selectedAlertVariant.weight}
              open={accordionId}
              onOpenChange={setAccordionId} onChange={(val) => {
                handleAlertChange({ 'weight': val });
              }}
              helperText={'Higher weight means higher chance of being picked.'}
              hideEndAdornment
              customLabelDetails={<>{selectedAlertVariant.weight}</>}/>

            <AccordionFilter
              model={selectedAlertVariant.filter}
              open={accordionId}
              rules={rules(selectedAlert.hooks[0])}
              onOpenChange={setAccordionId} onChange={(filter) => {
                handleAlertChange({ filter });
              }}/>

            <AccordionDuration model={selectedAlertVariant.alertDuration} open={accordionId} onOpenChange={setAccordionId} onChange={(val) => {
              handleAlertChange({ 'alertDuration': val });
            }}/>

            <AccordionAnimationIn model={selectedAlertVariant} open={accordionId} onOpenChange={setAccordionId} onChange={(val) => {
              handleAlertChange({
                'animationIn':         val.animationIn,
                'animationInDuration': val.animationInDuration,
              });
            }}/>
            <AccordionAnimationOut model={selectedAlertVariant} open={accordionId} onOpenChange={setAccordionId} onChange={(val) => {
              handleAlertChange({
                'animationOut':         val.animationOut,
                'animationOutDuration': val.animationOutDuration,
              });
            }}/>
            <AccordionAnimationText model={selectedAlertVariant} open={accordionId} onOpenChange={setAccordionId} onChange={(val) => {
              handleAlertChange({
                'animationText':        val.animationText,
                'animationTextOptions': val.animationTextOptions,
              });
            }}/>

            <Divider variant='middle' sx={{ my: 1 }}>Components</Divider>

            <LoadingButton onClick={() => {
              setAnimationTest(true);
              setTimeout(() => {
                setAnimationTest(false);
              }, selectedAlert.alertDuration);
            }} loading={animationTest}>Animation & sound test</LoadingButton>

            <Box key={`${selectedVariantId}-${selectedAlertId}`}>
              <DndContext
                sensors={sensors}
                modifiers={[restrictToVerticalAxis]}
                onDragEnd={handleDragEnd}
                onDragStart={handleDragStart}
              >
                <SortableContext
                  items={selectedAlertVariant!.items}
                  strategy={rectSortingStrategy}
                >
                  {selectedAlertVariant.items.map((o) => <SortableAccordion
                    name={o.type}
                    id={o.id}
                    item={o}
                    onSelect={setMoveableId}
                    onDelete={() => {
                      handleItemDelete();
                      setMoveableId(null);
                    }}
                    onUpdate={(value) => {
                      handleItemReplace(value);
                    }}
                    isSelected={selectedItem?.id === o.id}
                    isDragging={o.id === activeId} />)}
                </SortableContext>
                <DragOverlay>
                  {activeId ? (
                    <SortableAccordion
                      isDragging={false}
                      id={activeId}
                      key={activeId}
                      name={selectedAlertVariant.items.find(it => it.id === activeId)?.type ?? 'unknown'}/>
                  ) : null }
                </DragOverlay>
              </DndContext>
            </Box>

            <NewComponentDialog onAdd={addNewComponent}/>
          </SimpleBar>
        </Grid>}
      </Grid>
    </DialogContent>
    <Divider/>
  </>);
};