import { CheckCircleTwoTone, WarningTwoTone } from '@mui/icons-material';
import { Box, Divider, FormControlLabel, FormGroup, FormHelperText, FormLabel, Switch, Typography } from '@mui/material';
import { Permissions } from '@sogebot/backend/dest/database/entity/permissions';
import React, {  } from 'react';

// import { usePermissions } from '../../hooks/usePermissions';
import { ScopeToggle } from './ScopeToggle';
import theme from '../../theme';

export const ScopesSelector: React.FC<{
  model:    Permissions['scopes'],
  modelAll:    Permissions['haveAllScopes'],
  modelSensitive:    Permissions['excludeSensitiveScopes'],
  onChange: (values: { scopes: Permissions['scopes'], haveAllScopes: Permissions['haveAllScopes'], excludeSensitiveScopes: Permissions['excludeSensitiveScopes'] }) => void
}> = ({
  onChange, model, modelAll, modelSensitive
}) => {
  const toggleAll = () => {
    onChange({ scopes: model, haveAllScopes: !modelAll, excludeSensitiveScopes: true });
  };

  const toggleSensitive = () => {
    onChange({ scopes: model, haveAllScopes: modelAll, excludeSensitiveScopes: !modelSensitive });
  };

  return  <>
    <Divider sx={{ m: 1.5 }}>
      <FormLabel>Scopes</FormLabel>
    </Divider>

    <FormGroup sx={{ mx: 5 }}>
      <FormControlLabel control={<Switch checked={modelAll} onClick={() => toggleAll()}/>} label={'Grant full (admin) access to bot'} />
    </FormGroup>

    {modelAll && <FormGroup sx={{ mx: 5 }} >
      <FormControlLabel control={<Switch color='error' checked={!modelSensitive} onClick={() => toggleSensitive()}/>} label={<>
      Include sensitive scopes
        <Box sx={{
          position: 'relative',
          display: 'inline-block',
          top: '5px',
          left: '10px',
        }}>
          {!modelSensitive
            ? <WarningTwoTone color='error'/>
            : <CheckCircleTwoTone color='success'/>
          }
        </Box>
      </>} />
      <FormHelperText sx={{
        position: 'relative', top: '-10px',
      }}>
        <Typography sx={{
          fontSize: '0.75rem',
          color: modelSensitive
            ? theme.palette.success.main
            : theme.palette.error.main,
        }}>
          {modelSensitive
            ? 'This permission group has safe access to your bot.'
            : <>This permission group has <strong>unsafe</strong> access to bot and broadcaster tokens!</>
          }
        </Typography>
      </FormHelperText>
    </FormGroup>}

    {!modelAll && <>
      <Divider sx={{ m: 1.5 }}/>

      <ScopeToggle
        selected={model}
        scopes={['core:dashboard']}
        label='Dashboard access'
        caption='User will be able to login to dashboard or manage dashboard'
        onChange={(change, remove) => {
          const cleanedScopes = [...model.filter(sc => !remove.includes(sc))];
          cleanedScopes.push(...change);
          onChange({ scopes: Array.from(new Set(cleanedScopes)), haveAllScopes: modelAll, excludeSensitiveScopes: modelSensitive });
        }}
      />

      <ScopeToggle
        customName='commands'
        selected={model}
        scopes={['systems:alias', 'systems:customcommands', 'systems:cooldown', 'systems:keywords', 'systems:price', 'core:general']}
        label='Commands / Keywords'
        caption='User will be able to read or manage aliases, prices, cooldowns, custom commands, keywords and bot commands'
        onChange={(change, remove) => {
          const cleanedScopes = [...model.filter(sc => !remove.includes(sc))];
          cleanedScopes.push(...change);
          onChange({ scopes: Array.from(new Set(cleanedScopes)), haveAllScopes: modelAll, excludeSensitiveScopes: modelSensitive });
        }}
      />
    </>}
  </>;
};