import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import { mdiResize, mdiTarget } from '@mdi/js';
import Icon from '@mdi/react';
import { AddTwoTone, ExpandMoreTwoTone, VisibilityOffTwoTone, VisibilityTwoTone } from '@mui/icons-material';
import { Accordion, AccordionDetails, AccordionSummary, Button, Card, CardActionArea, CardContent, Dialog, DialogActions, DialogContent, Grid, IconButton, List, ListItemButton, ListItemText, Stack, Typography } from '@mui/material';
import { Overlay } from '@sogebot/backend/dest/database/entity/overlay';
import { cloneDeep } from 'lodash';
import React from 'react';

type Props = {
  items:         Overlay['items'];
  onUpdate:      (value: Overlay['items']) => void;
  onAdd:         (value: Overlay['items'][number]['opts']['typeId']) => void;
  moveableId:    null | string;
  setMoveableId: React.Dispatch<React.SetStateAction<string | null>>;
};

const layers = {
  alerts: {
    title:       'Alerts',
    description: 'Add alerts for your stream follows, raids, donations and more.',
  },
  alertsRegistry: {
    title:       'Alert from registry (deprecated)',
    description: 'Add alert defined in registry',
  },
  chat: {
    title:       'Chat',
    description: 'Chat overlay, available in horizontal, vertical and niconico formats.',
  },
  clips: {
    title:       'Clips',
    description: 'Show clips created in chat during stream by !clip command or event.',
  },
  clipscarousel: {
    title:       'Clips Carousel',
    description: 'Show clips created in defined timeframe, useful for intros/outros.',
  },
  credits: {
    title:       'Outro Credits',
    description: 'Customizable credits. Usually used in outro, shows games played, followers, subs, tips, clips created during current stream and more.',
  },
  carousel: {
    title:       'Image Carousel',
    description: 'Image carousel to show list of images one by one.',
  },
  countdown: {
    title:       'Countdown',
    description: 'Countdown counter.',
  },
  emotescombo: {
    title:       'Emotes Combo',
    description: 'Shows your emotes combo status.',
  },
  emotesfireworks: {
    title:       'Emotes Fireworks',
    description: 'Enables to show fireworks of emotes in overlay',
  },
  emotesexplode: {
    title:       'Emotes Explode',
    description: 'Enables to show explostion of emotes in overlay',
  },
  emotes: {
    title:       'Emotes',
    description: 'Shows emotes used in chat in different styles: facebook, fade, zoom.',
  },
  eventlist: {
    title:       'Event List',
    description: 'Add list of events during your streams. Resubs, follows, subs and so.',
  },
  html: {
    title:       'HTML',
    description: 'Add custom made HTML page into overlay.',
  },
  hypetrain: {
    title:       'Hype Train',
    description: 'Shows train during hype train.',
  },
  marathon: {
    title:       'Marathon',
    description: 'Adds marathon timer.',
  },
  polls: {
    title:       'Polls',
    description: 'Adds poll overlay for Twitch Polls',
  },
  stopwatch: {
    title:       'Stopwatch',
    description: 'Adds stopwatch timer',
  },
  stats: {
    title:       'Stats',
    description: 'Shows stats of your stream. Uptime, viewer count, followers count and more.',
  },
  tts: {
    title:       'TTS',
    description: 'Enables usage of !tts command.',
  },
  url: {
    title:       'URL',
    description: 'Adds custom webpage by URL. Note that not all pages are supporting <iframe>.',
  },
  wordcloud: {
    title:       'Word Cloud',
    description: 'Shows cloud of used words.',
  },
  obswebsocket: {
    title:       'OBS Websocket',
    description: 'Enables Websocket connection of bot to your OBS.',
  },
  randomizer: {
    title:       'Randomizer',
    description: 'Shows wheel of fortune and randomizers used by !wof command.',
  },
  goal: {
    title:       'Goal',
    description: 'Shows your defined goals.',
  },
};

export const Layers: React.FC<Props> = ({ items, moveableId, setMoveableId, onUpdate, onAdd }) => {
  const [ open, setOpen ] = React.useState(true);
  const [ openDialog, setOpenDialog ] = React.useState(false);

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

  const closeDlg = () => setOpenDialog(false);

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
        <IconButton onClick={(ev) => {
          if (ev) {
            ev.preventDefault();
            ev.stopPropagation();
          }
          setOpenDialog(true);
        }}>
          <AddTwoTone/>
        </IconButton>

        <Dialog open={openDialog} maxWidth="lg" fullWidth>
          <DialogContent>
            <Grid container spacing={1}>
              {Object.entries(layers).map(([key, val]) => <Grid item xs={3} key={key}>
                <Card>
                  <CardActionArea onClick={(ev) => {
                    ev.stopPropagation();
                    ev.preventDefault();
                    onAdd(key as Overlay['items'][number]['opts']['typeId']);
                    closeDlg();
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
            <Button sx={{ width: 150 }} onClick={closeDlg}>Close</Button>
          </DialogActions>
        </Dialog>
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