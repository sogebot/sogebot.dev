import { LoadingButton } from '@mui/lab';
import {
  Box, Button, CircularProgress, DialogContent, Divider, Fade, Unstable_Grid2 as Grid, Paper,
} from '@mui/material';
import { Overlay } from '@sogebot/backend/dest/database/entity/overlay';
import { validateOrReject } from 'class-validator';
import { merge } from 'lodash';
import { useSnackbar } from 'notistack';
import React from 'react';
import { flushSync } from 'react-dom';
import Moveable from 'react-moveable';
import { useNavigate, useParams } from 'react-router-dom';

import { getSocket } from '../../helpers/socket';
import { useValidator } from '../../hooks/useValidator';

const emptyItem: Partial<Overlay> = {
  canvas: {
    height: 1080,
    width:  1920,
  },
  name:  '',
  items: [],
};

export const OverlayEdit: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [ moveableId, setMoveableId ] = React.useState<null | string>(null);
  const moveableRef = React.useMemo(() => document.getElementById(moveableId!), [ moveableId ]);
  const [elementGuidelines, setElementGuidelines] = React.useState([]);
  const [frame, setFrame] = React.useState({ translate: [0,0]  });
  const [bounds, setBounds] = React.useState({
    top: 0, left: 0, right: 0, bottom: 0,
  });

  React.useEffect(() => {
    // items to have snaps
    setElementGuidelines([
      document.querySelector('#item1')!,
      document.querySelector('#item2')!,
    ]);

    // set bounds
    const el = document.querySelector('#container')!;
    setBounds({
      left:   0,
      top:    0,
      right:  el.getBoundingClientRect().width,
      bottom: el.getBoundingClientRect().height,
    });
  }, [moveableId]);

  const [ item, setItem ] = React.useState<Overlay>(new Overlay(emptyItem));
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
        {frame.translate[0]},{frame.translate[1]}
        <Paper id="container" sx={{
          aspectRatio: '16/9', height: '100%', maxWidth: '100%', position: 'relative',
        }}>
          <Paper onClick={() => setMoveableId('item1')} sx={{
            width: '100px', height: '100px', position: 'absolute', border: '1px solid white',
          }} id="item1">Target</Paper>
          <Paper onClick={() => setMoveableId('item2')} sx={{
            width: '200px', height: '50px', position: 'absolute', border: '1px solid white',
          }} id="item2">Target2</Paper>
          {moveableId && <Moveable
            key={moveableId}
            target={moveableRef}
            resizable={true}
            flushSync={flushSync}
            bounds={bounds}
            elementGuidelines={elementGuidelines}
            snappable={true}
            verticalGuidelines={[0,200,400]}
            horizontalGuidelines={[0,200,400]}
            snapThreshold={5}
            isDisplaySnapDigit={true}
            snapGap={true}
            snapDirections={{
              'top': true,'right': true,'bottom': true,'left': true,
            }}
            elementSnapDirections={{
              'top': true,'right': true,'bottom': true,'left': true,
            }}
            snapDigit={0}
            draggable={true}
            throttleDrag={0}
            startDragRotate={0}
            throttleDragRotate={0}
            zoom={1}
            padding={{
              'left': 0,'top': 0,'right': 0,'bottom': 0,
            }}
            onDrag={e => {
              setFrame({ translate: e.beforeTranslate });
              e.target.style.transform = `translate(${e.beforeTranslate[0]}px, ${e.beforeTranslate[1]}px)`;
            }}
          />}
        </Paper>
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