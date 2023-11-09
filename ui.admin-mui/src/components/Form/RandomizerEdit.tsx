import { DragDropContext, Draggable, DraggableProvidedDragHandleProps, Droppable, OnDragEndResponder } from '@hello-pangea/dnd';
import { DeleteTwoTone, DragHandleTwoTone, ExpandMoreTwoTone, LinkOffTwoTone, LinkTwoTone } from '@mui/icons-material';import { LoadingButton } from '@mui/lab';
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, Card, DialogActions, DialogContent, Divider, FormControl, Unstable_Grid2 as Grid, IconButton, InputLabel, LinearProgress, MenuItem, Select, Stack, TextField, Typography } from '@mui/material';
import { Randomizer } from '@sogebot/backend/dest/database/entity/randomizer';
import defaultPermissions from '@sogebot/backend/src/helpers/permissions/defaultPermissions';
import axios from 'axios';
import { cloneDeep, debounce, isEqual, orderBy } from 'lodash';
import { MuiColorInput } from 'mui-color-input';
import { useSnackbar } from 'notistack';
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { v4 } from 'uuid';

import { getContrastColor, getRandomColor } from '../../colors';
import getAccessToken from '../../getAccessToken';
import { usePermissions } from '../../hooks/usePermissions';
import { useTranslation } from '../../hooks/useTranslation';
import { useValidator } from '../../hooks/useValidator';
import { isHexColor } from '../../validators';
import { AccordionFont } from '../Accordion/Font';
import { AccordionPosition } from '../Accordion/Position';
import { AccordionTTS } from '../Accordion/TTS';

export const generateItems = (items: any[], generatedItems: Required<Randomizer['items']> = []) => {
  const beforeItems = cloneDeep(orderBy(items, 'order'));
  items = cloneDeep(orderBy(items, 'order'));
  items = items.filter(o => o.numOfDuplicates > 0);

  const countGroupItems = (item2: Randomizer['items'][number], count = 0): number => {
    const child = items.find(o => o.groupId === item2.id);
    if (child) {
      return countGroupItems(child, count + 1);
    } else {
      return count;
    }
  };
  const haveMinimalSpacing = (item2: any) => {
    const lastIdx = generatedItems.map(o => o.name).lastIndexOf(item2.name);
    const currentIdx = generatedItems.length;
    return lastIdx === -1 || lastIdx + item2.minimalSpacing + countGroupItems(item2) < currentIdx;
  };
  const addGroupItems = (item2: Randomizer['items'][number], _generatedItems: Randomizer['items'][]) => {
    const child = items.find(o => o.groupId === item2.id);
    if (child) {
      _generatedItems.push(child);
      addGroupItems(child, _generatedItems);
    }
  };

  for (const item2 of items) {
    if (item2.numOfDuplicates > 0 && haveMinimalSpacing(item2) && !item2.groupId /* is not grouped or is parent of group */) {
      generatedItems.push(item2);
      item2.numOfDuplicates--;
      addGroupItems(item2, generatedItems as any);
    }
  }

  // run next iteration if some items are still there and that any change was made
  // so we don't have infinite loop when e.g. minimalspacing is not satisfied
  if (items.filter(o => o.numOfDuplicates > 0).length > 0 && !isEqual(items.filter(o => o.numOfDuplicates > 0), beforeItems)) {
    generateItems(items, generatedItems);
  }
  return generatedItems;
};

const emptyItem = Object.assign(new Randomizer(), {
  name:           '',
  command:        '',
  items:          [],
  createdAt:      new Date().toISOString(),
  permissionId:   defaultPermissions.CASTERS,
  isShown:        false,
  shouldPlayTick: false,
  tickVolume:     1,
  type:           'simple',
  widgetOrder:    -1,
  tts:            {
    enabled: false,
    voice:   '',
    pitch:   1,
    volume:  0.5,
    rate:    1,
  },
  position: {
    x:       50,
    y:       50,
    anchorX: 'middle',
    anchorY: 'middle',
  },
  customizationFont: {
    family:      'Cabin Condensed',
    weight:      500,
    size:        16,
    borderColor: '#000000',
    borderPx:    1,
    shadow:      [],
  },
});

const ItemGrid: React.FC<{
  item:             Randomizer['items'][number],
  dragHandleProps?: DraggableProvidedDragHandleProps | null,
  previousId?:      string,
  onChange:         (value: Randomizer['items'][number]) => void
  onDelete?:        () => void
}> = ({
  item,
  dragHandleProps,
  previousId,
  onChange,
  onDelete,
}) => {
  return <Grid container>
    {
      dragHandleProps
        ? <Grid width={50} {...dragHandleProps} sx={{
          alignSelf: 'center', textAlign: 'center', cursor: 'grab',
        }}><DragHandleTwoTone/></Grid>
        : <Grid width={50}/>
    }

    <Grid sx={{ flexGrow: 1 }}>
      <TextField
        InputProps={{
          startAdornment: <MuiColorInput
            sx={{
              width:                   '24px',
              mr:                      '10px',
              '.MuiInput-root:before': { borderBottom: '0 !important' },
              '.MuiInput-root:after':  { borderBottom: '0 !important' },
            }}
            isAlphaHidden
            format="hex"
            variant='standard'
            value={isHexColor(item.color) ? item.color : '#111111'}
            onChange={(val) => onChange({
              ...item, color: val,
            })}
          />,
        }}
        variant='standard'
        fullWidth
        id={`item-${item.id}`}
        value={item.name}
        onChange={(ev) => onChange({
          ...item, name: ev.currentTarget.value,
        })}
      />
    </Grid>
    <Grid width={100}>
      {item.groupId === null && <TextField
        sx={{
          position: 'relative', top: '8px',
        }}
        variant='standard'
        fullWidth
        inputProps={{
          min: '1', type: 'number',
        }}
        value={item.numOfDuplicates}
        onChange={(ev) => onChange({
          ...item, numOfDuplicates: Number(ev.currentTarget.value),
        })}
      />}
    </Grid>
    <Grid width={100}>
      {item.groupId === null && <TextField
        sx={{
          position: 'relative', top: '8px',
        }}
        variant='standard'
        fullWidth
        inputProps={{
          min: '1', type: 'number',
        }}
        value={item.minimalSpacing}
        onChange={(ev) => onChange({
          ...item, minimalSpacing: Number(ev.currentTarget.value),
        })}
      />}
    </Grid>
    <Grid width={50} sx={{
      alignSelf: 'center', textAlign: 'center',
    }}>
      {previousId !== undefined && (item.groupId === null
        ? <IconButton onClick={() => onChange({
          ...item, groupId: previousId,
        })}><LinkTwoTone/></IconButton>
        : <IconButton onClick={() => onChange({
          ...item, groupId: null,
        })}><LinkOffTwoTone/></IconButton>
      )}
    </Grid>
    <Grid width={50} sx={{
      alignSelf: 'center', textAlign: 'center',
    }}>
      {(item.groupId === null && onDelete) && <IconButton color='error' onClick={onDelete}><DeleteTwoTone/></IconButton>}
    </Grid>
  </Grid>;
};

export const RandomizerEdit: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const { permissions } = usePermissions();
  const { translate } = useTranslation();
  const [ item, setItem ] = React.useState<Randomizer>(Object.assign(new Randomizer(), emptyItem));
  const [ loading, setLoading ] = React.useState(true);
  const [ saving, setSaving ] = React.useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const { propsError, reset, showErrors, validate, haveErrors } = useValidator();

  const [ emptyItemToAdd, setEmptyItemToAdd ] = React.useState<Randomizer['items'][number]>({
    id:              v4(),
    color:           getRandomColor(),
    groupId:         null,
    name:            '',
    order:           0,
    minimalSpacing:  1,
    numOfDuplicates: 1,
  });

  const [ expanded, setExpanded ] = React.useState('');

  const handleValueChange = <T extends keyof Randomizer>(key: T, value: Randomizer[T]) => {
    if (!item) {
      return;
    }
    const update = cloneDeep(item);
    update[key] = value;
    setItem(update);
  };

  const addNewOption = React.useCallback(debounce((newItem: typeof emptyItemToAdd) => {
    setItem((val) => ({
      ...val,
      items: [
        ...val.items, {
          ...newItem, order: val.items.length,
        }],
    }) as Randomizer);

    // set focus to element
    const interval = setInterval(() => {
      const el = document.getElementById(`item-${newItem.id}`);
      el?.focus();
      if (el === document.activeElement) {
        clearInterval(interval);
      }
    }, 1);

    setEmptyItemToAdd({
      id:              v4(),
      color:           getRandomColor(),
      groupId:         null,
      name:            '',
      order:           0,
      minimalSpacing:  1,
      numOfDuplicates: 1,
    });
  }, 250, { trailing: true }), []);

  React.useEffect(() => {
    if (emptyItemToAdd.name.trim() === '') {
      return;
    }
    addNewOption(emptyItemToAdd);

  }, [emptyItemToAdd]);

  const handleItemChange = React.useCallback((idx: number, value: Randomizer['items'][number]) => {
    const items = item.items || [];
    items[idx] = value;
    handleValueChange('items', items);
  }, [ item, handleValueChange ]);

  const handleItemDelete = React.useCallback((itemId: string) => {
    const items = item.items || [];
    const ids = [
      itemId,
      ...getChildren(itemId).map(o => o.id),
    ];
    handleValueChange('items', items.filter(o => !ids.includes(o.id)));
  }, [ item, handleValueChange ]);

  React.useEffect(() => {
    if (id) {
      setLoading(true);
      axios.get(`${JSON.parse(localStorage.server)}/api/registries/randomizer/${id}`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
        .then(({ data }) => {
          console.log(data.data);
          setItem(data.data ?? Object.assign(new Randomizer(), emptyItem));
          setLoading(false);
        });
    } else {
      setItem(Object.assign(new Randomizer(), emptyItem));
      setLoading(false);
    }
    reset();
  }, [id, reset]);

  React.useEffect(() => {
    if (!loading && item) {
      validate(Randomizer, item);
    }
  }, [item, loading, validate]);

  const handleClose = () => {
    navigate(`/registry/randomizer?server=${JSON.parse(localStorage.server)}`);
  };

  const handleSave = () => {
    setSaving(true);
    axios.post(`${JSON.parse(localStorage.server)}/api/registries/randomizer`,
      { ...item },
      { headers: { authorization: `Bearer ${getAccessToken()}` } })
      .then(({ data }) => {
        enqueueSnackbar('Randomizer saved.', { variant: 'success' });
        navigate(`/registry/randomizer/edit/${data.data.id}?server=${JSON.parse(localStorage.server)}`);
      })
      .catch(e => {
        showErrors(e.response.data.errors);
      })
      .finally(() => setSaving(false));
  };

  const getChildren = (parentId: string) => {
    const groupedChildren: Randomizer['items'][number][] = [];

    const children = item?.items.filter(o => o.groupId === parentId);
    if (children.length === 0) {
      return [];
    } else {
      // add children
      groupedChildren.push(...children);
      for (const child of children) {
        groupedChildren.push(...getChildren(child.id));
      }
      return groupedChildren;
    }
  };

  const onDragEndHandler = React.useCallback<OnDragEndResponder>((result) => {
    if (!result.destination || !item) {
      return;
    }

    const destIdx = result.destination?.index;
    const fromIdx = result.source.index;

    const itemsToMove = [
      item.items[fromIdx],
      ...getChildren(item.items[fromIdx].id),
    ];

    const update = cloneDeep(item);

    if (fromIdx > destIdx) {
      // delete items from original position
      update.items.splice(fromIdx, itemsToMove.length);
      // add new items
      update.items.splice(destIdx, 0, ...itemsToMove);
    } else {
      // add new items
      update.items.splice(destIdx + 1, 0, ...itemsToMove);
      // delete items from original position
      update.items.splice(fromIdx, itemsToMove.length);
    }

    // reorder
    update.items = update.items.map((o, idx) => ({
      ...o, order: idx,
    }));
    setItem(update);
    return;
  }, [ item.items ]);

  return(<>
    {loading && <><LinearProgress /><DialogContent></DialogContent></>}
    { (!loading && item) && <DialogContent>
      <Grid container spacing={1}>
        <Grid lg={6} md={12}>
          <Box
            component="form"
            sx={{ '& .MuiFormControl-root': { my: 0.5 } }}
            noValidate
            autoComplete="off"
          >
            <TextField
              fullWidth
              {...propsError('item')}
              variant="filled"
              required
              value={item?.name || ''}
              label={translate('registry.randomizer.form.name')}
              onChange={(event) => handleValueChange('name', event.target.value)}
            />

            <Stack direction='row' spacing={1}>
              <TextField
                fullWidth
                {...propsError('command')}
                variant="filled"
                required
                value={item?.command || ''}
                label={translate('registry.randomizer.form.command')}
                onChange={(event) => handleValueChange('command', event.target.value)}
              />
              <FormControl fullWidth variant="filled" >
                <InputLabel id="type-select-label">{translate('registry.randomizer.form.type')}</InputLabel>
                <Select
                  label={translate('registry.randomizer.form.type')}
                  labelId="type-select-label"
                  onChange={(event) => handleValueChange('type', event.target.value as 'simple' | 'wheelOfFortune' | 'tape')}
                  value={item?.type || 'simple'}
                >
                  <MenuItem value='simple'>{translate('registry.randomizer.form.simple')}</MenuItem>
                  <MenuItem value='wheelOfFortune'>{translate('registry.randomizer.form.wheelOfFortune')}</MenuItem>
                  <MenuItem value='tape'>{translate('registry.randomizer.form.tape')}</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth variant="filled" >
                <InputLabel id="permission-select-label">{translate('permissions')}</InputLabel>
                <Select
                  label={translate('permissions')}
                  labelId="permission-select-label"
                  onChange={(event) => handleValueChange('permissionId', event.target.value)}
                  value={item?.permissionId || defaultPermissions.VIEWERS}
                >
                  {permissions?.map(o => (<MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>))}
                </Select>
              </FormControl>
            </Stack>

            {item.position && <AccordionPosition
              model={item.position}
              disabled={item.type === 'wheelOfFortune'}
              open={expanded}
              onOpenChange={value => setExpanded(value)}
              onChange={(value) => handleValueChange('position', value)}
            />}

            {item.tts && <AccordionTTS
              model={item.tts}
              open={expanded}
              onOpenChange={value => setExpanded(value)}
              onChange={(value) => handleValueChange('tts', value)}
            />}

            {item.customizationFont && <AccordionFont
              model={item.customizationFont}
              open={expanded}
              onOpenChange={value => setExpanded(value)}
              onChange={(value) => handleValueChange('customizationFont', value)}
            />}

            <Accordion expanded={expanded === 'probability'}>
              <AccordionSummary
                expandIcon={<ExpandMoreTwoTone />}
                onClick={() => setExpanded('probability')}
                aria-controls="panel1a-content"
                id="panel1a-header"
              >
                <Typography>{ translate('registry.randomizer.form.probability') }</Typography>
              </AccordionSummary>
              <AccordionDetails>
                {(item.items || []).length === 0
                  ? translate('registry.randomizer.form.optionsAreEmpty')
                  :  Array.from(new Set(item.items.map(o => <div>
                    {o.name}
                    <strong style={{ paddingLeft: '5px' }}>{ Number((generateItems(item.items).filter(b => b.name === o.name).length / generateItems(item.items).length) * 100).toFixed(2) }%</strong>
                  </div>,
                  )))}
              </AccordionDetails>
            </Accordion>

            <Accordion expanded={expanded === 'preview'}>
              <AccordionSummary
                expandIcon={<ExpandMoreTwoTone />}
                onClick={() => setExpanded('preview')}
                aria-controls="panel1a-content"
                id="panel1a-header"
              >
                <Typography>{ translate('registry.randomizer.form.generatedOptionsPreview') }</Typography>
              </AccordionSummary>
              <AccordionDetails key={(item.items || []).map(o => o.id).join()}>
                {
                  generateItems(item.items).length === 0
                    ? translate('registry.randomizer.form.optionsAreEmpty')
                    : generateItems(item.items).map(o => <div key={`generated-${o.id}`} style={{
                      color: getContrastColor(o.color), backgroundColor: o.color, width: '100%',
                    }}>
                      {o.name}
                    </div>)
                }
              </AccordionDetails>
            </Accordion>
          </Box>
        </Grid>
        <Grid lg={6} md={12}>
          <Box
            component="form"
            sx={{
              '& .MuiFormControl-root': { my: 0.5 },
              width:                    '100%',
              mt:                       '2px !important',
            }}
            noValidate
            autoComplete="off"
          >
            <Card variant='outlined' sx={{ backgroundColor: '#1e1e1e' }}>
              <Typography gutterBottom sx={{
                pt: 2, pl: 2, pb: 2,
              }}>{ translate('registry.randomizer.form.options') }</Typography>

              <Grid container sx={{ borderBottom: '1px solid divider' }}>
                <Grid width={50}></Grid>
                <Grid sx={{ flexGrow: 1 }}><Typography variant='subtitle2'>{translate('registry.randomizer.form.name')}</Typography></Grid>
                <Grid width={100}><Typography variant='subtitle2'>{translate('registry.randomizer.form.numOfDuplicates')}</Typography></Grid>
                <Grid width={100}><Typography variant='subtitle2'>{translate('registry.randomizer.form.minimalSpacing')}</Typography></Grid>
                <Grid width={50}></Grid>
                <Grid width={50}></Grid>
              </Grid>

              <DragDropContext onDragEnd={onDragEndHandler}>
                <Droppable droppableId={'1'} direction="vertical">
                  {(provided) => {
                    return (
                      <Box ref={provided.innerRef} {...provided.droppableProps} sx={{ '& > div': { width: '100%' } }}>
                        {(item.items || []).map((row, idx) => row.groupId === null && <Draggable key={`row-${row.id}`} draggableId={row.id} index={idx}>
                          {(draggableProvided) => (
                            <div
                              ref={draggableProvided.innerRef}
                              {...draggableProvided.draggableProps}>
                              <ItemGrid
                                item={row}
                                key={`itemGrid-${row.id}`}
                                previousId={item.items[idx - 1]?.id}
                                onChange={(value) => handleItemChange(idx, value)}
                                dragHandleProps={draggableProvided.dragHandleProps}
                                onDelete={(() => handleItemDelete(row.id))}
                              />
                              {getChildren(row.id).map((val, idx2) => <ItemGrid
                                onChange={(value) => handleItemChange(idx + idx2 + 1, value)}
                                previousId={item.items[idx + idx2 + 1]?.id}
                                item={val}
                                key={`itemGridChild-${val.id}`}/>,
                              )}
                            </div>
                          )}
                        </Draggable>,
                        )}
                        {provided.placeholder}
                      </Box>
                    );
                  }}
                </Droppable>
                <Divider/>
                <ItemGrid
                  item={emptyItemToAdd}
                  key={`emptyItem-${emptyItemToAdd.id}`}
                  onChange={(value) => setEmptyItemToAdd(value)}
                />
              </DragDropContext>
            </Card>
          </Box>
        </Grid>
      </Grid>
    </DialogContent>}
    <DialogActions>
      <Grid container sx={{ height: '100%' }} justifyContent={'end'} spacing={1}>
        <Grid>
          <Button sx={{ width: 150 }} onClick={handleClose}>Close</Button>
        </Grid>
        <Grid>
          <LoadingButton variant='contained' color='primary' sx={{ width: 150 }} onClick={handleSave} loading={saving} disabled={haveErrors || loading}>Save</LoadingButton>
        </Grid>
      </Grid>
    </DialogActions>
  </>);
};