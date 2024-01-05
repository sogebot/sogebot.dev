import { DeleteTwoTone } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import { Box, Button, Checkbox, FormControlLabel, FormGroup, IconButton, Paper, Stack, TextField, Typography } from '@mui/material';
import React, { useCallback, useEffect, useMemo } from 'react';
import { useRefElement } from 'rooks';

import { useAppSelector } from '../../../hooks/useAppDispatch';
import { useSettings } from '../../../hooks/useSettings';
import { useTranslation } from '../../../hooks/useTranslation';

const PageSettingsModulesSystemsEmotesCombo: React.FC<{
  onVisible: () => void,
}> = ({
  onVisible,
}) => {
  const validator = useMemo(() => ({
    'comboCooldown': [
      (value: string) => String(value).length > 0 || 'isNotEmpty',
      (value: string) => !isNaN(Number(value)) || 'isInt',
      (value: string) => Number(value) >= 0 || 'min|0',
    ],
    'comboMessageMinThreshold': [
      (value: string) => String(value).length > 0 || 'isNotEmpty',
      (value: string) => !isNaN(Number(value)) || 'isInt',
      (value: string) => Number(value) >= 0 || 'min|0',
    ],
    'comboMessages': [
      // check messages
      (values: { message: string }[]) => {
        const toReturn: string[] = [];
        for (let i = 0; i < values.length; i++) {
          if (String(values[i].message).length === 0) {
            toReturn.push(`isNotEmpty:message:${i}`);
          }
        }
        return toReturn.length > 0 ? toReturn : true;
      },
      // check messagesCount
      (values: { messagesCount: number }[]) => {
        const toReturn: string[] = [];
        for (let i = 0; i < values.length; i++) {
          if (String(values[i].messagesCount).length === 0) {
            toReturn.push(`isNotEmpty:messagesCount:${i}`);
          } else if (isNaN(Number(values[i].messagesCount))) {
            toReturn.push(`isInt:messagesCount:${i}`);
          } else if (Number(values[i].messagesCount) < 0) {
            toReturn.push(`min:messagesCount:${i}|0`);
          }
        }
        return toReturn.length > 0 ? toReturn : true;
      },
    ],
    'hypeMessages': [
      // check messages
      (values: { message: string }[]) => {
        const toReturn: string[] = [];
        for (let i = 0; i < values.length; i++) {
          if (String(values[i].message).length === 0) {
            toReturn.push(`isNotEmpty:message:${i}`);
          }
        }
        return toReturn.length > 0 ? toReturn : true;
      },
      // check messagesCount
      (values: { messagesCount: number }[]) => {
        const toReturn: string[] = [];
        for (let i = 0; i < values.length; i++) {
          if (String(values[i].messagesCount).length === 0) {
            toReturn.push(`isNotEmpty:messagesCount:${i}`);
          } else if (isNaN(Number(values[i].messagesCount))) {
            toReturn.push(`isInt:messagesCount:${i}`);
          } else if (Number(values[i].messagesCount) < 0) {
            toReturn.push(`min:messagesCount:${i}|0`);
          }
        }
        return toReturn.length > 0 ? toReturn : true;
      },
    ],
  }), []);

  const { translate } = useTranslation();

  const { settings, loading, refresh, save, saving, errors, handleChange, TextFieldProps } = useSettings('/systems/emotescombo' as any, validator);

  useEffect(() => {
    refresh();
  }, [ ]);

  const [ref, element]  = useRefElement<HTMLElement>();
  const scrollY = useAppSelector(state => state.page.scrollY);
  useEffect(() => {
    if (element) {
      if (element.offsetTop < scrollY + 100 && element.offsetTop + element.clientHeight > scrollY - 100) {
        onVisible();
      }
    }
  }, [element, scrollY, onVisible]);

  const handleItemUpdate = useCallback((idx: number, attr: 'comboMessages' | 'hypeMessages', type: 'message' | 'messagesCount', value: string) => {
    const update = { ...settings };
    update[attr][0][idx][type] = value;
    handleChange(attr, update[attr][0]);
  }, [ settings, handleChange ]);

  const handleItemAdd = useCallback((attr: 'comboMessages' | 'hypeMessages') => {
    const update = { ...settings };
    update[attr][0].push({
      message: '', messagesCount: -1,
    });
    handleChange(attr, update[attr][0]);
  }, [ settings, handleChange ]);

  const handleItemDelete = useCallback((idx: number, attr: 'comboMessages' | 'hypeMessages') => {
    const update = { ...settings };
    update[attr][0].splice(idx, 1);
    handleChange(attr, update[attr][0]);
  }, [ settings, handleChange ]);

  return (loading ? null : <Box ref={ref} id="emotescombo">
    <Typography variant='h2' sx={{ pb: 2 }}>{ translate('menu.emotescombo') }</Typography>
    {settings && <Paper elevation={1} sx={{ p: 1 }}>
      <Stack spacing={1}>
        <TextField
          helperText={TextFieldProps('comboCooldown').helperText ?? translate('overlays.emotes.settings.comboCooldown.help')}
          {...TextFieldProps('comboCooldown')}
          variant='filled'
          fullWidth
          type='number'
          value={settings.comboCooldown[0]}
          label={translate('overlays.emotes.settings.comboCooldown.title')}
          onChange={(event) => handleChange('comboCooldown', event.target.value)}
        />
        <TextField
          helperText={TextFieldProps('comboMessageMinThreshold').helperText ?? translate('overlays.emotes.settings.comboMessageMinThreshold.help')}
          {...TextFieldProps('comboMessageMinThreshold')}
          variant='filled'
          fullWidth
          type='number'
          value={settings.comboMessageMinThreshold[0]}
          label={translate('overlays.emotes.settings.comboMessageMinThreshold.title')}
          onChange={(event) => handleChange('comboMessageMinThreshold', event.target.value)}
        />
      </Stack>
    </Paper>}

    <Typography variant='h5' sx={{ py: 2 }}>{ translate('categories.comboBreakMessages') }</Typography>
    {settings && <Paper elevation={1} sx={{ p: 1 }}>
      <Stack spacing={1}>
        {settings.comboMessages[0].map((item: { message: string, messagesCount: number }, idx: number) => <Stack spacing={1} direction='row' key={idx} alignItems='baseline'>
          <TextField
            {...TextFieldProps(`comboMessages.message.${idx}`)}
            helperText={TextFieldProps(`comboMessages.message.${idx}`).helperText || ' '}
            fullWidth
            label={translate('overlays.emotes.settings.message')}
            variant="filled"
            value={item.message}
            onChange={(event) => handleItemUpdate(idx, 'comboMessages', 'message', event.target.value)}
          />
          <TextField
            {...TextFieldProps(`comboMessages.messagesCount.${idx}`)}
            sx={{ width: 100 }}
            helperText={TextFieldProps(`comboMessages.messagesCount.${idx}`).helperText || ' '}
            fullWidth
            label={translate('overlays.emotes.settings.threshold')}
            variant="filled"
            type='number'
            value={item.messagesCount}
            onChange={(event) => handleItemUpdate(idx, 'comboMessages', 'messagesCount', event.target.value)}
          />
          <IconButton sx={{ height: 'fit-content' }} color='error' onClick={() => handleItemDelete(idx, 'comboMessages')}><DeleteTwoTone/></IconButton>
        </Stack>)}
      </Stack>
      <Button onClick={() => handleItemAdd('comboMessages')}>Add new item</Button>
    </Paper>}

    <Typography variant='h5' sx={{ py: 2 }}>{ translate('categories.hypeMessages') }</Typography>
    {settings && <Paper elevation={1} sx={{ p: 1 }}>
      <Stack spacing={1}>
        <FormGroup>
          <FormControlLabel control={<Checkbox checked={settings.hypeMessagesEnabled[0]} onChange={(_, checked) => handleChange('hypeMessagesEnabled', checked)} />} label={translate('overlays.emotes.settings.hypeMessagesEnabled')} />
        </FormGroup>
        {settings.hypeMessages[0].map((item: { message: string, messagesCount: number }, idx: number) => <Stack spacing={1} direction='row' key={idx} alignItems='baseline'>
          <TextField
            {...TextFieldProps(`hypeMessages.message.${idx}`)}
            helperText={TextFieldProps(`hypeMessages.message.${idx}`).helperText || ' '}
            fullWidth
            label={translate('overlays.emotes.settings.message')}
            variant="filled"
            value={item.message}
            onChange={(event) => handleItemUpdate(idx, 'hypeMessages', 'message', event.target.value)}
          />
          <TextField
            {...TextFieldProps(`hypeMessages.messagesCount.${idx}`)}
            sx={{ width: 100 }}
            helperText={TextFieldProps(`hypeMessages.messagesCount.${idx}`).helperText || ' '}
            fullWidth
            label={translate('overlays.emotes.settings.threshold')}
            variant="filled"
            type='number'
            value={item.messagesCount}
            onChange={(event) => handleItemUpdate(idx, 'hypeMessages', 'messagesCount', event.target.value)}
          />
          <IconButton sx={{ height: 'fit-content' }} color='error' onClick={() => handleItemDelete(idx, 'hypeMessages')}><DeleteTwoTone/></IconButton>
        </Stack>)}
      </Stack>
      <Button onClick={() => handleItemAdd('hypeMessages')}>Add new item</Button>
    </Paper>}

    <Stack direction='row' justifyContent='center' sx={{ pt: 2 }}>
      <LoadingButton sx={{ width: 300 }} variant='contained' loading={saving} onClick={save} disabled={errors.length > 0}>Save changes</LoadingButton>
    </Stack>
  </Box>
  );
};

export default PageSettingsModulesSystemsEmotesCombo;
