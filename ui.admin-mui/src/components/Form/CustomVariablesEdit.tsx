/* eslint-disable @typescript-eslint/ban-ts-comment */
import { mdiAlphabeticalVariant, mdiCodeBrackets, mdiCodeJson, mdiNumeric } from '@mdi/js';
import Icon from '@mdi/react';
import Editor, { useMonaco } from '@monaco-editor/react';
import { AddTwoTone, DeleteTwoTone } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import { Alert, Box, Button, Checkbox, Collapse, DialogActions, DialogContent, FormControl, FormLabel, Grid, IconButton, InputAdornment, InputLabel, LinearProgress, Link, MenuItem, Paper, Radio, Select, Slider, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { Variable } from '@sogebot/backend/dest/database/entity/variable';
import defaultPermissions from '@sogebot/backend/src/helpers/permissions/defaultPermissions';
import humanizeDuration from 'humanize-duration';
import { cloneDeep } from 'lodash';
import { nanoid } from 'nanoid';
import { useSnackbar } from 'notistack';
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLocalstorageState } from 'rooks';

import { usePermissions } from '../../hooks/usePermissions';
import { useTranslation } from '../../hooks/useTranslation';
import { useValidator } from '../../hooks/useValidator';

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
import { DAY } from '../../constants';
import { useAppSelector } from '../../hooks/useAppDispatch';
import axios from 'axios';
/* eslint-enable */

const createInitialItem = async () => {
  const response = await fetch(`${JSON.parse(localStorage.server)}/assets/custom-variables-code.txt`);
  return Object.assign(new Variable(), {
    variableName:  '',
    currentValue:  '',
    evalValue:     await response.text(),
    permission:    defaultPermissions.MODERATORS,
    responseType:  0,
    type:          'text',
    usableOptions: [],
    description:   '',
    history:       [],
    urls:          [],
    runEvery:      0,
    runAt:         new Date(0).toISOString(),
  });
};

export const CustomVariablesEdit: React.FC = () => {
  const [server] = useLocalstorageState('server', 'https://demobot.sogebot.xyz');

  const navigate = useNavigate();
  const { id } = useParams();

  const { permissions } = usePermissions();
  const { configuration } = useAppSelector(state => state.loader);
  const { translate } = useTranslation();
  const { propsError, reset, showErrors, validate, haveErrors } = useValidator({
    mustBeDirty: true, translations: { variableName: translate('name') }, schema: new Variable()._schema,
  });
  const [ page, setPage ] = useState(0);
  const [ item, setItem ] = useState<Variable>();
  const [ loading, setLoading ] = useState(true);
  const [ saving, setSaving ] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const monaco = useMonaco();

  useEffect(() => {
    // do conditional chaining
    const libUri = 'ts:filename/global.d.ts';
    const libSource = `
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

      declare function info(text: string): void;
      declare function warning(text: string): void;
      declare function user(username?: string): Promise<{ username: string, displayname: string, id: string, is: { follower: boolean, mod: boolean, online: boolean, subscriber: boolean, vip: boolean }}>
      declare function url(url: string, opts?: { method: 'POST' | 'GET', headers: object, data: object}): Promise<{ data: object, status: number, statusText: string}>
      declare function waitMs(miliseconds: number): Promise<undefined>
      declare function randomOnlineSubscriber(): Promise<User>
      declare function randomOnlineViewer(): Promise<User>
      declare function randomSubscriber(): Promise<User>
      declare function randomViewer(): Promise<User>

      declare var sender: {
        username: string,
        userId: string,
        source: 'twitch' | 'discord'
      } | null

      declare var _current: unknown;
      declare var param: string | number;

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
    `;

    monaco?.languages.typescript.javascriptDefaults.setCompilerOptions({
      allowNonTsExtensions: true,
      allowJs:              true,
      lib:                  ['es2020'],
    });
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
  }, [monaco]);

  const handleValueChange = useCallback(<T extends keyof Variable>(key: T, value: Variable[T]) => {
    if (!item) {
      return;
    }
    const update = cloneDeep(item);
    update[key] = value;
    setItem(update);
  }, [ item ]);

  const [ addUsableOptionValue, setAddUsableOptionValue ] = useState('');
  const addUsableOption = useCallback(() => {
    if (!item) {
      return;
    }
    handleValueChange('usableOptions', Array.from(new Set([...item.usableOptions, addUsableOptionValue])));
    setAddUsableOptionValue('');
  }, [ addUsableOptionValue, handleValueChange, item ]);

  const updateUsableOption = useCallback((idx: number, value: string) => {
    if (!item) {
      return;
    }
    const usableOptions = [...item.usableOptions];
    usableOptions[idx] = value;
    handleValueChange('usableOptions', usableOptions);
  }, [ handleValueChange, item ]);

  const removeUsableOption = useCallback((value: string) => {
    if (!item) {
      return;
    }
    handleValueChange('usableOptions', item.usableOptions.filter(o => o !== value));
  }, [ handleValueChange, item ]);

  const addURLOption = useCallback(() => {
    if (!item) {
      return;
    }
    handleValueChange('urls', [ ...item.urls, {
      id:           nanoid(),
      POST:         false,
      GET:          false,
      showResponse: false,
    }]);
  }, [ handleValueChange, item ]);

  const changeURLCheckbox = useCallback((idx: number, type: 'POST' | 'GET' | 'showResponse', checked: boolean) => {
    if (!item) {
      return;
    }
    const urls = item.urls ?? [];
    urls[idx][type] = checked;
    handleValueChange('urls', urls);
  }, [ item, handleValueChange ]);

  const removeURLOption = useCallback((urlId: string) => {
    if (!item) {
      return;
    }
    handleValueChange('urls', item.urls.filter(o => o.id !== urlId));
  }, [ handleValueChange, item ]);

  useEffect(() => {
    // auto select first value if type is options and curernt value doesnt match
    if (item && item.type === 'options') {
      if (!item.usableOptions.includes(item.currentValue)) {
        handleValueChange('currentValue', item.usableOptions[0] ?? '');
      }
    }
    // set to number
    if (item && item.type === 'number') {
      if (isNaN(Number(item.currentValue))) {
        handleValueChange('currentValue', '0');
      }
    }
  }, [ item, handleValueChange ]);

  const [ scriptIsRunning, setScriptIsRunning ] = useState(false);
  const handleRunScript = useCallback(() => {
    if (!item) {
      return;
    }
    setScriptIsRunning(true);
    axios.post(`/api/core/customvariables?_action=testScript`, {
      evalValue: item.evalValue, currentValue: item.currentValue,
    }).then(({ data }) => {
      handleValueChange('currentValue', data.data);
    })
      .catch(err => {
        enqueueSnackbar(String(err.response.data.errors), { variant: 'error' });
      })
      .finally(() => setScriptIsRunning(false));
  }, [ item, enqueueSnackbar, handleValueChange ]);

  useEffect(() => {
    setLoading(true);
    if (id) {
      axios.get(`/api/core/customvariables/`)
        .then(({ data }) => {
          const itemFromList = data.data.find((o: any) => o.id === id);
          if (itemFromList) {
            setItem(itemFromList);
            setLoading(false);
          } else {
            createInitialItem()
              .then(setItem)
              .finally(() => setLoading(false));
          }
        });
    } else {
      createInitialItem()
        .then(setItem)
        .finally(() => setLoading(false));
    }
    reset();
  }, [navigate, id, enqueueSnackbar, reset]);

  useEffect(() => {
    if (!loading && item) {
      validate(item);
    }
    if (loading) {
      reset();
    }
  }, [item, loading, reset]);

  const handleClose = () => {
    navigate(`/registry/customvariables/?server=${JSON.parse(localStorage.server)}`);
  };

  const handleSave = useCallback(() => {
    if (!item) {
      return;
    }
    setSaving(true);
    axios.post(`/api/core/customvariables/`, item)
      .then(({ data }) => {
        enqueueSnackbar('Custom variable saved.', { variant: 'success' });

        // replace url and add cid to item
        setItem(() => {
          item.id = data.data.id;
          return item;
        });
        const asPath = `/registry/customvariables/edit/${data.data.id}?server=${JSON.parse(localStorage.server)}`;
        window.history.replaceState(null, '', asPath);
      })
      .catch(showErrors)
      .finally(() => setSaving(false));
  }, [ item, enqueueSnackbar, validate ]);

  return(<>
    {loading && <LinearProgress />}
    <Collapse in={!loading}>
      <DialogContent dividers>
        { page === 0 && <Box
          component="form"
          sx={{ '& .MuiFormControl-root': { my: 0.5 } }}
          noValidate
          autoComplete="off"
        >
          <TextField
            fullWidth
            {...propsError('variableName')}
            variant="filled"
            required
            value={item?.variableName || ''}
            label={translate('properties.variableName')}
            onChange={(event) => handleValueChange('variableName', event.target.value)}
          />

          <Grid container columnSpacing={1}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                {...propsError('description')}
                variant="filled"
                value={item?.description || ''}
                label={translate('description')}
                onChange={(event) => handleValueChange('description', event.target.value)}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth variant="filled" >
                <InputLabel id="permission-select-label">{translate('permissions')}</InputLabel>
                <Select
                  label={translate('permissions')}
                  labelId="permission-select-label"
                  onChange={(event) => handleValueChange('permission', event.target.value)}
                  value={item?.permission || defaultPermissions.VIEWERS}
                >
                  {permissions?.map(o => (<MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Stack direction='row' spacing={4} alignItems='center' sx={{ py: 0.5 }}>
            <FormLabel>{ translate('type') }</FormLabel>
            <ToggleButtonGroup
              color='primary'
              value={item?.type || 'text'}
              sx={{ width: '100%' }}
              exclusive
              onChange={(_, val) => val && handleValueChange('type', val)}
              aria-label="text alignment"
            >
              <ToggleButton value="text" aria-label="text" sx={{ width: '100%' }} title='Text'>
                <Stack alignItems='center'>
                  <Icon style={{ width: '40px' }} size={'40px'} path={mdiAlphabeticalVariant} color='white'/>
                </Stack>
              </ToggleButton>
              <ToggleButton value="number" aria-label="number" sx={{ width: '100%' }}  title='Number'>
                <Stack alignItems='center'>
                  <Icon style={{ width: '40px' }} size={'40px'} path={mdiNumeric} color='white'/>
                </Stack>
              </ToggleButton>
              <ToggleButton value="options" aria-label="options" sx={{ width: '100%' }} title='Options'>
                <Stack alignItems='center'>
                  <Icon style={{ width: '40px' }} size={'40px'} path={mdiCodeBrackets} color='white'/>
                </Stack>
              </ToggleButton>
              <ToggleButton value="eval" aria-label="eval" sx={{ width: '100%' }} title='Script'>
                <Stack alignItems='center'>
                  <Icon style={{ width: '40px' }} size={'40px'} path={mdiCodeJson} color='white'/>
                </Stack>
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>

          {(item?.type !== 'options') && <TextField
            fullWidth
            {...propsError('currentValue')}
            variant="filled"
            type={item?.type === 'number' ? 'number' : 'text'}
            value={item?.currentValue || ''}
            disabled={item?.type === 'eval'}
            label={translate('registry.customvariables.currentValue.name')}
            onChange={(event) => handleValueChange('currentValue', event.target.value)}
          />}

          { item?.type === 'options' && <Box sx={{ pt: 2 }}>
            <FormLabel sx={{ pt: 2 }}>{ translate('registry.customvariables.usableOptions.name') }</FormLabel>
            <TextField
              fullWidth
              hiddenLabel
              variant="filled"
              value={addUsableOptionValue}
              onChange={(event) => setAddUsableOptionValue(event.target.value)}
              onKeyDown={ev => ev.key==='Enter' && addUsableOption()}
              InputProps={{
                endAdornment: <InputAdornment position='end'>
                  <IconButton disabled={addUsableOptionValue.trim().length === 0} onClick={addUsableOption}><AddTwoTone/></IconButton>
                </InputAdornment>,
              }}
            />

            { item.usableOptions.map((option, idx) =>
              <TextField
                key={idx}
                fullWidth
                hiddenLabel
                variant="filled"
                value={option}
                onChange={(event) => updateUsableOption(idx, event.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position='start'>
                    <Radio
                      checked={item.currentValue === option}
                      onChange={event => handleValueChange('currentValue', event.target.value)}
                      value={option}
                    />
                  </InputAdornment>,
                  endAdornment: <InputAdornment position='end'>
                    <IconButton onClick={() => removeUsableOption(option)}><DeleteTwoTone/></IconButton>
                  </InputAdornment>,
                }}
              />)}
          </Box>}

          {item?.type === 'eval' && <>
            <Editor
              height="44vh"
              width={`100%`}
              language={'javascript'}
              defaultValue={item?.evalValue || ''}
              theme='vs-dark'
              onChange={value => handleValueChange('evalValue', value || '')}
            />

            <Stack direction='row' spacing={2} alignItems="center" sx={{ padding: '15px 20px 30px 0' }}>
              <FormLabel sx={{ width: '170px' }}>{ translate('registry.customvariables.run-script') }</FormLabel>
              <Slider
                value={item?.runEvery || 0}
                max={7 * DAY}
                step={30000}
                valueLabelDisplay="on"
                valueLabelFormat={(value) => {
                  if (value === 0) {
                    return translate('registry.customvariables.runEvery.isUsed');
                  }
                  return humanizeDuration(value, { language: configuration.lang });
                }}
                size='small'
                onChange={(event, newValue) => handleValueChange('runEvery', Number(newValue))}
              />
            </Stack>
          </>}
        </Box> }

        { page === 1 && <Box>
          <Typography variant='h5' sx={{ pb: 2 }}>Configure REST Access</Typography>
          {(item?.urls ?? []).length === 0
            ? <Alert severity='info' variant='filled' action={
              <IconButton onClick={addURLOption} size='small'><AddTwoTone/></IconButton>
            }>No URLs were created yet.</Alert>
            : <TableContainer component={Paper}>
              <Table sx={{ minWidth: 650 }} aria-label="simple table">
                <TableHead>
                  <TableRow>
                    <TableCell>URL</TableCell>
                    <TableCell align="center">POST</TableCell>
                    <TableCell align="center">GET</TableCell>
                    <TableCell align="center">{translate('registry.customvariables.response.show')}</TableCell>
                    <TableCell align="center"></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {item?.urls.map((row, idx) => (
                    <TableRow
                      key={row.id}
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell component="th" scope="row">
                        <Link href={`${server}/customvariables/${row.id}`}>
                            /customvariables/{ row.id }
                        </Link>
                      </TableCell>
                      <TableCell align="center"><Checkbox checked={row.POST} onChange={(_, checked) => changeURLCheckbox(idx, 'POST', checked)}/></TableCell>
                      <TableCell align="center"><Checkbox checked={row.GET} onChange={(_, checked) => changeURLCheckbox(idx, 'GET', checked)}/></TableCell>
                      <TableCell align="center"><Checkbox checked={row.showResponse}onChange={(_, checked) => changeURLCheckbox(idx, 'showResponse', checked)}/></TableCell>
                      <TableCell align="right">
                        <IconButton onClick={() => removeURLOption(row.id)}><DeleteTwoTone/></IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>}
        </Box>}
      </DialogContent>
    </Collapse>
    <DialogActions>
      {!loading ? <>
        <Grid container sx={{ height: '100%' }} justifyContent={'end'} spacing={1}>
          <Grid item sx={{ marginRight: 'auto' }}>
            { page === 0
              ? <Button sx={{ width: '200px !important' }} onClick={() => setPage(1)} color='light'>Configure REST Access</Button>
              : <Button sx={{ width: '200px !important' }} onClick={() => setPage(0)} color='light'>Configure Variable</Button>
            }
          </Grid>
          {item?.type === 'eval' && <Grid item>
            <LoadingButton loading={scriptIsRunning} color='light' variant='contained' onClick={handleRunScript}>Run Script</LoadingButton>
          </Grid>}
          { page === 1 && <Grid item>
            <Button color='light' variant='contained' onClick={addURLOption}>Add new URL</Button>
          </Grid>}
          <Grid item>
            <Button onClick={handleClose}>Close</Button>
          </Grid>
          <Grid item>
            <LoadingButton variant='contained' color='primary' onClick={handleSave} loading={saving} disabled={haveErrors || loading}>Save</LoadingButton>
          </Grid>
        </Grid>
      </>
        : <Grid container sx={{ height: '100%' }} justifyContent={'end'} spacing={1}>
          <Grid item>
            <Button onClick={handleClose}>Close</Button>
          </Grid>
        </Grid>}
    </DialogActions>
  </>);
};