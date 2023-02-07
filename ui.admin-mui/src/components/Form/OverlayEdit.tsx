import {
  BorderInnerTwoTone, BorderStyleTwoTone,
  CropFreeTwoTone, FitScreenTwoTone, ZoomInTwoTone, ZoomOutTwoTone,
} from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Box, Button, CircularProgress, DialogContent, Divider, Fade, Unstable_Grid2 as Grid, IconButton, Paper, Tooltip,
} from '@mui/material';
import { Overlay } from '@sogebot/backend/dest/database/entity/overlay';
import { flatten } from '@sogebot/backend/dest/helpers/flatten';
import { validateOrReject } from 'class-validator';
import { merge, set } from 'lodash';
import { useSnackbar } from 'notistack';
import React from 'react';
import Moveable from 'react-moveable';
import { useNavigate, useParams } from 'react-router-dom';
import { useMouse, usePreviousImmediate } from 'rooks';
import SimpleBar from 'simplebar-react';

import { ClipsCarouselSettings } from './Overlay/ClipsCarouselSettings';
import { CountdownSettings } from './Overlay/CountdownSettings';
import { EventlistSettings } from './Overlay/EventlistSettings';
import { Layers } from './Overlay/Layers';
import { Settings } from './Overlay/Settings';
import { UrlSettings } from './Overlay/UrlSettings';
import { WordcloudSettings } from './Overlay/WordcloudSettings';
import { getSocket } from '../../helpers/socket';
import { useValidator } from '../../hooks/useValidator';
import theme from '../../theme';
import { loadFont } from '../Accordion/Font';
import { DimensionViewable, setZoomDimensionViewable } from '../Moveable/DimensionViewable';
import { RemoveButton, setZoomRemoveButton } from '../Moveable/RemoveButton';
import { ClipsCarouselItem } from '../Overlay/ClipsCarouselItem';
import { CountdownItem } from '../Overlay/CountdownItem';
import { EventlistItem } from '../Overlay/EventlistItem';
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
  const [frame, setFrame] = React.useState({ translate: [0,0]  });

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
  const [boundsEnabled, setBoundsEnabled] = React.useState(true);
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
  const { reset, setErrors, haveErrors } = useValidator();

  React.useEffect(() => {
    if (id) {
      setLoading(true);
      getSocket('/registries/overlays').emit('generic::getOne', id, (err, data) => {
        if (err) {
          return console.error(err);
        }
        if (!data) {
          enqueueSnackbar('Overlay with id ' + id + ' not found.');
          navigate(`/registry/overlays?server=${JSON.parse(sessionStorage.server)}`);
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
      const toCheck = new Overlay();
      merge(toCheck, item);
      validateOrReject(toCheck)
        .then(() => setErrors(null))
        .catch(setErrors);
    }
  }, [item, loading, setErrors]);

  const handleClose = () => {
    navigate(`/registry/overlays?server=${JSON.parse(sessionStorage.server)}`);
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
        navigate(`/registry/overlays/edit/${data.id}?server=${JSON.parse(sessionStorage.server)}`);
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
    {loading
      && <Grid
        sx={{ pt: 10 }}
        container
        direction="column"
        justifyContent="flex-start"
        alignItems="center"
      ><CircularProgress color="inherit" /></Grid>}
    <Fade in={!loading}>
      { item && <DialogContent sx={{
        p: 0, overflowX: 'hidden',
      }}>
        <Grid container spacing={2} sx={{
          height: '100%', m: 0,
        }}>
          <Grid xs={3} sx={{ my: 0 }}>
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

            <SimpleBar style={{ maxHeight: 'calc(100vh - 189px)' }} autoHide={false}>
              <Layers
                items={item.items}
                moveableId={moveableId}
                setMoveableId={setMoveableId} onUpdate={(value) => setItem(o => ({
                  ...o, items: value,
                } as Overlay))}
              />

              { selectedItem && <Settings model={selectedItem} onUpdate={(path, value) => {
                handleItemChange(path, value);
                setTimeout(() => refresh(), 100);
              }}>
                <Box sx={{ pt: 3 }}>
                  {selectedItem.opts.typeId === 'countdown' && <CountdownSettings model={selectedItem.opts} onUpdate={(val) => {
                    handleItemChange('opts', val);
                  }}/>}
                  {selectedItem.opts.typeId === 'clipscarousel' && <ClipsCarouselSettings model={selectedItem.opts} onUpdate={(val) => {
                    handleItemChange('opts', val);
                  }}/>}
                  {selectedItem.opts.typeId === 'eventlist' && <EventlistSettings model={selectedItem.opts} onUpdate={(val) => {
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
                    backgroundColor: '#424242',
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
                  }}
                >
                  {o.opts.typeId === 'countdown' && <CountdownItem item={o.opts} groupId={id!} id={o.id}/>}
                  {o.opts.typeId === 'clipscarousel' && <ClipsCarouselItem item={o.opts} groupId={id!} id={o.id}/>}
                  {o.opts.typeId === 'eventlist' && <EventlistItem item={o.opts} groupId={id!} id={o.id}/>}
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
                  throttleDrag={0}
                  startDragRotate={0}
                  throttleDragRotate={0}
                  padding={{
                    'left': 0,'top': 0,'right': 0,'bottom': 0,
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
                    e.target.style.transform = `translate(${beforeTranslate[0]}px, ${beforeTranslate[1]}px)`;
                  }}
                  onDragEnd={(e) => {
                    if (selectedItem) {
                      handleItemChange('alignX', Math.round(selectedItem.alignX + frame.translate[0]));
                      handleItemChange('alignY', Math.round(selectedItem.alignY + frame.translate[1]));
                      e.target.style.transform = `translate(0px, 0px)`;
                      refresh();
                    }
                  }}
                  onDragStart={() => setFrame({ translate: [0, 0] })}
                  onDrag={e => {
                    setFrame({ translate: e.beforeTranslate });
                    e.target.style.transform = `translate(${e.beforeTranslate[0]}px, ${e.beforeTranslate[1]}px)`;
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
          <LoadingButton variant='contained' color='primary' sx={{ width: 150 }} onClick={handleSave} loading={saving} disabled={haveErrors}>Save</LoadingButton>
        </Grid>
      </Grid>
    </Box>
  </>);
};