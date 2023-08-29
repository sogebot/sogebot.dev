import Editor, { Monaco }  from '@monaco-editor/react';
import { LoadingButton } from '@mui/lab';
import {
  Box,
  Button, Checkbox, Dialog, DialogActions, DialogContent,
  Divider, FormControlLabel, Grid, LinearProgress, List,
  ListItem, ListItemButton, ListItemText,
  ListSubheader, Menu, MenuItem, Popover, Stack,
  TextField, Tooltip, Typography,
} from '@mui/material';
import { Plugin } from '@sogebot/backend/dest/database/entity/plugins';
import PopupState, { bindPopover, bindTrigger } from 'material-ui-popup-state';
import { useSnackbar } from 'notistack';
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import shortid from 'shortid';

import { cloneIncrementName } from '../../helpers/cloneIncrementName';
import { getSocket } from '../../helpers/socket';
import { useValidator } from '../../hooks/useValidator';
import { ExportDialog } from '../Plugin/ExportDialog';
import { ImportDialog } from '../Plugin/ImportDialog';

const leftPanelWidth = 352;

type File = {
  id: string;
  name: string;
  source: string;
};

const libSource
  = `type UserState = { userName: string, userId: string }
type AlertsCustomOptions = {
  volume?: number;
  alertDuration? : number;
  textDelay? : number;
  layout? : number;
  messageTemplate? : string;
  audioId? : string;
  mediaId? : string;
}

/**
 * ListenTo contains all usable listeners for Twitch and other available services.
 */
declare const ListenTo: {
  Bot: {
    /**
     * Triggers when bot is started
     */
    started(callback: () => void): void,
  }

  /**
   * Register cron to trigger function in intervals
   * @param cron cron schedule (seconds supported) - https://elmah.io/tools/cron-parser/
   * @example Run cron every 5 seconds
   *
   *    ListenTo.Cron('0/5 * * * * *', () => {
   *
   *      // your function logic here
   *
   *    })
   *
   * @example Run cron every 5 minutes (notice seconds can be omitted)
   *
   *    ListenTo.Cron('0/5 * * * *', () => {
   *
   *      // your function logic here
   *
   *    })
   *
   */
  Cron(cron: string, callback: () => void): void;

  Generic: {
    /**
     *  Listen to Generic tip event
     *  @param callback.userState contains userId and userName
     *  @param callback.params contains additional data
     *  @example
     *
     *    ListenTo.Generic.onTip((userState, params) => {
     *
     *      // your function logic here
     *
     *    })
     *
     */
    onTip(callback: (userState: UserState, message: string, params: { isAnonymous: boolean; amount: string; currency: string; amountInBotCurrency: string; currencyInBot: string; }) => void): void,
  };

  /**
   * Twitch listeners
   */
  Twitch: {
    /**
     * Listen to specified Twitch command
     * @param opts.command command to listen to, e.g. '!myCustomCommand'
     * @param opts.customArgSplitter defines custom splitter for args after command, by default split by empty space
     * @param callback.userState contains userId and userName
     * @param callback.commandArgs contains all args split by space
     * @example
     *
     *    ListenTo.Twitch.onCommand({ command: '!me' }, (userState, ....commandArgs) => {
     *
     *      // your function logic here
     *
     *    })
     *
     */
    onCommand(opts: { command: string }, callback: (userState: UserState, ...commandArgs: string[]) => void): void;
    /**
     *  Listen to Twitch follow event
     *  @param callback.userState contains userId and userName
     *  @example
     *
     *    ListenTo.Twitch.onFollow((userState) => {
     *
     *      // your function logic here
     *
     *    })
     *
     */
    onFollow(callback: (userState: UserState) => void): void,
    /**
     *  Listen to Twitch raid event
     *  @param callback.userState contains userId and userName
     *  @param callback.params contains additional data
     *  @example
     *
     *    ListenTo.Twitch.onRaid((userState, params) => {
     *
     *      // your function logic here
     *
     *    })
     *
     */
    onRaid(callback: (userState: UserState, params: { hostViewers: number; event: string; timestamp: number; }) => void): void,
    /**
     *  Listen to Twitch resubscripton event
     *  @param callback.userState contains userId and userName
     *  @param callback.params contains additional data
     *  @example
     *
     *    ListenTo.Twitch.onResub((userState, params) => {
     *
     *      // your function logic here
     *
     *    })
     *
     */
    onSubscription(callback: (userState: UserState, params: { method: string, subCumulativeMonths: number, tier: string }) => void): void,
    /**
     *  Listen to Twitch resubscripton event
     *  @param callback.userState contains userId and userName
     *  @param callback.params contains additional data
     *  @example
     *
     *    ListenTo.Twitch.onResub((userState, params) => {
     *
     *      // your function logic here
     *
     *    })
     *
     */
    onResub(callback: (userState: UserState, params: { subStreakShareEnabled: boolean; subStreak: number; subStreakName: string; subCumulativeMonthsName: string; message: string; subCumulativeMonths: number; tier: string; }) => void): void,
    /**
     *  Listen to Twitch reward redemption event
     *  @param callback.userState contains userId and userName
     *  @param callback.params contains additional data
     *  @example
     *
     *    ListenTo.Twitch.onRewardRedeem((userState, params) => {
     *
     *      // your function logic here
     *
     *    })
     *
     */
    onRewardRedeem(callback: (userState: UserState, params: { rewardId: string; userInput: string; }) => void): void,
    /**
     *  Listen to Twitch reward subgift event
     *  @param callback.userState contains userId and userName
     *  @param callback.params contains additional data
     *  @example
     *
     *    ListenTo.Twitch.onSubGift((userState, params) => {
     *
     *      // your function logic here
     *
     *    })
     *
     */
    onSubGift(callback: (userState: UserState, params: { recipient: string; tier: number }) => void): void,
    /**
     *  Listen to Twitch reward subgift event
     *  @param callback.userState contains userId and userName
     *  @param callback.params contains additional data
     *  @example
     *
     *    ListenTo.Twitch.onSubCommunityGift((userState, params) => {
     *
     *      // your function logic here
     *
     *    })
     *
     */
    onSubCommunityGift(callback: (userState: UserState, params: { count: number }) => void): void,
    /**
     *  Listen to Twitch reward redemption event
     *  @param callback.userState contains userId and userName
     *  @param callback.params contains additional data
     *  @example
     *
     *    ListenTo.Twitch.onRewardRedeem((userState, params) => {
     *
     *      // your function logic here
     *
     *    })
     *
     */
    onRewardRedeem(callback: (userState: UserState, params: { rewardId: string; userInput: string; }) => void): void,
    /**
     *  Listen to regular Twitch messages
     *  @param callback.userState contains userId and userName
     *  @param callback.message contains full message
     *  @example
     *
     *    ListenTo.Twitch.onMessage((userState, message) => {
     *
     *      // your function logic here
     *
     *    })
     *
     */
    onMessage(callback: (userState: UserState, message: string) => void): void,
    /**
     *  Listen to stream start event
     *  @example
     *
     *    ListenTo.Twitch.onStreamStart(() => {
     *
     *      // your function logic here
     *
     *    })
     *
     */
    onStreamStart(callback: () => void): void,
    /**
     *  Listen to stream stop event
     *  @example
     *
     *    ListenTo.Twitch.onStreamStop(() => {
     *
     *      // your function logic here
     *
     *    })
     *
     */
    onStreamStop(callback: () => void): void,
    /**
     *  Listen to chat cleared event
     *  @example
     *
     *    ListenTo.Twitch.onChatClear(() => {
     *
     *      // your function logic here
     *
     *    })
     *
     */
    onChatClear(callback: () => void): void,
    /**
     *  Listen to category change event
     *  @param callback.category current category set
     *  @param callback.oldCategory previous category
     *  @example
     *
     *    ListenTo.Twitch.onCategoryChange((category, oldCategory) => {
     *
     *      // your function logic here
     *
     *    })
     *
     */
    onCategoryChange(callback: (category: string, oldCategory: string) => void): void,
    /**
     *  Listen to received bits/cheer event
     *  @param callback.userState contains userId and userName
     *  @param callback.amount how many bits received
     *  @param callback.message contains full message
     *  @example
     *
     *    ListenTo.Twitch.onCheer((userState, amount, message) => {
     *
     *      // your function logic here
     *
     *    })
     *
     */
    onCheer(callback: (userState: UserState, amount: number, message: string) => void): void,
  },
}

declare const Twitch: {
  /**
   * Bot will send message to chat
   * */
  sendMessage(message:string): void;
  timeout(userId: string, seconds: number, reason?: string): void;
  ban(userId: string, reason?: string): void;
}
declare const Overlay: {
  /**
   * Trigger emote explosion in emote explosion overlay (not plugin overlay)
  *  @example
  *
  *    Overlay.emoteExplosion(['Kappa', 'PogChamp']);
  *
  */
  emoteExplosion(emotes: string[]): void;
  /**
   * Trigger emote firework in emote firework overlay (not plugin overlay)
  *  @example
  *
  *    Overlay.emoteFirework(['Kappa', 'PogChamp']);
  *
  */
  emoteFirework(emotes: string[]): void;
  /**
   * Trigger function in overlay
  *  @example
  *
  *    Overlay.runFunction('test', ['a', 1, true]);
  *
  */
  runFunction(functionName: string, args: (string|number|boolean)[], overlayId?: string): void;
}
declare const Permission: {
  /**
   * Check if user have access to this permissionId
   * */
  accessTo(userId: string, permissionId: string): Promise<boolean>;
}
declare const Log: {
  info(text: string): void,
  warning(text: string): void
}

declare const Alerts: {
  trigger(uuid: string, name?: string, message?: string, customOptions?: AlertsCustomOptions): Promise<void>,
}

declare const User: {
  getByUserId(userId: string): Promise<User>,
  getByUserName(userName: string): Promise<User>,
  getRandom: {
    subscriber(onlineOnly: boolean): Promise<User>,
    viewer(onlineOnly: boolean): Promise<User>,
  }
}

declare const Points: {
  increment(userName: string, value: number): Promise<void>,
  decrement(userName: string, value: number): Promise<void>
}

declare const Variable: {
  loadFromDatabase(variableName: string): Promise<null | any>,
  saveToDatabase(variableName: string, value: any): Promise<void>
  setCustomVariable(variableName: string, value: any): Promise<void>
  getCustomVariable(variableName: string): Promise<string>
}
/**
 * Contains core permissions defined by bot
 * */
declare const permission = {
  CASTERS:     '4300ed23-dca0-4ed9-8014-f5f2f7af55a9',
  MODERATORS:  'b38c5adb-e912-47e3-937a-89fabd12393a',
  SUBSCRIBERS: 'e3b557e7-c26a-433c-a183-e56c11003ab7',
  VIP:         'e8490e6e-81ea-400a-b93f-57f55aad8e31',
  VIEWERS:     '0efd7b1c-e460-4167-8e06-8aaf2c170311',
} as const

declare function fetch(uri: string, config: AxiosRequestConfig): Promise<AxiosResponse<any, any>.data: any>

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
  name: string,
}
`;

export const PluginsEdit: React.FC = () => {
  const navigate = useNavigate();
  const { type, id } = useParams();
  const { enqueueSnackbar } = useSnackbar();
  const { propsError, reset, validate, haveErrors, showErrors } = useValidator();

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const [fileType, setFileType] = React.useState('code');
  const [contextMenuFile, setContextMenuFile] = React.useState<File | null>(null);
  const [editFile, setEditFile] = React.useState('');

  const [contextMenu, setContextMenu] = React.useState<{
    mouseX: number;
    mouseY: number;
  } | null>(null);

  const handleContextMenu = (event: React.MouseEvent, file: File) => {
    event.preventDefault();
    setContextMenuFile(file);
    setContextMenu(
      contextMenu === null
        ? {
          mouseX: event.clientX + 2,
          mouseY: event.clientY - 6,
        } : null,
      // repeated contextmenu when it is already open closes it with Chrome 84 on Ubuntu
      // Other native context menus might behave different.
      // With this behavior we prevent contextmenu from the backdrop to re-locale existing context menus.
    );
  };

  const [newFilename, setNewFilename] = React.useState<{
    [id: string]: string
  }>({});
  const [plugin, setPlugin] = React.useState<Plugin | null>(null);
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
      return {
        ...pl, workflow: JSON.stringify(workflow),
      } as Plugin;
    });
    return newFilename[fId] && newFilename[fId].length > 0;
  }, [newFilename]);
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
      return {
        ...pl, workflow: JSON.stringify(workflow),
      } as Plugin;
    });
    return true;
  }, [editFile]);

  const removeFile = (fileId: string) => {
    if (!plugin) {
      return;
    }

    const workflow = JSON.parse(plugin.workflow);
    workflow.code = workflow.code.filter((o: File) => o.id !== fileId);
    workflow.overlay = workflow.overlay.filter((o: File) => o.id !== fileId);
    setPlugin({
      ...plugin, workflow: JSON.stringify(workflow),
    } as Plugin);
  };

  const addNewFile = () => {
    if (!plugin) {
      return;
    }

    const workflow = JSON.parse(plugin.workflow);
    workflow[fileType].push({
      name:   cloneIncrementName(`unnamed file`, workflow[fileType].map((o: File) => o.name)),
      source: fileType === 'overlay'
        ? `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
    <!-- Your content goes here -->

    <script type="text/javascript">
        // Your JavaScript code goes here
    </script>
</body>
</html>`
        : '',
      id: shortid(),
    });
    setPlugin({
      ...plugin, workflow: JSON.stringify(workflow),
    } as Plugin);
  };

  function configureMonaco(monaco: Monaco): Monaco {
    console.log('Configuring monaco');
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      allowNonTsExtensions: true,
      allowJs:              true,
      lib:                  ['es2021'],
    });
    monaco?.languages.typescript.javascriptDefaults.setCompilerOptions({
      allowNonTsExtensions: true,
      allowJs:              true,
      lib:                  ['es2021'],
    });

    // do conditional chaining
    const libUri = 'ts:filename/global.d.ts';
    try {
      monaco.editor.createModel(libSource, 'typescript', monaco.Uri.parse(libUri));

      // When resolving definitions and references, the editor will try to use created models.
      // Creating a model for the library allows "peek definition/references" commands to work with the library.
      monaco.languages.typescript.typescriptDefaults.addExtraLib(libSource, libUri);
      monaco.languages.typescript.javascriptDefaults.addExtraLib(libSource, libUri);
    } catch {
      null;
    }
    return monaco;
  }

  const codeFiles = React.useMemo<File[]>(() => {
    if (!plugin) {
      return [];
    }
    return JSON.parse(plugin.workflow)[fileType];
  }, [plugin?.workflow, fileType]);

  const openedFileSource = React.useMemo<File | null>(() => {
    if (!plugin) {
      return null;
    }
    if (editFile === 'global.d.ts') {
      return {
        id:     'global.d.ts',
        name:   '',
        source: libSource,
      };
    }

    const workflow = JSON.parse(plugin.workflow);

    for (const file of [...workflow.code, ...workflow.overlay]) {
      if (file.id === editFile) {
        return file;
      }
    }
  }, [plugin?.workflow, editFile]);

  const open = React.useMemo(() => !!(type
    && (
      (type === 'edit' && id)
      || type === 'create'
    )
  ), [type, id]);

  const openedFileType = React.useMemo(() => {
    if (!plugin || editFile === 'global.d.ts') {
      return 'code';
    }

    const workflow = JSON.parse(plugin.workflow);

    for (const file of workflow.overlay) {
      if (file.id === editFile) {
        return 'overlay';
      }
    }

    return 'code';
  }, [plugin?.workflow, editFile]);

  const handleClose = () => {
    setTimeout(() => {
      navigate(`/registry/plugins?server=${ JSON.parse(localStorage.server) }`);
    }, 200);
  };

  React.useEffect(() => {
    if (type === 'create') {
      setLoading(false);
      setPlugin({
        id:       shortid(),
        name:     '',
        enabled:  true,
        workflow: JSON.stringify({
          code:    [],
          overlay: [],
        }),
        settings: null,
      } as Plugin);
    } else {
      getSocket('/core/plugins').emit('generic::getOne', id, (err, item) => {
        if (err) {
          enqueueSnackbar(String(err), { action: 'error' });
          console.error(err);
        }
        setPlugin(item);
        setLoading(false);
      });
    }
    reset();
  }, [type, id, reset]);

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
        navigate(`/registry/plugins/edit/${ savedItem.id }?server=${ JSON.parse(localStorage.server) }`);
      }
      setSaving(false);
    });
  };

  const copyToClipboard = (pluginId: string, overlayId: string) => {
    const data = Buffer.from(JSON.stringify({
      server: JSON.parse(localStorage.server),
      pluginId,
      overlayId,
    })).toString('base64');
    navigator.clipboard.writeText(`${ location.origin }/overlays/${ data }`);
    enqueueSnackbar('Link copied to clipboard.');
  };

  return (<Dialog open={open} fullScreen sx={{ p: 5 }} scroll='paper' >
    {(loading || !plugin) ? <>
      <LinearProgress />
      <DialogContent />
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
            <Stack sx={{ p: 1 }} direction='row'>
              <Box sx={{ width: '100%' }}>
                <ExportDialog model={plugin}/>
                <ImportDialog onImport={(items) => {
                  setPlugin(o => ({
                    ...o, workflow: items,
                  } as Plugin));
                }}/>
              </Box>
              <FormControlLabel
                value="end"
                control={<Checkbox checked={plugin.enabled} onChange={(_, checked) => setPlugin(o => ({
                  ...o, enabled: checked, 
                }) as Plugin)} />}
                label="Enabled"
                labelPlacement="end"
              />
            </Stack>

            <TextField
              {...propsError('name')}
              sx={{ mb: 0.5 }}
              label={'Name'}
              defaultValue={plugin.name}
              onChange={(ev) => setPlugin(o => ({
                ...o, name: ev.target.value ?? '',
              } as Plugin))}
              fullWidth
            />

            <List
              sx={{
                width:    '100%',
                bgcolor:  'background.paper',
                overflow: 'auto',
                height:   `calc(100vh - 258px - ${ fileType === 'definition' ? 0 : 36.5 }px)`,
                p:        0,
                '& ul':   { padding: 0 },
              }}
              subheader={<li />}
            >
              <li key={`section-source-files`}>
                <ul>
                  <ListSubheader sx={{
                    display: 'flex', justifyContent: 'space-between', py: 0.5, alignItems: 'center',
                  }}>
                    <Button fullWidth color={fileType === 'definition' ? 'primary' : 'light'} onClick={() => setFileType('definition')}>Definition</Button>
                    <Typography sx={{ px: 2 }} variant='button'>/</Typography>
                    <Button fullWidth color={fileType === 'code' ? 'primary' : 'light'} onClick={() => setFileType('code')}>Source</Button>
                    <Typography sx={{ px: 2 }} variant='button'>/</Typography>
                    <Button fullWidth color={fileType === 'overlay' ? 'primary' : 'light'} onClick={() => setFileType('overlay')}>Overlay</Button>
                  </ListSubheader>

                  {fileType === 'definition' && <>
                    <ListItem
                      dense
                      sx={{
                        px: '8px', py: 0,
                      }}>
                      <ListItemButton sx={{ height: '48px' }} onClick={() => setEditFile('global.d.ts')} selected={'global.d.ts' === editFile}>
                        <ListItemText>global.d.ts</ListItemText >
                      </ListItemButton>
                    </ListItem>
                  </>}

                  {fileType !== 'definition' && codeFiles.map(file => <ListItem
                    dense
                    key={file.id}
                    sx={{
                      px: '8px', py: 0,
                    }}>
                    <Tooltip title="Right click for menu" disableInteractive>
                      <ListItemButton sx={{ height: '48px' }} onContextMenu={ev => handleContextMenu(ev, file)} onClick={() => setEditFile(file.id)} selected={file.id === editFile}>
                        <ListItemText>{file.name}</ListItemText >
                      </ListItemButton>
                    </Tooltip>
                  </ListItem>)}
                </ul>
              </li>
            </List>

            <Menu
              open={contextMenu !== null}
              onClose={() => setContextMenu(null)}
              anchorReference="anchorPosition"
              anchorPosition={
                contextMenu !== null
                  ? {
                    top: contextMenu.mouseY, left: contextMenu.mouseX,
                  }
                  : undefined
              }
            >
              <PopupState variant="popover" popupId="demo-popup-popover">
                {(popupState) => (
                  <div>
                    {fileType === 'overlay' && <MenuItem sx={{ width: '100%' }} dense onClick={() => {
                      if (!contextMenuFile) {
                        return;
                      }
                      copyToClipboard(plugin.id, contextMenuFile.id);
                      setContextMenu(null);
                    }}>Copy link to clipboard</MenuItem>}
                    <MenuItem sx={{
                      mb: 1, width: '200px',
                    }} dense onClick={(ev) => {
                      if (!contextMenuFile) {
                        return;
                      }
                      newFilename[contextMenuFile.id] = contextMenuFile.name;
                      bindTrigger(popupState).onClick(ev);
                    }}>Rename</MenuItem>
                    <Popover
                      {...bindPopover(popupState)}
                      anchorOrigin={{
                        vertical:   'bottom',
                        horizontal: 'center',
                      }}
                      transformOrigin={{
                        vertical:   'top',
                        horizontal: 'center',
                      }}
                    >
                      {contextMenuFile && <Stack direction='row' sx={{
                        p: 1, pt: 1.5,
                      }} spacing={1}>
                        <TextField
                          defaultValue={contextMenuFile.name}
                          label="New filename"
                          size='small'
                          variant='outlined'
                          onKeyDown={(ev) => {
                            if (ev.key === 'Enter') {
                              ev.preventDefault();
                              updateFileName(contextMenuFile.id) && popupState.close();
                            }
                          }}
                          onChange={(ev) => setNewFilename(o => ({
                            ...o, [contextMenuFile.id]: ev.target.value ?? '',
                          }))}
                          fullWidth
                        />
                        <Button size='small' onClick={() => {
                          updateFileName(contextMenuFile.id);
                          setContextMenu(null);
                          popupState.close();
                        }} disabled={!newFilename[contextMenuFile.id] || newFilename[contextMenuFile.id].length === 0}>Change</Button>
                      </Stack>}
                    </Popover>
                  </div>
                )}
              </PopupState>

              <Divider />
              <MenuItem sx={{ mt: 1 }} dense onClick={() => {
                if (!contextMenuFile) {
                  return;
                }
                removeFile(contextMenuFile.id);
                setContextMenu(null);
              }}>Delete file</MenuItem>
            </Menu>

            {fileType !== 'definition' && <Button fullWidth variant='text' onClick={addNewFile} sx={{
              bgcolor:              'background.paper',
              borderTopLeftRadius:  0,
              borderTopRightRadius: 0,
              '&:hover':            {
                bgcolor: '#ffa000', color: 'black',
              },
            }}>Add new {fileType}</Button>}
          </Grid>
          <Grid xs sx={{
            height: '100%', backgroundColor: '#1e1e1e', p: 1,
          }}>
            {openedFileSource && <Editor
              height="100%"
              width="100%"
              language={openedFileType === 'overlay' ? 'html' : 'typescript'}
              theme='vs-dark'
              options={{ readOnly: editFile.endsWith('d.ts') }}
              onChange={(value) => updateFileSource(value ?? '')}
              key={openedFileSource.id}
              defaultValue={openedFileSource.source}
              beforeMount={configureMonaco}
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