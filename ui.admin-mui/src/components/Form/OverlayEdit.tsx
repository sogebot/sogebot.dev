import {
  BorderInnerTwoTone, BorderStyleTwoTone,
  CropFreeTwoTone, FitScreenTwoTone, ZoomInTwoTone, ZoomOutTwoTone,
} from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Box, Button, DialogContent, Divider, Fade, Unstable_Grid2 as Grid, IconButton, LinearProgress, Paper, TextField, Tooltip,
} from '@mui/material';
import { Overlay } from '@sogebot/backend/dest/database/entity/overlay';
import { flatten } from '@sogebot/backend/dest/helpers/flatten';
import { setDefaultOpts } from '@sogebot/backend/dest/helpers/overlaysDefaultValues';
import { set } from 'lodash';
import { useSnackbar } from 'notistack';
import React from 'react';
import Moveable from 'react-moveable';
import { useNavigate, useParams } from 'react-router-dom';
import { useMouse, usePreviousImmediate } from 'rooks';
import shortid from 'shortid';
import SimpleBar from 'simplebar-react';

import { AlertsRegistrySettings } from './Overlay/AlertsRegistrySettings';
import { Canvas } from './Overlay/Canvas';
import { ChatSettings } from './Overlay/ChatSettings';
import { ClipsCarouselSettings } from './Overlay/ClipsCarouselSettings';
import { CountdownSettings } from './Overlay/CountdownSettings';
import { EmotesFireworksSettings } from './Overlay/EmotesFireworksSettings';
import { EmotesSettings } from './Overlay/EmotesSettings';
import { EventlistSettings } from './Overlay/EventlistSettings';
import { HTMLSettings } from './Overlay/HTMLSettings';
import { Layers } from './Overlay/Layers';
import { PollsSettings } from './Overlay/PollsSettings';
import { RestAPI } from './Overlay/REST';
import { Settings } from './Overlay/Settings';
import { StopwatchSettings } from './Overlay/StopwatchSettings';
import { TTSSettings } from './Overlay/TTSSettings';
import { UrlSettings } from './Overlay/UrlSettings';
import { WordcloudSettings } from './Overlay/WordcloudSettings';
import { getSocket } from '../../helpers/socket';
import { useValidator } from '../../hooks/useValidator';
import theme from '../../theme';
import { loadFont } from '../Accordion/Font';
import { DimensionViewable, setZoomDimensionViewable } from '../Moveable/DimensionViewable';
import { RemoveButton, setZoomRemoveButton } from '../Moveable/RemoveButton';
import { AlertItem } from '../Overlay/AlertItem';
import { ChatItem } from '../Overlay/ChatItem';
import { ClipsCarouselItem } from '../Overlay/ClipsCarouselItem';
import { CountdownItem } from '../Overlay/CountdownItem';
import { EmotesFireworksItem } from '../Overlay/EmotesFireworksItem';
import { EmotesItem } from '../Overlay/EmotesItem';
import { EventlistItem } from '../Overlay/EventlistItem';
import { ExportDialog } from '../Overlay/ExportDialog';
import { HTMLItem } from '../Overlay/HTMLItem';
import { HypeTrainItem } from '../Overlay/HypeTrainItem';
import { ImportDialog } from '../Overlay/ImportDialog';
import { PollsItem } from '../Overlay/PollsItem';
import { StopwatchItem } from '../Overlay/StopwatchItem';
import { TTSItem } from '../Overlay/TTSItem';
import { UrlItem } from '../Overlay/UrlItem';
import { WordcloudItem } from '../Overlay/WordcloudItem';

const emptyItem: Partial<Overlay> = {
  canvas: {
    height: 1080,
    width:  1920,
  },
  name:  '',
  items: [],
};

let isPositionChanging = false;
document.addEventListener('mouseup', () => isPositionChanging = false);

export const OverlayEdit: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [ moveableId, setMoveableId ] = React.useState<null | string>(null);
  const moveableRef = React.useMemo(() => document.getElementById(moveableId!), [ moveableId ]);
  const [elementGuidelines, setElementGuidelines] = React.useState<Element[]>([]);
  const [ key, setKey ] = React.useState(Date.now());

  const { x, y } = useMouse();
  const mouseX = usePreviousImmediate(x);
  const mouseY = usePreviousImmediate(y);

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

  const [ item, setItem ] = React.useState<Overlay>(new Overlay(emptyItem));

  const selectedItem = React.useMemo(() => {
    return item.items.find(o => o.id.replace(/-/g, '') === moveableId);
  }, [item, moveableId]);

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
      } as Overlay;
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
        right:  item.canvas.width,
        bottom: item.canvas.height,
      });
    } else {
      setBounds(undefined);
    }
  }, [moveableId, item, boundsEnabled]);

  const [ loading, setLoading ] = React.useState(true);
  const [ saving, setSaving ] = React.useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const { reset, haveErrors, validate } = useValidator();

  React.useEffect(() => {
    if (id) {
      setLoading(true);
      getSocket('/registries/overlays').emit('generic::getOne', id, (err, data) => {
        if (err) {
          return console.error(err);
        }
        if (!data) {
          enqueueSnackbar('Overlay with id ' + id + ' not found.');
          navigate(`/registry/overlays?server=${JSON.parse(localStorage.server)}`);
        } else {
          setItem(data);
          setLoading(false);
        }
      });
    } else {
      setItem(new Overlay(emptyItem));
      setLoading(false);
    }
    reset();
  }, [id, reset, enqueueSnackbar, navigate]);

  React.useEffect(() => {
    if (!loading && item) {
      // load fonts
      for (const items of item.items) {
        const flattenItem = flatten(items);
        Object.keys(flattenItem).filter(o => o.toLowerCase().includes('font') && o.toLowerCase().includes('family')).forEach((k) => {
          loadFont(flattenItem[k]);
        });
      }
    }
  }, [item, loading]);

  React.useEffect(() => {
    if (!loading && item) {
      validate(Overlay, item);
    }
  }, [item, loading, validate]);

  const handleClose = () => {
    navigate(`/registry/overlays?server=${JSON.parse(localStorage.server)}`);
  };

  const handleSave = React.useCallback(() => {
    setSaving(true);
    getSocket('/registries/overlays').emit('generic::save', item, (err, data) => {
      setSaving(false);
      if (err || !data) {
        enqueueSnackbar('Something went wrong during save. Check Chrome logs for more errors.', { variant: 'error' });
        return console.error(err);
      }
      enqueueSnackbar('Saved successfully.', { variant: 'success' });
      if (id !== data.id) {
        navigate(`/registry/overlays/edit/${data.id}?server=${JSON.parse(localStorage.server)}`);
      }
    });
  }, [id, item, navigate]);

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

  return(<>
    {loading && <>
      <LinearProgress />
      <DialogContent sx={{
        p: 0, overflowX: 'hidden',
      }}/>
    </>}
    <Fade in={!loading} mountOnEnter unmountOnExit>
      { item && <DialogContent sx={{
        p: 0, overflowX: 'hidden',
      }}>
        <Grid container spacing={2} sx={{
          height: '100%', m: 0,
        }}>
          <Grid xs={3} sx={{
            my: 0, pr: '0px',
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
              <ExportDialog model={item}/>
              <ImportDialog onImport={(items) => setItem(it => ({
                ...it,
                items: [
                  ...it.items, ...items,
                ],
              }) as Overlay)}/>
            </Box>

            <SimpleBar style={{ maxHeight: 'calc(100vh - 189px)' }} autoHide={false}>
              <TextField
                sx={{ mb: 0.5 }}
                label={'Name'}
                fullWidth
                value={item.name}
                onChange={(ev) => {
                  setItem({
                    ...item, name: ev.currentTarget.value,
                  } as Overlay);
                }}
              />
              <Canvas model={item.canvas} onUpdate={canvas => setItem(i => ({
                ...i, canvas,
              } as Overlay ))}/>
              <Layers
                items={item.items}
                moveableId={moveableId}
                setMoveableId={setMoveableId} onUpdate={(value) => setItem(o => ({
                  ...o, items: value,
                } as Overlay))}
                onAdd={(typeId) => {
                  setItem(o => {
                    const itemId = shortid();
                    const newItem = {
                      id:        itemId,
                      alignX:    0,
                      alignY:    0,
                      height:    200,
                      isVisible: true,
                      name:      '',
                      rotation:  0,
                      width:     200,
                      opts:      setDefaultOpts({}, typeId),
                    } as Overlay['items'][number];

                    setTimeout(() => {
                      setMoveableId(itemId);
                    }, 10);

                    return {
                      ...o, items: [...o.items, newItem],
                    } as Overlay;
                  });
                }}
              />

              { selectedItem && <Settings model={selectedItem} onUpdate={(path, value) => {
                handleItemChange(path, value);
                setTimeout(() => refresh(), 100);
              }}>
                <Box sx={{ pt: 3 }}>
                  {selectedItem.opts.typeId === 'clipscarousel' && <ClipsCarouselSettings model={selectedItem.opts} onUpdate={(val) => {
                    handleItemChange('opts', val);
                  }}/>}
                  {selectedItem.opts.typeId === 'eventlist' && <EventlistSettings model={selectedItem.opts} onUpdate={(val) => {
                    handleItemChange('opts', val);
                  }}/>}
                  {selectedItem.opts.typeId === 'countdown' && <CountdownSettings model={selectedItem.opts} onUpdate={(val) => {
                    handleItemChange('opts', val);
                  }}/>}
                  {selectedItem.opts.typeId === 'stopwatch' && <StopwatchSettings model={selectedItem.opts} onUpdate={(val) => {
                    handleItemChange('opts', val);
                  }}/>}
                  {selectedItem.opts.typeId === 'emotesfireworks' && <EmotesFireworksSettings model={selectedItem.opts} onUpdate={(val) => {
                    handleItemChange('opts', val);
                  }}/>}
                  {selectedItem.opts.typeId === 'emotes' && <EmotesSettings model={selectedItem.opts} onUpdate={(val) => {
                    handleItemChange('opts', val);
                  }}/>}
                  {selectedItem.opts.typeId === 'html' && <HTMLSettings model={selectedItem.opts} onUpdate={(val) => {
                    handleItemChange('opts', val);
                  }}/>}
                  {selectedItem.opts.typeId === 'polls' && <PollsSettings model={selectedItem.opts} onUpdate={(val) => {
                    handleItemChange('opts', val);
                  }}/>}
                  {selectedItem.opts.typeId === 'tts' && <TTSSettings model={selectedItem.opts} onUpdate={(val) => {
                    handleItemChange('opts', val);
                  }}/>}
                  {selectedItem.opts.typeId === 'chat' && <ChatSettings model={selectedItem.opts} onUpdate={(val) => {
                    handleItemChange('opts', val);
                  }}/>}
                  {selectedItem.opts.typeId === 'alertsRegistry' && <AlertsRegistrySettings model={selectedItem.opts} onUpdate={(val) => {
                    handleItemChange('opts', val);
                  }}/>}
                  {selectedItem.opts.typeId === 'url' && <UrlSettings model={selectedItem.opts} onUpdate={(val) => {
                    handleItemChange('opts', val);
                  }}/>}
                  {selectedItem.opts.typeId === 'wordcloud' && <WordcloudSettings model={selectedItem.opts} onUpdate={(val) => {
                    handleItemChange('opts', val);
                  }}/>}
                </Box>
              </Settings>
              }

              {
                selectedItem
                  && ['countdown', 'stopwatch'].includes(selectedItem.opts.typeId)
                  && <RestAPI id={selectedItem.id} opts={selectedItem.opts}/>
              }
            </SimpleBar>
          </Grid>
          <Grid xs sx={{ height: '100%' }}>
            <Box id="container"
              onClick={() => setMoveableId(null)}
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
                  height:          `${item.canvas.height}px`,
                  width:           `${item.canvas.width}px`,
                  position:        'absolute',
                  border:          `${1/zoom}px dotted white !important`,
                  transformOrigin: '0 0',
                  transform:       `scale(${zoom}) translate(${position[0]}px, ${position[1]}px)`,
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
                    zIndex:          moveableId === o.id.replace(/-/g, '') ? '2': undefined,
                    opacity:         moveableId === o.id.replace(/-/g, '') || (moveableId == null && o.isVisible) ? '1': '0.2',
                    position:        'absolute',
                    width:           `${o.width}px`,
                    height:          `${o.height}px`,
                    backgroundColor: o.opts.typeId === 'url' && o.opts.url.length > 0 ? 'transparent' : '#424242',
                    border:          `${1 / zoom}px solid #626262 !important`,
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
                  {o.opts.typeId === 'alertsRegistry' && <AlertItem item={o.opts} groupId={id!} id={o.id} selected={selectedItem?.id === o.id}/>}
                  {o.opts.typeId === 'countdown' && <CountdownItem item={o.opts} groupId={id!} id={o.id} selected={selectedItem?.id === o.id}/>}
                  {o.opts.typeId === 'stopwatch' && <StopwatchItem item={o.opts} groupId={id!} id={o.id} selected={selectedItem?.id === o.id}/>}
                  {o.opts.typeId === 'chat' && <ChatItem item={o.opts} groupId={id!} id={o.id} selected={selectedItem?.id === o.id}/>}
                  {o.opts.typeId === 'tts' && <TTSItem item={o.opts} groupId={id!} id={o.id} selected={selectedItem?.id === o.id}/>}
                  {o.opts.typeId === 'polls' && <PollsItem item={o.opts} groupId={id!} id={o.id} selected={selectedItem?.id === o.id}/>}
                  {o.opts.typeId === 'emotesfireworks' && <EmotesFireworksItem item={o.opts} groupId={id!} id={o.id} selected={selectedItem?.id === o.id}/>}
                  {o.opts.typeId === 'emotes' && <EmotesItem item={o.opts} groupId={id!} id={o.id} selected={selectedItem?.id === o.id}/>}
                  {o.opts.typeId === 'clipscarousel' && <ClipsCarouselItem item={o.opts} groupId={id!} id={o.id}/>}
                  {o.opts.typeId === 'eventlist' && <EventlistItem item={o.opts} groupId={id!} id={o.id}/>}
                  {o.opts.typeId === 'html' && <HTMLItem item={o.opts} groupId={id!} id={o.id}/>}
                  {o.opts.typeId === 'hypetrain' && <HypeTrainItem item={o.opts} groupId={id!} id={o.id} selected={selectedItem?.id === o.id}/>}
                  {o.opts.typeId === 'url' && <UrlItem item={o.opts} groupId={id!} id={o.id}/>}
                  {o.opts.typeId === 'wordcloud' && <WordcloudItem item={o.opts} groupId={id!} id={o.id}/>}
                  <Box sx={{
                    position: 'absolute', bottom: 0, fontSize: '10px', textAlign: 'left', left: 0, zIndex: 1,
                  }}>
                    {o.name && o.name.length > 0
                      ? <>
                        {o.name} <br/><small>{o.opts.typeId}</small>
                      </>
                      : o.opts.typeId}

                  </Box>
                </Paper>)}
                {moveableId && <Moveable
                  key={`${moveableId}-${key}-${snapEnabled}`}
                  aria-type={selectedItem?.opts.typeId}
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
                  horizontalGuidelines={[item.canvas.height / 4, item.canvas.height / 2, (item.canvas.height / 4) * 3]}
                  verticalGuidelines={[item.canvas.width / 4, item.canvas.width / 2, (item.canvas.width / 4) * 3]}
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
                    console.log({ e });
                    setFrame(val => ({
                      translate: e.beforeTranslate, rotate: val.rotate,
                    }));
                    e.target.style.transform = `translate(${e.beforeTranslate[0]}px, ${e.beforeTranslate[1]}px) rotate(${selectedItem?.rotation ?? 0}deg)`;
                  }}
                />}
              </Paper>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>}
    </Fade>
    <Divider/>
    <Box sx={{ p: 1 }}>
      <Grid container sx={{ height: '100%' }} justifyContent={'end'} spacing={1}>
        <Grid>
          <Button sx={{ width: 150 }} onClick={handleClose}>Close</Button>
        </Grid>
        <Grid>
          <LoadingButton variant='contained' color='primary' sx={{ width: 150 }} onClick={handleSave} loading={saving} disabled={haveErrors || loading}>Save</LoadingButton>
        </Grid>
      </Grid>
    </Box>
  </>);
};