import {
  DragDropContext, Draggable, Droppable,
} from '@hello-pangea/dnd';
import { mdiResize, mdiTarget } from '@mdi/js';
import Icon from '@mdi/react';
import {
  AddTwoTone,
  ExpandMoreTwoTone, VisibilityOffTwoTone, VisibilityTwoTone,
} from '@mui/icons-material';
import {
  Accordion, AccordionDetails, AccordionSummary, IconButton, List, ListItemButton, ListItemText, Menu, MenuItem, Stack, Typography,
} from '@mui/material';
import { Overlay } from '@sogebot/backend/dest/database/entity/overlay';
import { capitalize, cloneDeep } from 'lodash';
import PopupState, { bindMenu, bindTrigger } from 'material-ui-popup-state';
import React from 'react';

type Props = {
  items: Overlay['items'];
  onUpdate: (value: Overlay['items']) => void;
  onAdd: (value: Overlay['items'][number]['opts']['typeId']) => void;
  moveableId: null | string;
  setMoveableId: React.Dispatch<React.SetStateAction<string | null>>;
};

export const Layers: React.FC<Props> = ({ items, moveableId, setMoveableId, onUpdate, onAdd }) => {
  const [ open, setOpen ] = React.useState(true);

  const onDragEndHandler = React.useCallback((value: any) => {
    if (!value.destination) {
      return;
    }
    const update = cloneDeep(items);

    const destIdx = value.destination.index;
    const fromIdx = value.source.index;
    const fromItem = update[fromIdx];

    if (fromIdx === destIdx || !fromItem) {
      return;
    }

    // remove fromIdx
    update.splice(fromIdx, 1);

    // insert into destIdx
    update.splice(destIdx, 0, fromItem);

    onUpdate(update);
  }, [ items ]);

  const changeVisibility = (idx: number, value: boolean) => {
    const update = cloneDeep(items);
    update[idx].isVisible = value;
    onUpdate(update);
  };

  return <Accordion expanded={open}>
    <AccordionSummary
      expandIcon={<ExpandMoreTwoTone />}
      onClick={() => {
        setOpen(o => !o);
      }}
      aria-controls="panel1a-content"
      id="panel1a-header"
    >
      <Stack direction={'row'} sx={{
        width:          '100%',
        justifyContent: 'space-between',
        alignItems:     'center',
        height:         '24px',
      }}>
        <Typography>Layers</Typography>

        <PopupState variant="popover" popupId="demo-popup-menu">
          {(popupState) => (
            <React.Fragment>
              <IconButton {...bindTrigger(popupState)} onClick={(ev) => {
                ev.stopPropagation();
                ev.preventDefault();
                bindTrigger(popupState).onClick(ev);
              }}>
                <AddTwoTone/>
              </IconButton>
              <Menu {...bindMenu(popupState)} onClose={() => {
                setOpen(o => !o);
                popupState.close();
              }}>
                {[
                  'alertsRegistry', 'chat', 'clipscarousel', 'countdown', 'emotesfireworks', 'emotes', 'eventlist',
                  'html', 'hypetrain', 'marathon', 'polls', 'stopwatch', 'stats', 'tts', 'url', 'wordcloud', 'obswebsocket',
                ].map(o => <MenuItem key={o} onClick={(ev) => {
                  ev.stopPropagation();
                  ev.preventDefault();
                  onAdd(o as Overlay['items'][number]['opts']['typeId']);
                  popupState.close();
                }}>{capitalize(o)}</MenuItem>)}
              </Menu>
            </React.Fragment>
          )}
        </PopupState>
      </Stack>
    </AccordionSummary>
    <AccordionDetails>
      <List dense sx={{ p: 0 }}>
        <DragDropContext onDragEnd={onDragEndHandler}>
          <Droppable droppableId="droppable">
            {(droppableProvided) => (<>
              <Stack ref={droppableProvided.innerRef}>
                {items.map((item, idx) => (
                  <Draggable key={item.id} draggableId={item.id} index={idx}>
                    {(draggableProvided) => (
                      <ListItemButton
                        key={item.id}
                        selected={moveableId === item.id.replace(/-/g, '')}
                        onClick={() => item.id.replace(/-/g, '') === moveableId ? setMoveableId(null) : setMoveableId(item.id.replace(/-/g, ''))}
                        ref={draggableProvided.innerRef}
                        {...draggableProvided.dragHandleProps}
                        {...draggableProvided.draggableProps}>
                        <ListItemText primary={<Stack direction='row' alignItems='center' sx={{
                          textTransform: 'uppercase',
                          '& small':     { fontSize: '8px !important' },
                        }}>
                          <div>
                            {item.name && item.name.length > 0
                              ? <>
                                {item.name} <small>{item.opts.typeId}</small>
                              </>
                              : item.opts.typeId}
                          </div>
                        </Stack>}
                        secondary={<small>
                          <Icon path={mdiResize} size={'12px'} style={{
                            marginRight: '2px', position: 'relative', top: '2px',
                          }} />{item.width}x{item.height}
                          <Icon path={mdiTarget} size={'14px'} style={{
                            marginLeft: '5px', position: 'relative', top: '2px',
                          }} />{item.alignX}x{item.alignY}
                        </small>}/>
                        <IconButton edge="end" onClick={(ev) => {
                          changeVisibility(idx, !item.isVisible);
                          ev.stopPropagation();
                        }}>
                          {item.isVisible ? <VisibilityTwoTone/> : <VisibilityOffTwoTone/>}
                        </IconButton>
                      </ListItemButton>
                    )}
                  </Draggable>
                ))}
              </Stack>
              {droppableProvided.placeholder}
            </>
            )}
          </Droppable>
        </DragDropContext>
      </List>
    </AccordionDetails>
  </Accordion>;
};