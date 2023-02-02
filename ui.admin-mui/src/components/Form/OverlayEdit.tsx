import { mdiResize, mdiTarget } from '@mdi/js';
import Icon from '@mdi/react';
import { SettingsTwoTone } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Avatar,
  Box, Button, CircularProgress, DialogContent, Divider, Fade, Unstable_Grid2 as Grid, IconButton, List, ListItemButton, ListItemText, Paper, Stack,
} from '@mui/material';
import { Overlay } from '@sogebot/backend/dest/database/entity/overlay';
import { validateOrReject } from 'class-validator';
import { merge, set } from 'lodash';
import { useSnackbar } from 'notistack';
import React from 'react';
import Moveable from 'react-moveable';
import { useNavigate, useParams } from 'react-router-dom';

import { getSocket } from '../../helpers/socket';
import { useValidator } from '../../hooks/useValidator';
import { DimensionViewable, setZoomDimensionViewable } from '../Moveable/DimensionViewable';
import { RemoveButton, setZoomRemoveButton } from '../Moveable/RemoveButton';

const emptyItem: Partial<Overlay> = {
  canvas: {
    height: 1080,
    width:  1920,
  },
  name:  '',
  items: [],
};

const generateColorFromString = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let colour = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF;
    colour += ('00' + value.toString(16)).substr(-2);
  }
  return colour;
};

export const OverlayEdit: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [ moveableId, setMoveableId ] = React.useState<null | string>(null);
  const moveableRef = React.useMemo(() => document.getElementById(moveableId!), [ moveableId ]);
  const [elementGuidelines, setElementGuidelines] = React.useState<Element[]>([]);
  const [ key, setKey ] = React.useState(Date.now());

  const containerRef = React.useRef<HTMLDivElement>();
  const [ zoom, setZoom ] = React.useState(1);

  const [frame, setFrame] = React.useState({ translate: [0,0]  });
  const [bounds, setBounds] = React.useState({
    top: 0, left: 0, right: 0, bottom: 0,
  });
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
    setBounds({
      left:   0,
      top:    0,
      right:  item.canvas.width,
      bottom: item.canvas.height,
    });
  }, [moveableId, item, zoom]);

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
      const toCheck = new Overlay();
      merge(toCheck, item);
      validateOrReject(toCheck)
        .then(() => setErrors(null))
        .catch(setErrors);
    }
  }, [item, loading, setErrors]);

  const handleClose = () => {
    navigate(`/registry/overlays?server=${JSON.parse(localStorage.server)}`);
  };

  const handleSave = () => {
    setSaving(true);
  };

  React.useEffect(() => {
    if (!loading && containerRef.current) {
      const zoomHeight = ((containerRef.current.getBoundingClientRect().height) / containerRef.current.scrollHeight);
      const zoomWidth = ((containerRef.current.getBoundingClientRect().width) / containerRef.current.scrollWidth);
      setZoom(Math.min(zoomHeight, zoomWidth));
      setZoomDimensionViewable(Math.min(zoomHeight, zoomWidth));
      setZoomRemoveButton(Math.min(zoomHeight, zoomWidth));
    }
  }, [loading, containerRef.current]);

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
      { item && <DialogContent>
        <Grid container spacing={2} sx={{ height: 'calc(100% - 10px)' }}>
          <Grid xs={3}>
            <Box>
              <List dense sx={{ p: 0 }}>
                {item.items.map(o => <ListItemButton
                  key={o.id}
                  selected={moveableId === o.id.replace(/-/g, '')}
                  onClick={() => setMoveableId(o.id.replace(/-/g, ''))}>
                  <ListItemText primary={<Stack direction='row' alignItems='center' sx={{
                    textTransform: 'uppercase',
                    '& small':     { fontSize: '8px !important' },
                  }}>
                    <Avatar sx={{
                      backgroundColor: generateColorFromString(o.id),
                      width:           24,
                      height:          24,
                      mr:              0.5,
                    }}>{' '}</Avatar>
                    <div>
                      {o.name && o.name.length > 0
                        ? <>
                          {o.name} <small>{o.opts.typeId}</small>
                        </>
                        : o.opts.typeId}
                    </div>
                  </Stack>}
                  secondary={<small>
                    <Icon path={mdiResize} size={'12px'} style={{
                      marginRight: '2px', position: 'relative', top: '2px',
                    }} />{o.width}x{o.height}
                    <Icon path={mdiTarget} size={'14px'} style={{
                      marginLeft: '5px', position: 'relative', top: '2px',
                    }} />{o.alignX}x{o.alignY}
                  </small>}/>
                  <IconButton edge="end"><SettingsTwoTone/></IconButton>
                </ListItemButton>,
                )}
              </List>
            </Box>
          </Grid>
          <Grid xs>
            <Box id="container" sx={{
              width: '100%', height: '100%', position: 'relative',
            }}  ref={containerRef}>
              <Paper
                onClick={() => setMoveableId(null)}
                sx={{
                  height:                 `${item.canvas.height}px`,
                  width:                  `${item.canvas.width}px`,
                  position:               'absolute',
                  transformOrigin:        '0 0',
                  transform:              `scale(${zoom})`,
                  '.moveable-size-value': { fontSize: `${14/zoom}px !important` },
                }}>
                {item.items.map(o => <Paper
                  id={o.id.replace(/-/g, '')}
                  key={o.id}
                  onClick={(e) => {
                    setMoveableId(o.id.replace(/-/g, ''));
                    e.stopPropagation();
                    e.preventDefault();
                  }}
                  sx={{
                    zIndex:           moveableId === o.id.replace(/-/g, '') ? '2': undefined,
                    opacity:          moveableId === o.id.replace(/-/g, '') || moveableId == null ? '1': '0.2',
                    position:         'absolute',
                    width:            `${o.width}px`,
                    height:           `${o.height}px`,
                    backgroundColor:  generateColorFromString(o.id),
                    left:             `${o.alignX}px`,
                    top:              `${o.alignY}px`,
                    fontWeight:       '900',
                    fontSize:         `${20  / zoom}px`,
                    textTransform:    'uppercase',
                    textFillColor:    'white',
                    WebkitTextStroke: `${1 / zoom}px black`,
                    alignItems:       'center',
                    justifyContent:   'center',
                    textAlign:        'center',
                    display:          'flex',
                    userSelect:       'none',
                    lineHeight:       `${12  / zoom}px`,
                    '& small':        { fontSize: `${12  / zoom}px` },
                  }}
                >
                  <div>
                    {o.name && o.name.length > 0
                      ? <>
                        {o.name} <br/><small>{o.opts.typeId}</small>
                      </>
                      : o.opts.typeId}
                  </div>
                </Paper>)}

                {moveableId && <Moveable
                  key={moveableId + key}
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
                  verticalGuidelines={[item.canvas.height / 4, item.canvas.height / 2, (item.canvas.height / 4) * 3]}
                  horizontalGuidelines={[item.canvas.width / 4, item.canvas.width / 2, (item.canvas.width / 4) * 3]}
                  elementGuidelines={elementGuidelines}
                  snappable={true}
                  snapThreshold={5}
                  isDisplaySnapDigit={true}
                  snapGap={true}
                  snapDirections={{
                    'top': true,'right': true,'bottom': true,'left': true, 'center': true, middle: true,
                  }}
                  elementSnapDirections={{
                    'top': true,'right': true,'bottom': true,'left': true, 'center': true, middle: true,
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
                      e.target.style.transform = `translate(0px, 0px)`;
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