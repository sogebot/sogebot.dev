import { AddTwoTone } from '@mui/icons-material';
import { Button, Card, CardActionArea, CardContent, Dialog, DialogActions, DialogContent, Grid, Typography } from '@mui/material';
import React from 'react';

import { alertList } from '../src/alertList';

type NewAlertDialogProps = {
  onAdd: (type: keyof typeof alertList) => void
};

const NewAlertDialog: React.FC<NewAlertDialogProps> = (props) => {
  const [ open, setOpen ] = React.useState(false);

  return <>
    <Button onClick={() => setOpen(true)} fullWidth startIcon={<AddTwoTone />}>Add new alert</Button>
    <Dialog open={open} maxWidth="md" fullWidth>
      <DialogContent dividers>
        <Grid container spacing={1}>
          {Object.entries(alertList).map(([type, val]) => <Grid item xs={6} key={type}>
            <Card>
              <CardActionArea onClick={(ev) => {
                ev.stopPropagation();
                ev.preventDefault();
                props.onAdd(type as keyof typeof alertList);
                setOpen(false);
              }}>
                <CardContent sx={{ height: '90px' }}>
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

export default NewAlertDialog;
