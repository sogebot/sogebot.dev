import { ShareTwoTone } from '@mui/icons-material';
import { LoadingButton, TabContext, TabList, TabPanel } from '@mui/lab';
import { Autocomplete, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, LinearProgress, Stack, Tab, TextField, Tooltip, Typography } from '@mui/material';
import { Plugin } from '@sogebot/backend/src/database/entity/plugins';
import match from 'autosuggest-highlight/match';
import parse from 'autosuggest-highlight/parse';
import axios from 'axios';
import { IsNotEmpty, MinLength } from 'class-validator';
import { useSnackbar } from 'notistack';
import React from 'react';

import type { Plugin as RemotePlugin } from '../../../../services/plugins/export';
import { dayjs } from '../../helpers/dayjsHelper';
import { useAppSelector } from '../../hooks/useAppDispatch';
import { useValidator } from '../../hooks/useValidator';
import theme from '../../theme';

type Props = {
  model: Plugin
};

class RemotePluginValidator {
  @IsNotEmpty()
  @MinLength(2)
    name: string;

  @MinLength(2)
  @IsNotEmpty()
    description: string;
}

const endpoint = 'https://registry.sogebot.xyz';

export const ExportDialog: React.FC<Props> = ({ model }) => {
  const { currentVersion } = useAppSelector(s => s.loader);
  const { enqueueSnackbar } = useSnackbar();

  const [ saving, setSaving ] = React.useState(false);
  const [ open, setOpen ] = React.useState(false);

  const [ tab, setTab ] = React.useState('new');
  const [ name, setName ] = React.useState(model.name);
  const [ description, setDescription ] = React.useState('');
  const [ itemsToExport, setItemsToExport ] = React.useState<typeof model.workflow>(model.workflow);

  const [ remotePlugin, setRemotePlugin ] = React.useState<undefined | RemotePlugin>(undefined);
  const [ remotePlugins, setRemotePlugins ] = React.useState<null | RemotePlugin[]>(null);

  const { reset, haveErrors, validate, propsError } = useValidator();

  const getUserId = () => {
    return JSON.parse(localStorage['cached-logged-user']).id;
  };

  React.useEffect(() => {
    setItemsToExport(model.workflow);
  }, [model.workflow]);

  React.useEffect(() => {
    validate(RemotePluginValidator, {
      name, description,
    });
  }, [name, description]);

  React.useEffect(() => {
    reset();
    if (tab === 'update' || tab === 'remove' || open) {
      axios.get<RemotePlugin[]>(endpoint + '/plugins', { headers: { authorization: `Bearer ${localStorage.code}` } }).then(res => setRemotePlugins(res.data.filter(o => o.publisherId === getUserId())));
    } else {
      setRemotePlugin(undefined);
    }
  }, [ tab, open ]);

  const remove = React.useCallback(async () => {
    if (remotePlugin) {
      await axios.delete(endpoint + '/plugins/' + remotePlugin.id, {
        headers: {
          authorization: `Bearer ${localStorage.code}`, 'Content-Type': 'application/json',
        },
      });
      axios.get<RemotePlugin[]>(endpoint + '/plugins', { headers: { authorization: `Bearer ${localStorage.code}` } }).then(res => setRemotePlugins(res.data.filter(o => o.publisherId === getUserId())));
      enqueueSnackbar('Remote plugin was DELETED from registry server.');
      setRemotePlugin(undefined);
    }
  }, [enqueueSnackbar, remotePlugin]);

  const save = React.useCallback(async () => {
    const toSave = {
      name,
      description,
      plugin:         itemsToExport,
      compatibleWith: (currentVersion ?? '').split('-')[0],
    } as {
      name:           string;
      description:    string,
      plugin:         string,
      data:           Record<string, string>
      compatibleWith: string,
    };

    const isValid = await validate(RemotePluginValidator, toSave, true);
    if (!isValid) {
      return;
    }

    setSaving(true);

    try {
      if (tab === 'new') {
        await axios.post(endpoint + '/plugins', {
          ...toSave,
          plugin: toSave.plugin,
          data:   JSON.stringify(toSave.data),
        }, {
          headers: {
            authorization: `Bearer ${localStorage.code}`, 'Content-Type': 'application/json',
          },
        });
        enqueueSnackbar('New remote plugin was created on registry server.');
      } else {
        if (remotePlugin) {
          await axios.put(endpoint + '/plugins/' + remotePlugin.id, {
            ...toSave,
            plugin: toSave.plugin,
          }, {
            headers: {
              authorization: `Bearer ${localStorage.code}`, 'Content-Type': 'application/json',
            },
          });
          enqueueSnackbar('Remote plugin was updated on registry server.');
        }
      }
      setOpen(false);
    } catch (e) {
      console.error(e);
    }
    setSaving(false);

  }, [name, description, itemsToExport, enqueueSnackbar]);

  return <>
    <Tooltip title="Export & Manage remote plugins">
      <IconButton onClick={() => setOpen(true)}><ShareTwoTone/></IconButton>
    </Tooltip>
    <Dialog
      open={open}
      onClose={() => setOpen(false)}
      maxWidth='md'
      fullWidth
      PaperProps={{ sx: { height: '100% !important' } }}
    >
      <DialogTitle>
      Export Plugin
      </DialogTitle>
      <DialogContent>
        <TabContext value={tab}>
          <Box sx={{
            borderBottom: 1, borderColor: 'divider',
          }}>
            <TabList onChange={(ev, newValue) => setTab(newValue)}>
              <Tab label="New plugin" value="new" />
              <Tab label="Update existing plugin" value="update" />
              <Tab label="Remove existing plugin" value="remove" />
            </TabList>
          </Box>
          <TabPanel value="update">
            <Autocomplete
              value={remotePlugin}
              disableClearable
              onChange={(ev, value) => {
                setRemotePlugin(value);
                setName(value.name);
                setDescription(value.description);
              }}
              id="plugin.update.selector"
              options={remotePlugins ?? []}
              filterOptions={(options, state) => {
                if (state.inputValue.trim().length === 0) {
                  return options;
                }
                return options.filter(o => o.name.toLowerCase().includes(state.inputValue.toLowerCase()) || o.description.toLowerCase().includes(state.inputValue.toLowerCase()));
              }}
              getOptionLabel={(option) => option.name}
              renderInput={(params) => <TextField {...params} label="Plugin" />}
              renderOption={(p, option, { inputValue }) => {
                const matches = match(option.name, inputValue, { insideWords: true });
                const parts = parse(option.name, matches);

                const matches2 = match(option.description, inputValue, { insideWords: true });
                const parts2 = parse(option.description, matches2);

                return (
                  <li {...p}>
                    <Stack spacing={0.1}>
                      <Typography>
                        {parts.map((part, index) => (
                          <span
                            key={index}
                            style={{
                              backgroundColor: part.highlight ? theme.palette.primary.main : 'inherit',
                              color:           part.highlight ? 'black' : 'inherit',
                            }}
                          >
                            {part.text}
                          </span>
                        ))}
                      </Typography>
                      {option.description.trim().length > 0 && <Typography variant={'body2'}>
                        {parts2.map((part, index) => (
                          <span
                            key={index}
                            style={{
                              backgroundColor: part.highlight ? theme.palette.primary.main : 'inherit',
                              color:           part.highlight ? 'black' : 'inherit',
                            }}
                          >
                            {part.text}
                          </span>
                        ))}
                      </Typography>}
                      <Stack direction='row' spacing={2}>
                        <Chip size='small' label={<Typography variant='caption'>v{option.version}</Typography>}/>
                        <Typography variant='caption' sx={{ transform: 'translateY(3px)' }}>{dayjs(option.publishedAt).format('LL LTS')}</Typography>
                      </Stack>
                    </Stack>
                  </li>
                );
              }}
            />
            { !remotePlugins && <LinearProgress/> }
          </TabPanel>
          <TabPanel value="remove">
            <Autocomplete
              value={remotePlugin}
              disableClearable
              onChange={(ev, value) => {
                setRemotePlugin(value);
                setName(value.name);
                setDescription(value.description);
              }}
              id="plugin.update.selector"
              options={remotePlugins ?? []}
              filterOptions={(options, state) => {
                if (state.inputValue.trim().length === 0) {
                  return options;
                }
                return options.filter(o => o.name.toLowerCase().includes(state.inputValue.toLowerCase()) || o.description.toLowerCase().includes(state.inputValue.toLowerCase()));
              }}
              getOptionLabel={(option) => option.name}
              renderInput={(params) => <TextField {...params} label="Plugin" />}
              renderOption={(p, option, { inputValue }) => {
                const matches = match(option.name, inputValue, { insideWords: true });
                const parts = parse(option.name, matches);

                const matches2 = match(option.description, inputValue, { insideWords: true });
                const parts2 = parse(option.description, matches2);

                return (
                  <li {...p}>
                    <Stack spacing={0.1}>
                      <Typography>
                        {parts.map((part, index) => (
                          <span
                            key={index}
                            style={{
                              backgroundColor: part.highlight ? theme.palette.primary.main : 'inherit',
                              color:           part.highlight ? 'black' : 'inherit',
                            }}
                          >
                            {part.text}
                          </span>
                        ))}
                      </Typography>
                      {option.description.trim().length > 0 && <Typography variant={'body2'}>
                        {parts2.map((part, index) => (
                          <span
                            key={index}
                            style={{
                              backgroundColor: part.highlight ? theme.palette.primary.main : 'inherit',
                              color:           part.highlight ? 'black' : 'inherit',
                            }}
                          >
                            {part.text}
                          </span>
                        ))}
                      </Typography>}
                      <Stack direction='row' spacing={2}>
                        <Chip size='small' label={<Typography variant='caption'>v{option.version}</Typography>}/>
                        <Typography variant='caption' sx={{ transform: 'translateY(3px)' }}>{dayjs(option.publishedAt).format('LL LTS')}</Typography>
                      </Stack>
                    </Stack>
                  </li>
                );
              }}
            />
            { !remotePlugins && <LinearProgress/> }
          </TabPanel>
        </TabContext>

        { tab !== 'remove' && <>
          <Stack spacing={0.5} sx={{
            pt: tab ==='new' ? 3 : 0, px: 3,
          }}>
            <TextField
              label="Name"
              fullWidth
              required
              value={name}
              onChange={(ev) => setName(ev.currentTarget.value)}
              {...propsError('name')}
            />
            <TextField
              label="Description"
              multiline
              fullWidth
              value={description}
              onChange={(ev) => setDescription(ev.currentTarget.value)}
              required
              {...propsError('description')}
            />
          </Stack>
        </>}
      </DialogContent>
      <DialogActions>
        <LoadingButton onClick={() => tab === 'remove' ? remove() : save()} disabled={((tab === 'update' || tab === 'remove') && !remotePlugin) || haveErrors} loading={saving}>
          { tab  === 'remove' ? 'Remove from remote' : 'Save on remote' }
        </LoadingButton>
        <Button onClick={() => setOpen(false)}>Close</Button>
      </DialogActions>
    </Dialog>
  </>;
};