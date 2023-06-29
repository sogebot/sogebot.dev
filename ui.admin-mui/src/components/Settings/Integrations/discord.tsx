import {
  DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { LoadingButton } from '@mui/lab';
import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Grid,
  InputLabel,
  List,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import parse from 'html-react-parser';
import { xor } from 'lodash';
import React, {
  useCallback, useEffect, useState,
} from 'react';
import { useRefElement } from 'rooks';

import { getSocket } from '../../../helpers/socket';
import { useAppSelector } from '../../../hooks/useAppDispatch';
import { usePermissions } from '../../../hooks/usePermissions';
import { useSettings } from '../../../hooks/useSettings';
import { useTranslation } from '../../../hooks/useTranslation';
import { SortableListItem } from '../../Sortable/SortableListItem';
import { SettingsSystemsDialogStringArray } from '../Dialog/StringArray';

type Guild = { text: string, value: string };
type Channel = { text: string, value: string };

const PageSettingsModulesIntegrationsDiscord: React.FC<{
  onVisible: () => void,
}> = ({
  onVisible,
}) => {

  const { translate } = useTranslation();

  const { settings, loading, refresh, save, saving, errors, TextFieldProps, settingsInitial, handleChange } = useSettings('/integrations/discord' as any);
  const { permissions } = usePermissions();

  const [ guilds, setGuilds ] = useState<Guild[]>([]);
  const [ roles, setRoles ] = useState<Guild[]>([]);
  const [ channels, setChannels ] = useState<Channel[]>([]);

  useEffect(() => {
    refresh().then((data) => {
      getSocket(`/integrations/discord`).emit('discord::getGuilds', (err2, guilds2: Guild[]) => {
        console.groupCollapsed('discord::getGuilds');
        console.log({ guilds2 });
        console.groupEnd();

        if (err2) {
          return;
        }

        if (!guilds2.find((o: any) => String(o.value) === String(data.bot.guild[0]))) {
          handleChange('bot.guild', '');
        }
        setGuilds([{
          value: '', text: `-- ${translate('integrations.discord.settings.noGuildSelected')} --`,
        }, ...guilds2]);
      });
      getSocket(`/integrations/discord`).emit('discord::getRoles', (err2, roles2: Guild[]) => {
        if (err2) {
          return;
        }
        console.groupCollapsed('discord::getRoles');
        console.log({ roles2 });
        console.groupEnd();
        setRoles(roles2);
      });
      getSocket(`/integrations/discord`).emit('discord::getChannels', (err2, channels2: Channel[]) => {
        console.groupCollapsed('discord::getChannels');
        console.log({ channels2 });
        console.groupEnd();

        if (err2) {
          return;
        }

        if (!channels2.find((o: any) => String(o.value) === String(data?.bot.guild[0]))) {
          handleChange('bot.listenAtChannels', ['']);
        }
        handleChange('bot.listenAtChannels', data.bot.listenAtChannels[0].filter(Boolean));
        setChannels(channels2);
      });
    });
  }, [ refresh, handleChange, translate ]);

  const [ref, element]  = useRefElement<HTMLElement>();
  const scrollY = useAppSelector(state => state.page.scrollY);
  useEffect(() => {
    if (element) {
      if (element.offsetTop < scrollY + 100 && element.offsetTop + element.clientHeight > scrollY - 100) {
        onVisible();
      }
    }
  }, [element, scrollY, onVisible]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: { active: any; over: any; }) {
    const { active, over } = event;

    if (!active || !over || !settings) {
      return;
    }
    if (active.id !== over.id) {
      const oldIndex = settings.bot.fields[0].indexOf(active.id);
      const newIndex = settings.bot.fields[0].indexOf(over.id);
      handleChange('bot.fields', arrayMove(settings.bot.fields[0], oldIndex, newIndex));
    }
    setActiveId(null);
  }
  const [activeId, setActiveId] = useState<null | string>(null);

  function handleDragStart(event: { active: any; }) {
    const { active } = event;
    setActiveId(active.id);
  }

  const toggleVisibility = useCallback((item: string) => {
    if (settings) {
      handleChange('bot.fieldsDisabled', xor(settings.bot.fieldsDisabled[0], [item]));
    }
  }, [settings, handleChange]);

  const handleChangeAnnouncesToChannel = useCallback((key: string, value: any) => {
    if (settings) {
      handleChange('bot.sendAnnouncesToChannel', {
        ...settings.bot.sendAnnouncesToChannel[0], [key]: value,
      });
    }
  }, [settings, handleChange]);

  const handleChangePermission = useCallback((key: string, value: any) => {
    if (settings) {
      handleChange('mapping.rolesMapping', {
        ...settings.mapping.rolesMapping[0], [key]: value,
      });
    }
  }, [settings, handleChange]);

  return (loading ? null : <Box ref={ref} id="discord">
    <Typography variant='h2' sx={{ pb: 2 }}>Discord</Typography>
    {settings && settingsInitial && <Paper elevation={1} sx={{ p: 1 }}>
      <Stack spacing={1} alignItems='center'>
        <TextField
          {...TextFieldProps('general.clientId')}
          type="password"
          label={translate('integrations.discord.settings.clientId')}
        />
        <TextField
          {...TextFieldProps('general.token')}
          type="password"
          label={translate('integrations.discord.settings.token')}
        />
        <Button disabled={settingsInitial.general.clientId[0].length === 0 || settingsInitial.general.token[0].length === 0} sx={{ width: 400 }}>
          {(settingsInitial.general.clientId[0].length === 0 || settingsInitial.general.token[0].length === 0)
            ? translate('integrations.discord.settings.joinToServerBtnDisabled')
            : translate('integrations.discord.settings.joinToServerBtn') }
        </Button>
      </Stack>
    </Paper>}

    <Typography variant='h5' sx={{ py: 2 }}>{ translate('categories.bot') }</Typography>
    {settings && <Paper elevation={1} sx={{ p: 1 }}>
      <Stack spacing={1}>
        <FormControl fullWidth variant='filled'>
          <InputLabel id="rmtp-stream-label" shrink>{translate('integrations.discord.settings.guild')}</InputLabel>
          <Select
            labelId="rmtp-stream-label"
            id="rmtp-stream-select"
            displayEmpty
            variant='filled'
            value={settings.bot.guild[0]}
            label={translate('integrations.discord.settings.guild')}
            onChange={(event) => handleChange('bot.guild', event.target.value)}
          >
            {guilds.map(item => <MenuItem value={item.value} key={item.value}>{parse(item.text)}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl fullWidth variant='filled'>
          <InputLabel id="rmtp-stream-label">{translate('integrations.discord.settings.listenAtChannels')}</InputLabel>
          <Select
            labelId="rmtp-stream-label"
            id="rmtp-stream-select"
            multiple
            variant='filled'
            value={settings.bot.listenAtChannels[0]}
            label={translate('integrations.discord.settings.listenAtChannels')}
            onChange={(event) => handleChange('bot.listenAtChannels', event.target.value)}
          >
            {channels.map(item => <MenuItem value={item.value} key={item.value}>{parse(item.text)}</MenuItem>)}
          </Select>
        </FormControl>
        <FormGroup>
          <FormControlLabel control={<Checkbox checked={settings.bot.deleteMessagesAfterWhile[0]} onChange={(_, checked) => handleChange('bot.deleteMessagesAfterWhile', checked)} />} label={translate('integrations.discord.settings.deleteMessagesAfterWhile')} />
        </FormGroup>

        <Grid container alignItems='center'>
          <Grid item>
            <Typography>{ translate('integrations.discord.settings.ignorelist.title') }</Typography>
          </Grid>
          <Grid item sx={{ pl: 2 }}>
            <SettingsSystemsDialogStringArray title={translate('integrations.discord.settings.ignorelist.title')} items={settings.bot.ignorelist[0]} onChange={(value) => handleChange('bot.ignorelist', value)} />
          </Grid>
        </Grid>

      </Stack>
    </Paper>}

    <Typography variant='h5' sx={{ py: 2 }}>{ translate('categories.announcements') }</Typography>
    {settings && <Paper elevation={1} sx={{ p: 1 }}>
      <Stack spacing={1}>
        <FormControl fullWidth variant='filled'>
          <InputLabel id="send-online-announce-channel-label" shrink>{translate('integrations.discord.settings.sendOnlineAnnounceToChannel')}</InputLabel>
          <Select
            labelId="send-online-announce-channel-label"
            id="send-online-announce-channel-select"
            displayEmpty
            variant='filled'
            value={settings.bot.sendOnlineAnnounceToChannel[0]}
            label={translate('integrations.discord.settings.sendOnlineAnnounceToChannel')}
            onChange={(event) => handleChange('bot.sendOnlineAnnounceToChannel', event.target.value)}
          >
            {channels.map(item => <MenuItem value={item.value} key={item.value}>{parse(item.text)}</MenuItem>)}
          </Select>
        </FormControl>

        <TextField
          {...TextFieldProps('bot.onlineAnnounceMessage')}
          label={translate('integrations.discord.settings.onlineAnnounceMessage')}
        />

        <FormLabel sx={{ pt: 2 }}>{translate('systems.userinfo.settings.order')}</FormLabel>
        <List>
          <DndContext
            sensors={sensors}
            onDragEnd={handleDragEnd}
            onDragStart={handleDragStart}
          >
            <SortableContext
              items={settings.bot.fields[0]}
              strategy={verticalListSortingStrategy}
            >
              {settings.bot.fields[0].map((item: string) => <SortableListItem
                draggable
                key={item}
                id={item}
                visible={!settings.bot.fieldsDisabled[0].includes(item)}
                onVisibilityChange={() => toggleVisibility(item)}
                isDragging={item === activeId} />)}
            </SortableContext>
          </DndContext>
        </List>

        {Object.keys(settings.bot.sendAnnouncesToChannel[0]).map(key => <FormControl fullWidth variant='filled' key={key}>
          <InputLabel id={key + '-label'}>{key}</InputLabel>
          <Select
            labelId={key + '-label'}
            id={key + '-select'}
            variant='filled'
            value={settings.bot.sendAnnouncesToChannel[0][key]}
            label={key}
            onChange={(event) => handleChangeAnnouncesToChannel(key, event.target.value)}
          >
            <MenuItem value="">Deselect</MenuItem>
            {channels.map(item => <MenuItem value={item.value} key={item.value}>{parse(item.text)}</MenuItem>)}
          </Select>
        </FormControl>)}
      </Stack>
    </Paper>}

    <Typography variant='h5' sx={{ py: 2 }}>{ translate('categories.mapping') }</Typography>
    {settings && <Paper elevation={1} sx={{ p: 1 }}>
      <Stack spacing={1}>
        {permissions.map(p => <FormControl fullWidth variant='filled' key={p.id}>
          <InputLabel id={p.id + '-label'}>{p.name}</InputLabel>
          <Select
            labelId={p.id + '-label'}
            id={p.id + '-select'}
            variant='filled'
            value={settings.bot.sendAnnouncesToChannel[0][p.id]}
            label={p.id}
            onChange={(event) => handleChangePermission(p.id, event.target.value)}
          >
            <MenuItem value="">Deselect</MenuItem>
            {roles.map(item => <MenuItem value={item.value} key={item.value}>{parse(item.text)}</MenuItem>)}
          </Select>
        </FormControl>)}
      </Stack>
    </Paper>}

    <Typography variant='h5' sx={{ py: 2 }}>{ translate('categories.status') }</Typography>
    {settings && <Paper elevation={1} sx={{ p: 1 }}>
      <Stack spacing={1}>
        <FormControl fullWidth variant='filled'>
          <InputLabel id="onlinePresenceStatusDefault-label">{translate('integrations.discord.settings.onlinePresenceStatusDefault')}</InputLabel>
          <Select
            labelId="onlinePresenceStatusDefault-label"
            id="onlinePresenceStatusDefault-select"
            variant='filled'
            value={settings.status.onlinePresenceStatusDefault[0]}
            label={translate('integrations.discord.settings.onlinePresenceStatusDefault')}
            onChange={(event) => handleChange('status.onlinePresenceStatusDefault', event.target.value)}
          >
            <MenuItem value="online">online</MenuItem>
            <MenuItem value="idle">idle</MenuItem>
            <MenuItem value="invisible">invisible</MenuItem>
            <MenuItem value="dnd">dnd</MenuItem>
          </Select>
        </FormControl>

        <TextField
          {...TextFieldProps('status.onlinePresenceStatusDefaultName')}
          label={translate('integrations.discord.settings.onlinePresenceStatusDefaultName')}
        />
        <FormControl fullWidth variant='filled'>
          <InputLabel id="onlinePresenceStatusOnStream-label">{translate('integrations.discord.settings.onlinePresenceStatusOnStream')}</InputLabel>
          <Select
            labelId="onlinePresenceStatusOnStream-label"
            id="onlinePresenceStatusOnStream-select"
            variant='filled'
            value={settings.status.onlinePresenceStatusOnStream[0]}
            label={translate('integrations.discord.settings.onlinePresenceStatusOnStream')}
            onChange={(event) => handleChange('status.onlinePresenceStatusOnStream', event.target.value)}
          >
            <MenuItem value="streaming">streaming</MenuItem>
            <MenuItem value="online">online</MenuItem>
            <MenuItem value="idle">idle</MenuItem>
            <MenuItem value="invisible">invisible</MenuItem>
            <MenuItem value="dnd">dnd</MenuItem>
          </Select>
        </FormControl>

        <TextField
          {...TextFieldProps('status.onlinePresenceStatusOnStreamName')}
          label={translate('integrations.discord.settings.onlinePresenceStatusOnStreamName')}
        />
      </Stack>
    </Paper>}

    <Stack direction='row' justifyContent='center' sx={{ pt: 2 }}>
      <LoadingButton sx={{ width: 300 }} variant='contained' loading={saving} onClick={save} disabled={errors.length > 0}>Save changes</LoadingButton>
    </Stack>
  </Box>
  );
};

export default PageSettingsModulesIntegrationsDiscord;
