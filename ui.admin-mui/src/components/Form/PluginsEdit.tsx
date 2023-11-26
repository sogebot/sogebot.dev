import Editor, { Monaco }  from '@monaco-editor/react';
import { LoadingButton } from '@mui/lab';
import { Box, Button, Checkbox, Dialog, DialogActions, DialogContent, Divider, Fade, FormControlLabel, Grid, LinearProgress, List, ListItem, ListItemButton, ListItemText, ListSubheader, Menu, MenuItem, Popover, Stack, TextField, Tooltip, Typography } from '@mui/material';
import { Plugin } from '@sogebot/backend/dest/database/entity/plugins';
import PopupState, { bindPopover, bindTrigger } from 'material-ui-popup-state';
import { nanoid } from 'nanoid';
import { useSnackbar } from 'notistack';
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { cloneIncrementName } from '../../helpers/cloneIncrementName';
import { getSocket } from '../../helpers/socket';
import { useValidator } from '../../hooks/useValidator';
import { ExportDialog } from '../Plugin/ExportDialog';
import { ImportDialog } from '../Plugin/ImportDialog';

/* eslint-disable */
// @ts-ignore: TS2307
import libSource from '!raw-loader!./assets/plugin.global.d.ts';
/* eslint-enable */

const leftPanelWidth = 352;

type File = {
  id:     string;
  name:   string;
  source: string;
};

export const PluginsEdit: React.FC = () => {
  const navigate = useNavigate();
  const { type, id } = useParams();
  const { enqueueSnackbar } = useSnackbar();
  const { propsError, reset, validate, haveErrors, showErrors } = useValidator({ schema: new Plugin().schema });

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
      id: nanoid(),
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
        id:       nanoid(),
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
      validate(plugin);
    }
  }, [plugin, loading]);

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
      <DialogContent dividers sx={{ p: 0 }}/>
    </>
      : <Fade in={true}>
        <DialogContent dividers sx={{ p: 0 }}>
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
              height:          '100%',
              backgroundColor: '#1e1e1e',
              p:               1,
              width:           '1px', /* fixes editor width extending over 100% when ctrl+space is pressed */
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
      </Fade>
    }

    <DialogActions>
      <Button onClick={handleClose}>Close</Button>
      <LoadingButton variant='contained' color='primary' onClick={handleSave} loading={saving} disabled={haveErrors || loading}>Save</LoadingButton>
    </DialogActions>
  </Dialog>);
};