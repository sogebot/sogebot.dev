import { WidgetCustomInterface } from '@backend/database/entity/widget';
import { Delete, Edit } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import { Alert, Button, Container, Divider, Drawer, Grid, IconButton, Stack, TextField, Tooltip } from '@mui/material';
import { red } from '@mui/material/colors';
import { Box } from '@mui/system';
import axios from 'axios';
import { useAtomValue } from 'jotai';
import clone from 'lodash/clone';
import React from 'react';
import { v4 } from 'uuid';

import { loggedUserAtom } from '../../../../../atoms';
import getAccessToken from '../../../../../getAccessToken';

export const DashboardWidgetBotDialogCustomURLsEdit: React.FC<{ setRefreshTimestamp: React.Dispatch<React.SetStateAction<number>> }> = ({
  setRefreshTimestamp,
}) => {
  const [ custom, setCustom ] = React.useState<WidgetCustomInterface[]>([]);
  const [ idxDelete, setIdxDelete ] = React.useState<string[]>([]);
  const [ open, setOpen ] = React.useState(false);
  const [ isSaving, setIsSaving ] = React.useState(false);
  const user = useAtomValue(loggedUserAtom);

  React.useEffect(() => {
    if (!user) {
      return;
    }
    axios.get('/api/widgets/custom', { headers: { authorization: `Bearer ${getAccessToken()}` } }).then(({ data }) => {
      setCustom(data.data);
    });
    if (open) {
      setIdxDelete([]);
    }
  }, [user, open]);

  const addNewItem = () => {
    if (!user) {
      return;
    }
    setCustom([
      ...custom,
      {
        id:     v4(),
        name:   '',
        url:    '',
        userId: user.id,
      },
    ]);
  };

  const save = async () => {
    setIsSaving(true);
    for (const item of custom) {
      if (idxDelete.includes(item.id)) {
        await axios.delete(`/api/widgets/custom/${item.id}`, {
          headers: {
            Authorization: `Bearer ${getAccessToken()}`
          }
        });
      } else {
        await axios.post('/api/widgets/custom', item, {
          headers: {
            Authorization: `Bearer ${getAccessToken()}`
          }
        });
      }
    }
    setIsSaving(false);
    setOpen(false);
    setRefreshTimestamp(Date.now());
  };

  const handleItemChange = (type: string, value: string, id: string) => {
    const newItems = clone(custom);
    const updateItem = newItems.find(o => o.id === id);
    if (updateItem) {
      (updateItem as any)[type] = value;
    }
    setCustom(newItems);
  };

  return (
    <>
      <Tooltip title="Edit URLs">
        <IconButton onClick={() => setOpen(true)}>
          <Edit/>
        </IconButton>
      </Tooltip>

      <Drawer
        open={open}
        anchor="right"
        onClose={() => setOpen(false)}
        sx={{
          flexShrink:           0,
          '& .MuiDrawer-paper': {
            width:     800,
            boxSizing: 'border-box',
          },
        }}
      >
        <Container disableGutters sx={{
          p: 1, height: 'calc(100% - 50px)', maxHeight: 'calc(100% - 50px)', overflow: 'auto',
        }}>
          <Alert severity="warning" sx={{ mb: 2 }}>Not all URLs will be working! e.g twitter.com, reddit.com have forbidden iframes.</Alert>

          {custom.filter(item => !idxDelete.includes(item.id)).map((item) => {
            return (
              <Grid container alignItems={'center'} key={item.id}>
                <Grid item flexGrow={1}>
                  <Stack direction="row" sx={{ pb: 1 }}>
                    <TextField
                      fullWidth
                      label="Name"
                      value={item.name}
                      onChange={(event) => handleItemChange('name', event.target.value, item.id) }
                      size="small"
                      variant="standard"
                    />
                    <TextField
                      fullWidth
                      label="URL"
                      onChange={(event) => handleItemChange('url', event.target.value, item.id) }
                      value={item.url}
                      size="small"
                      onKeyPress={(e) => {
                        e.key === 'Enter' && e.preventDefault();
                      }}
                      variant="standard"
                    />
                  </Stack>
                </Grid>
                <Grid item xs="auto">
                  <IconButton onClick={() => setIdxDelete([...idxDelete, item.id])}>
                    <Delete htmlColor={red[500]}/>
                  </IconButton>
                </Grid>
              </Grid>
            );
          })}
        </Container>
        <Divider/>
        <Box sx={{
          height: '50px', p: 1,
        }}>
          <Grid container sx={{ height: '100%' }} spacing={1}>
            <Grid item flexGrow={1}><Button onClick={addNewItem} sx={{ width: '150px' }}>Add item</Button></Grid>
            <Grid item xs={'auto'}><Button onClick={() => setOpen(false)} sx={{ width: '150px' }}>Close</Button></Grid>
            <Grid item xs={'auto'}>
              <LoadingButton variant="contained" loading={isSaving} onClick={() => save()} sx={{ width: '150px' }}>Save</LoadingButton>
            </Grid>
          </Grid>
        </Box>
      </Drawer>
    </>
  );
};
