import {
  DragDropContext, Draggable, DraggableProvidedDragHandleProps, Droppable,
} from '@hello-pangea/dnd';
import {
  DeleteTwoTone,
  DragHandleTwoTone, LinkOffTwoTone, LinkTwoTone,
} from '@mui/icons-material';import { LoadingButton } from '@mui/lab';
import {
  Box, Button, Card, CircularProgress, DialogContent, Divider, Fade, FormControl, Unstable_Grid2 as Grid, IconButton, InputLabel, MenuItem, Select, Stack, TextField, Typography,
} from '@mui/material';
import { Randomizer } from '@sogebot/backend/dest/database/entity/randomizer';
import defaultPermissions from '@sogebot/backend/src/helpers/permissions/defaultPermissions';
import axios from 'axios';
import { validateOrReject } from 'class-validator';
import { cloneDeep, merge } from 'lodash';
import { MuiColorInput } from 'mui-color-input';
import { useSnackbar } from 'notistack';
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import getAccessToken from '../../getAccessToken';
import { usePermissions } from '../../hooks/usePermissions';
import { useTranslation } from '../../hooks/useTranslation';
import { useValidator } from '../../hooks/useValidator';
import { isHexColor } from '../../validators';
import { AccordionFont } from '../Accordion/Font';
import { AccordionPosition } from '../Accordion/Position';
import { AccordionTTS } from '../Accordion/TTS';

const emptyItem: Partial<Randomizer> = {
  position: {
    x:       50,
    y:       50,
    anchorX: 'middle',
    anchorY: 'middle',
  },
  tts: {
    enabled: false,
    pitch:   1,
    rate:    1,
    voice:   '',
    volume:  0.5,
  },
};

const ItemGrid: React.FC<{
  item: Randomizer['items'][number],
  dragHandleProps?: DraggableProvidedDragHandleProps | null,
}> = ({
  item,
  dragHandleProps,
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
          />,
        }}
        variant='standard'
        fullWidth
        value={item.name}
      />
    </Grid>
    <Grid width={100}>
      <TextField
        sx={{
          position: 'relative', top: '8px',
        }}
        variant='standard'
        fullWidth
        inputProps={{
          min: '1', type: 'number',
        }}
        value={item.numOfDuplicates}
      />
    </Grid>
    <Grid width={100}>
      <TextField
        sx={{
          position: 'relative', top: '8px',
        }}
        variant='standard'
        fullWidth
        inputProps={{
          min: '1', type: 'number',
        }}
        value={item.minimalSpacing}
      />
    </Grid>
    <Grid width={50} sx={{
      alignSelf: 'center', textAlign: 'center',
    }}>
      {
        item.groupId === null
          ? <IconButton><LinkTwoTone/></IconButton>
          : <IconButton><LinkOffTwoTone/></IconButton>
      }
    </Grid>
    <Grid width={50} sx={{
      alignSelf: 'center', textAlign: 'center',
    }}><IconButton color='error'><DeleteTwoTone/></IconButton></Grid>
  </Grid>;
};

export const RandomizerEdit: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const { permissions } = usePermissions();
  const { translate } = useTranslation();
  const [ item, setItem ] = React.useState<Randomizer>(new Randomizer(emptyItem));
  const [ loading, setLoading ] = React.useState(true);
  const [ saving, setSaving ] = React.useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const { propsError, reset, setErrors, validate, haveErrors } = useValidator();

  const [ expanded, setExpanded ] = React.useState('');

  const handleValueChange = <T extends keyof Randomizer>(key: T, value: Randomizer[T]) => {
    if (!item) {
      return;
    }
    const update = cloneDeep(item);
    update[key] = value;
    setItem(update);
  };

  React.useEffect(() => {
    if (id) {
      setLoading(true);
      axios.get(`${JSON.parse(localStorage.server)}/api/registries/randomizer/${id}`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
        .then(({ data }) => {
          console.log(data.data);
          setItem(data.data ?? new Randomizer(emptyItem));
          setLoading(false);
        });
    } else {
      setItem(new Randomizer(emptyItem));
      setLoading(false);
    }
    reset();
  }, [id, reset]);

  React.useEffect(() => {
    if (!loading && item) {
      const toCheck = new Randomizer();
      merge(toCheck, item);
      validateOrReject(toCheck)
        .then(() => setErrors(null))
        .catch(setErrors);
    }
  }, [item, loading, setErrors]);

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
        navigate(`/registries/randomizer/edit/${data.data.id}?server=${JSON.parse(localStorage.server)}`);
      })
      .catch(e => {
        validate(e.response.data.errors);
      })
      .finally(() => setSaving(false));
  };

  const getChildren = (parentId: string) => {
    console.log({ parentId });
    const groupedChildren: Randomizer['items'][number][] = [];

    const children = item?.items.filter(o => o.groupId === parentId);
    console.log({ children });
    if (children.length === 0) {
      return [];
    } else {
      // add children
      groupedChildren.push(...children);
      for (const child of children) {
        groupedChildren.push(...getChildren(child.id));
      }
      console.log({ groupedChildren });
      return groupedChildren;
    }
  };

  const onDragEndHandler = React.useCallback((value: any) => {
    if (!value.destination || !item) {
      return;
    }

    console.log({ value });

    /*
    const update = cloneDeep(item);

    const responseId = value.draggableId;
    const ordered = orderBy(update.responses, 'order', 'asc');

    const destIdx = value.destination.index;
    const fromIdx = ordered.findIndex(m => m.id === responseId);
    const fromItem = ordered.find(m => m.id === responseId);

    if (fromIdx === destIdx || !fromItem) {
      return;
    }

    // remove fromIdx
    ordered.splice(fromIdx, 1);

    // insert into destIdx
    ordered.splice(destIdx, 0, fromItem);

    update.responses = ordered.map((o, idx) => ({
      ...o, order: idx,
    }));

    setItem(update);
    */
  }, [ item.items ]);

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
                onClick={value => typeof value === 'string' && setExpanded(value)}
                onChange={(value) => handleValueChange('position', value)}
              />}

              {item.tts && <AccordionTTS
                model={item.tts}
                open={expanded}
                onClick={value => typeof value === 'string' && setExpanded(value)}
                onChange={(value) => handleValueChange('tts', value)}
              />}

              {item.customizationFont && <AccordionFont
                model={item.customizationFont}
                open={expanded}
                onClick={value => typeof value === 'string' && setExpanded(value)}
                onChange={(value) => handleValueChange('customizationFont', value)}
              />}
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
                          {(item.items || []).filter(o => o.groupId === null).map((row, idx) => (
                            <Draggable key={row.id} draggableId={row.id} index={idx}>
                              {(draggableProvided) => (
                                <div
                                  ref={draggableProvided.innerRef}
                                  {...draggableProvided.draggableProps}>
                                  <ItemGrid item={row} key={row.id} dragHandleProps={draggableProvided.dragHandleProps}/>
                                  {getChildren(row.id).map(val => <ItemGrid item={val} key={val.id}/>)}
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </Box>
                      );
                    }}
                  </Droppable>
                </DragDropContext>
              </Card>
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