import { AddTwoTone } from '@mui/icons-material';
import { Button, Card, CardActionArea, CardContent, Dialog, DialogActions, DialogContent, Grid, Typography } from '@mui/material';
import { cloneDeep } from 'lodash';
import { nanoid } from 'nanoid';
import React from 'react';

const componentList = {
  'tts': {
    title:       'Text to speech',
    description: 'Text to speech component to define message to be spoken.',
    value:       {
      id:          '__id__',
      width:       20,
      height:      20,
      alignX:      0,
      alignY:      0,
      rotation:    0,
      type:        'tts',
      tts:         null,
      ttsTemplate: '{name} tipped you with {amount}{currency}! {message}',
      enabledWhen: null,
    },
  },
  'audio': {
    title:       'Audio',
    description: 'Audio to be played when alert is triggered.',
    value:       {
      id:        '__id__',
      width:     20,
      height:    20,
      alignX:    0,
      alignY:    0,
      rotation:  0,
      type:      'audio',
      galleryId: '%default%',
      volume:    0.2,
      delay:     0,
    },
  },
  'profileImage': {
    title:       'Profile image',
    description: 'Profile image of user who triggered alert.',
    value:       {
      id:                   '__id__',
      width:                205,
      height:               205,
      alignX:               0,
      alignY:               0,
      rotation:             0,
      align:                'center',
      type:                 'profileImage',
      volume:               0.2,
      animationDelay:       0,
      animationInDuration:  null,
      animationOutDuration: null,
      animationIn:          null,
      animationOut:         null,
    },
  },
  'gallery': {
    title:       'Gallery',
    description: 'Image and Video including animated GIFs to be displayed when alert is triggered.',
    value:       {
      id:                   '__id__',
      width:                160,
      height:               205,
      alignX:               0,
      alignY:               0,
      rotation:             0,
      align:                'center',
      type:                 'gallery',
      volume:               0.2,
      loop:                 true,
      galleryId:            '%default%',
      isVideo:              false,
      animationDelay:       0,
      animationInDuration:  null,
      animationOutDuration: null,
      animationIn:          null,
      animationOut:         null,
    },
  },
  'text': {
    title:       'Text',
    description: 'Text to be displayed when alert is triggered.',
    value:       {
      id:                   '__id__',
      width:                160,
      height:               100,
      alignX:               0,
      alignY:               0,
      rotation:             0,
      globalFont:           'globalFont1',
      font:                 null,
      type:                 'text',
      messageTemplate:      '{name} tipped you {amount}{currency}!',
      animationDelay:       1500,
      animationInDuration:  null,
      animationOutDuration: null,
      animationIn:          null,
      animationOut:         null,
    },
  },
  'custom': {
    title:       'Custom (HTML/CSS/JS)',
    description: 'Custom user-defined component to be displayed when alert is triggered.',
    value:       {
      id:         '__id__',
      width:      700,
      height:     100,
      alignX:     0,
      alignY:     0,
      rotation:   0,
      type:       'custom',
      globalFont: 'globalFont1',
      font:       null,
      html:       '',
      css:        '',
      javascript: '',
    },
  },
};

type NewComponentDialogProps = {
  onAdd: (value: any) => void;
};

const NewComponentDialog: React.FC<NewComponentDialogProps> = (props) => {
  const [ open, setOpen ] = React.useState(false);

  const prepare = (type: keyof typeof componentList) => {
    const value = componentList[type].value;
    const id = nanoid();
    const update = cloneDeep(value);
    update.id = id;
    return update;
  };

  return <>
    <Button onClick={() => setOpen(true)} fullWidth startIcon={<AddTwoTone />}>Add new component</Button>
    <Dialog open={open} maxWidth="md" fullWidth>
      <DialogContent>
        <Grid container spacing={1}>
          {Object.entries(componentList).map(([type, val]) => <Grid item xs={6} key={type}>
            <Card>
              <CardActionArea onClick={(ev) => {
                ev.stopPropagation();
                ev.preventDefault();
                props.onAdd(prepare(type as keyof typeof componentList));
                setOpen(false);
              }}>
                <CardContent sx={{ height: '100px' }}>
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
        <Button sx={{ width: 150 }} onClick={() => setOpen(false)}>Close</Button>
      </DialogActions>
    </Dialog>
  </>;
};

export default NewComponentDialog;
