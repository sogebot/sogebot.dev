import Editor, { useMonaco } from '@monaco-editor/react';
import { LoadingButton } from '@mui/lab';
import {
  Button, Dialog, DialogActions, DialogContent, Grid, IconButton, LinearProgress, List, ListItem,
  ListItemButton,
  ListItemIcon, ListItemText, ListSubheader, Popover, Stack, TextField, Typography,
} from '@mui/material';
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';

// This is ugly hack but we need it to import lodash bindings
/* eslint-disable */
// @ts-ignore
import LODASH_array from '!raw-loader!@types/lodash/common/array.d.ts';
// @ts-ignore
import LODASH_collection from '!raw-loader!@types/lodash/common/collection.d.ts';
// @ts-ignore
import LODASH_common from '!raw-loader!@types/lodash/common/common.d.ts';
// @ts-ignore
import LODASH_date from '!raw-loader!@types/lodash/common/date.d.ts';
// @ts-ignore
import LODASH_function from '!raw-loader!@types/lodash/common/function.d.ts';
// @ts-ignore
import LODASH_lang from '!raw-loader!@types/lodash/common/lang.d.ts';
// @ts-ignore
import LODASH_math from '!raw-loader!@types/lodash/common/math.d.ts';
// @ts-ignore
import LODASH_number from '!raw-loader!@types/lodash/common/number.d.ts';
// @ts-ignore
import LODASH_object from '!raw-loader!@types/lodash/common/object.d.ts';
// @ts-ignore
import LODASH_seq from '!raw-loader!@types/lodash/common/seq.d.ts';
// @ts-ignore
import LODASH_string from '!raw-loader!@types/lodash/common/string.d.ts';
// @ts-ignore
import LODASH_util from '!raw-loader!@types/lodash/common/util.d.ts';
// @ts-ignore
import LODASH_index from '!raw-loader!@types/lodash/index.d.ts';
import { ContentPasteTwoTone, DriveFileRenameOutlineTwoTone, LinkTwoTone } from '@mui/icons-material';
import { Plugin } from '@sogebot/backend/dest/database/entity/plugins';
import shortid from 'shortid';
import PopupState, { bindTrigger, bindPopover } from 'material-ui-popup-state';
import { getSocket } from '../../helpers/socket';
import { useValidator } from '../../hooks/useValidator';
import { useSnackbar } from 'notistack';

const leftPanelWidth = 352;

type File = {
  id: string;
  name: string;
  source: string;
}


const libSource =
`declare function listenTo(listener: 'command', command: string, callback: (userState: { userId: string, userName: string }, ...commandArgs: string[]) => void): void;
declare function listenTo(listener: 'message', callback: (userId: string, userName: string) => void): void;

declare const Twitch = {
  /**
   * Bot will send message to chat
   * */
  sendMessage(message:string): void;
  timeout(userName: string, seconds: number): void;
}
declare const Permission = {
  /**
   * Check if user have access to this permissionId
   * */
  accessTo(userId: string, permissionId: string): Promise<boolean>;
  list(): Promise<Permission[]>;
}
declare const Log = {
  info(text: string): void,
  warning(text: string): void
}
/**
 * Contains core permissions defined by bot
 * */
declare const permission = {
  CASTERS:     '4300ed23-dca0-4ed9-8014-f5f2f7af55a9',
  MODERATORS:  'b38c5adb-e912-47e3-937a-89fabd12393a',
  SUBSCRIBERS: 'e3b557e7-c26a-433c-a183-e56c11003ab7',
  VIP:         'e8490e6e-81ea-400a-b93f-57f55aad8e31',
  FOLLOWERS:   'c168a63b-aded-4a90-978f-ed357e95b0d2',
  VIEWERS:     '0efd7b1c-e460-4167-8e06-8aaf2c170311',
} as const

declare function user(username: string): Promise<{ username: string, displayname: string, id: string, is: { follower: boolean, mod: boolean, online: boolean, subscriber: boolean, vip: boolean }}>
declare function url(url: string, opts?: { method: 'POST' | 'GET', headers: object, data: object}): Promise<{ data: object, status: number, statusText: string}>
declare function waitMs(miliseconds: number): Promise<undefined>
declare function randomOnlineSubscriber(): Promise<User>
declare function randomOnlineViewer(): Promise<User>
declare function randomSubscriber(): Promise<User>
declare function randomViewer(): Promise<User>

declare var stream: {
  uptime: string,
  chatMessages: number,
  currentViewers: number,
  currentBits: number,
  currentFollowers: number,
  currentHosts: number,
  currentTips: number,
  currentWatched: number,
  currency: string,
  maxViewers: number,
  newChatters: number,
  game: string,
  status: string
}

interface User {
  userId: string; userName: string; displayname?: string; profileImageUrl?: string;
  isOnline?: boolean; isVIP?: boolean; isModerator?: boolean; isSubscriber?: boolean;
  haveSubscriberLock?: boolean; haveSubscribedAtLock?: boolean; rank?: string; haveCustomRank?: boolean;
  subscribedAt?: string | null; seenAt?: string | null; createdAt?: string | null;
  watchedTime?: number; chatTimeOnline?: number; chatTimeOffline?: number;
  points?: number; pointsOnlineGivenAt?: number; pointsOfflineGivenAt?: number; pointsByMessageGivenAt?: number;
  subscribeTier?: string; subscribeCumulativeMonths?: number; subscribeStreak?: number; giftedSubscribes?: number;
  messages?: number;
  extra: {
    jackpotWins?: number;
    levels?: {
      xp: string; // we need to use string as we cannot stringify bigint in typeorm
      xpOfflineGivenAt: number;
      xpOfflineMessages: number;
      xpOnlineGivenAt: number;
      xpOnlineMessages: number;
    },
  } | null
}

interface Permission {
  id: string,
  name: string.
}
`;

export const PluginsEdit: React.FC = () => {
  const navigate = useNavigate();
  const { type, id } = useParams();
  const { enqueueSnackbar } = useSnackbar();
  const { propsError, reset, validate, haveErrors, showErrors } = useValidator();

  const [ loading, setLoading ] = React.useState(true);
  const [ saving, setSaving ] = React.useState(false);

  const [ fileType, setFileType ] = React.useState('code');
  const [ editFile, setEditFile ] = React.useState('');

  const [newFilename, setNewFilename] = React.useState<{
    [id: string]: string
  }>({});
  const [ plugin, setPlugin ] = React.useState<Plugin | null>(null);
  const updateFileName = React.useCallback((fId: string) => {
    setPlugin(pl => {
      if (!pl) {
        return pl;
      }
      const workflow = JSON.parse(pl.workflow);

      const file = [...workflow.code, ...workflow.overlay].find((o: File) => o.id === fId);
      if (file) {
        file.name = newFilename[fId];
      }
      return {...pl, workflow: JSON.stringify(workflow)} as Plugin
    })
    return newFilename[fId] && newFilename[fId].length > 0;
  }, [ newFilename ])
  const updateFileSource = React.useCallback((source: string) => {
    setPlugin(pl => {
      if (!pl) {
        return pl;
      }
      const workflow = JSON.parse(pl.workflow);

      const file = [...workflow.code, ...workflow.overlay].find((o: File) => o.id === editFile);
      if (file) {
        file.source = source;
      }
      return {...pl, workflow: JSON.stringify(workflow)} as Plugin
    })
    return true;
  }, [ editFile ])

  const addNewFile = () => {
    if (!plugin) {
      return;
    }

    const workflow = JSON.parse(plugin.workflow);
    workflow[fileType].push({
      name: `unnamed file`,
      source: '',
      id: shortid()
    })
    setPlugin({...plugin, workflow: JSON.stringify(workflow)} as Plugin)
  }

  const monaco = useMonaco();
  React.useEffect(() => {
    monaco?.languages.typescript.javascriptDefaults.setCompilerOptions({
      allowNonTsExtensions: true,
      allowJs:              true,
      lib:                  ['es2020'],
    });

    // do conditional chaining
    const libUri = 'ts:filename/global.d.ts';
    try {
      // When resolving definitions and references, the editor will try to use created models.
      // Creating a model for the library allows "peek definition/references" commands to work with the library.
      monaco?.editor.createModel(libSource, 'typescript', monaco.Uri.parse(libUri));
      monaco?.languages.typescript.javascriptDefaults.addExtraLib(LODASH_index, '@types/lodash/index.d.ts');
      monaco?.languages.typescript.javascriptDefaults.addExtraLib(LODASH_common, '@types/lodash/common/common.d.ts');
      monaco?.languages.typescript.javascriptDefaults.addExtraLib(LODASH_array, '@types/lodash/common/array.d.ts');
      monaco?.languages.typescript.javascriptDefaults.addExtraLib(LODASH_collection, '@types/lodash/common/collection.d.ts');
      monaco?.languages.typescript.javascriptDefaults.addExtraLib(LODASH_date, '@types/lodash/common/date.d.ts');
      monaco?.languages.typescript.javascriptDefaults.addExtraLib(LODASH_function, '@types/lodash/common/function.d.ts');
      monaco?.languages.typescript.javascriptDefaults.addExtraLib(LODASH_lang, '@types/lodash/common/lang.d.ts');
      monaco?.languages.typescript.javascriptDefaults.addExtraLib(LODASH_math, '@types/lodash/common/math.d.ts');
      monaco?.languages.typescript.javascriptDefaults.addExtraLib(LODASH_number, '@types/lodash/common/number.d.ts');
      monaco?.languages.typescript.javascriptDefaults.addExtraLib(LODASH_object, '@types/lodash/common/object.d.ts');
      monaco?.languages.typescript.javascriptDefaults.addExtraLib(LODASH_seq, '@types/lodash/common/seq.d.ts');
      monaco?.languages.typescript.javascriptDefaults.addExtraLib(LODASH_string, '@types/lodash/common/string.d.ts');
      monaco?.languages.typescript.javascriptDefaults.addExtraLib(LODASH_util, '@types/lodash/common/util.d.ts');

      // bot typings
      monaco?.languages.typescript.javascriptDefaults.addExtraLib(libSource, libUri);
    } catch {
      return;
    }
  }, [monaco, editFile]);

  const codeFiles = React.useMemo<File[]>(() => {
    if (!plugin) {
      return [];
    }
    return JSON.parse(plugin.workflow)[fileType]
  }, [ plugin?.workflow, fileType ])

  const openedFileSource = React.useMemo<File | null>(() => {
    if (!plugin) {
      return null;
    }
    if (editFile === 'global.d.ts') {
      return {
        id: 'global.d.ts',
        name: '',
        source: libSource,
      }
    }

    const workflow = JSON.parse(plugin.workflow);

    for (const file of [...workflow.code, ...workflow.overlay]) {
      if (file.id === editFile) {
        return file
      }
    }
  }, [ plugin?.workflow, editFile ])

  const open = React.useMemo(() => !!(type
    && (
      (type === 'edit' && id)
      || type === 'create'
    )
  ), [type, id]);

  const handleClose = () => {
    setTimeout(() => {
      navigate(`/registry/plugins?server=${JSON.parse(localStorage.server)}`);
    }, 200);
  };

  React.useEffect(() => {
    if (type === 'create') {
      setLoading(false);
      setPlugin({
        id: shortid(),
        name: '',
        enabled: true,
        workflow: JSON.stringify({
          code: [{
            id: shortid(),
            name: 'this is source  code name',
            source: `const settings = {
      command: '!seppuku',
      messageBroadcaster: '$sender tried to commit seppuku, but lost a sword.',
      messageDefault: '$sender has committed seppuku.',
      timeout: 10,
    }

    listenTo('command', settings.command, async (userState, ...commandArgs ) => {
      const isCaster = await Permission.accessTo(userState.userId, permission.CASTERS);

      Twitch.sendMessage(
        isCaster
          ? settings.messageBroadcaster
          : settings.messageDefault
      );

      if (!isCaster) {
        Twitch.timeout(userState.userName, settings.timeout)
      }
    })`
          }],
          overlay: [],
        }),
        settings: null,
      } as Plugin)
    } else {
      getSocket('/core/plugins').emit('generic::getOne', id, (err, item) => {
        if (err) {
          enqueueSnackbar(String(err), { action: 'error' });
          console.error(err);
        }
        setPlugin(item);
        setLoading(false)
      })
      console.log('loading')
    }
    reset();
  }, [ type, id, reset ]);

  React.useEffect(() => {
    if (!loading && plugin) {
      validate(Plugin, plugin);
    }
  }, [plugin, loading, validate]);

  const handleSave = () => {
    setSaving(true);
    getSocket('/core/plugins').emit('generic::save', plugin, (err, savedItem) => {
      if (err) {
        showErrors(err as any);
      } else {
        enqueueSnackbar('Plugin saved.', { variant: 'success' });
        navigate(`/registry/plugins/edit/${savedItem.id}?server=${JSON.parse(localStorage.server)}`);
      }
      setSaving(false);
    });
  }

  return(<Dialog open={open} fullScreen sx={{ p: 5 }} scroll='paper' >
    {(loading || !plugin) ? <>
      <LinearProgress />
      <DialogContent/>
    </>
      : <DialogContent sx={{
        p: 0, overflowX: 'hidden',
      }}>
        <Grid container spacing={0} sx={{
          height: '100%', m: 0,
        }}>
          <Grid sx={{
            p: 1, width: leftPanelWidth + 'px', pb: 0,
          }}>


              <TextField
                {...propsError('name')}
                sx={{ mb: 0.5 }}
                label={'Name'}
                defaultValue={plugin.name}
                onChange={(ev) => setPlugin(o => ({...o, name: ev.target.value ?? '' } as Plugin))}
                fullWidth
              />

              <List
                sx={{ width: '100%', bgcolor: 'background.paper', overflow: 'auto', height: `calc(100vh - 200px - ${fileType === 'definition' ? 0 : 36.5}px)`, p:0,
                '& ul': { padding: 0 }, }}
                subheader={<li />}
              >
                <li key={`section-source-files`}>
                  <ul>
                    <ListSubheader sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, alignItems: 'center' }}>
                      <Button fullWidth color={fileType === 'definition' ? 'primary' : 'light'} onClick={() => setFileType('definition')}>Definition</Button>
                      <Typography sx={{ px: 2 }} variant='button'>/</Typography>
                      <Button fullWidth color={fileType === 'code' ? 'primary' : 'light'} onClick={() => setFileType('code')}>Source</Button>
                      <Typography sx={{ px: 2 }} variant='button'>/</Typography>
                      <Button fullWidth color={fileType === 'overlay' ? 'primary' : 'light'} onClick={() => setFileType('overlay')}>Overlay</Button>
                    </ListSubheader>

                    {fileType === 'definition' && <>
                      <ListItem
                        dense
                        sx={{ px: '8px', py: 0 }}>
                        <ListItemButton sx={{ height: '48px' }} onClick={() => setEditFile('global.d.ts')} selected={'global.d.ts' === editFile}>
                          <ListItemText>global.d.ts</ListItemText >
                        </ListItemButton>
                      </ListItem>
                    </>}

                    {fileType !== 'definition' && codeFiles.map(file => <ListItem
                      dense
                      key={file.id}
                      sx={{ px: '8px', py: 0 }}>
                      <ListItemButton onClick={() => setEditFile(file.id)} selected={file.id === editFile}>
                        <ListItemText>{file.name}</ListItemText >
                        <ListItemIcon sx={{ minWidth: 'inherit' }}>
                        <PopupState variant="popover" popupId="demo-popup-popover">
                          {(popupState) => (
                            <div>
                              <IconButton  aria-label="rename" {...bindTrigger(popupState)} onClick={(ev) => {
                                newFilename[file.id] = file.name;
                                bindTrigger(popupState).onClick(ev);
                              }}>
                                <DriveFileRenameOutlineTwoTone />
                              </IconButton>
                              <Popover
                                {...bindPopover(popupState)}
                                anchorOrigin={{
                                  vertical: 'bottom',
                                  horizontal: 'center',
                                }}
                                transformOrigin={{
                                  vertical: 'top',
                                  horizontal: 'center',
                                }}
                              >
                                <Stack direction='row' sx={{ p: 1, pt: 1.5 }} spacing={1}>
                                  <TextField
                                    defaultValue={file.name}
                                    label="New filename"
                                    size='small'
                                    variant='outlined'
                                    onKeyDown={(ev) => {
                                      if (ev.key === 'Enter') {
                                        ev.preventDefault()
                                        updateFileName(file.id) && popupState.close()
                                      }
                                    }}
                                    onChange={(ev) => setNewFilename(o => ({...o, [file.id]: ev.target.value ?? ''}))}
                                    fullWidth
                                  />
                                  <Button size='small' onClick={() => updateFileName(file.id) && popupState.close()} disabled={!newFilename[file.id] || newFilename[file.id].length === 0}>Change</Button>
                                </Stack>
                              </Popover>
                            </div>
                          )}
                        </PopupState>
                        </ListItemIcon>
                        {fileType === 'overlay' && <>
                        <ListItemIcon sx={{ minWidth: '40px' }}>
                          <IconButton edge="end" aria-label="comments">
                            <LinkTwoTone />
                          </IconButton>
                          </ListItemIcon>
                        <ListItemIcon sx={{ minWidth: '40px' }}>
                          <IconButton edge="end" aria-label="comments">
                            <ContentPasteTwoTone />
                          </IconButton>
                          </ListItemIcon>
                        </>}
                      </ListItemButton>
                    </ListItem>)}
                    </ul>
                  </li>
                </List>
                {fileType !== 'definition' && <Button fullWidth variant='text' onClick={addNewFile} sx={{
                  bgcolor: 'background.paper', borderTopLeftRadius: 0, borderTopRightRadius: 0,
                  '&:hover': {
                    bgcolor: '#ffa000', color: 'black'
                  }
                }}>Add new {fileType}</Button>}
          </Grid>
          <Grid xs sx={{
            height: '100%', backgroundColor: '#1e1e1e', p: 1,
          }}>
            {openedFileSource && <Editor
              height="100%"
              width="100%"
              language={'typescript'}
              theme='vs-dark'
              options={{
                readOnly: editFile.endsWith('d.ts'),
              }}
              onChange={(value) => updateFileSource(value ?? '')}
              key={openedFileSource.id}
              defaultValue={openedFileSource.source}
            />}
          </Grid>
        </Grid>
      </DialogContent>
    }

    <DialogActions sx={{ p: 0 }}>
      <Grid container justifyContent={'end'} spacing={1} sx={{ p: 1 }}>
        <Grid item>
          <Button sx={{ width: 150 }} onClick={handleClose}>Close</Button>
        </Grid>
        <Grid item>
          <LoadingButton variant='contained' color='primary' sx={{ width: 150 }} onClick={handleSave} loading={saving} disabled={haveErrors || loading}>Save</LoadingButton>
        </Grid>
      </Grid>
    </DialogActions>
  </Dialog>);
};