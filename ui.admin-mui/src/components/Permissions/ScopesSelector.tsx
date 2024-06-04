import { CheckCircleTwoTone, WarningTwoTone } from '@mui/icons-material';
import { Box, Divider, FormControlLabel, FormGroup, FormHelperText, FormLabel, Switch, Typography } from '@mui/material';
import { Permissions } from '@sogebot/backend/dest/database/entity/permissions';
import React, {  } from 'react';

// import { usePermissions } from '../../hooks/usePermissions';
import { ScopeToggle } from './ScopeToggle';
import { useScope } from '../../hooks/useScope';
import theme from '../../theme';

export const ScopesSelector: React.FC<{
  model:    Permissions['scopes'],
  modelAll:    Permissions['haveAllScopes'],
  modelSensitive:    Permissions['excludeSensitiveScopes'],
  onChange: (values: { scopes: Permissions['scopes'], haveAllScopes: Permissions['haveAllScopes'], excludeSensitiveScopes: Permissions['excludeSensitiveScopes'] }) => void
}> = ({
  onChange, model, modelAll, modelSensitive
}) => {
  const scope = useScope('permissions');
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
      <FormControlLabel control={<Switch disabled={!scope.manage} checked={modelAll} onClick={() => toggleAll()}/>} label={'Grant full (admin) access to bot'} />
    </FormGroup>

    {modelAll && <FormGroup sx={{ mx: 5 }} >
      <FormControlLabel control={<Switch  disabled={!scope.manage} color='error' checked={!modelSensitive} onClick={() => toggleSensitive()}/>} label={<>
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
        customName='dashboard'
        selected={model}
        scopes={['dashboard', 'checklist', 'queue', 'raffles', 'alerts']}
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
        scopes={['alias', 'custom_commands', 'cooldown', 'keywords', 'price', 'bot_commands']}
        label='Commands / Keywords'
        caption='User will be able to read or manage aliases, prices, cooldowns, custom commands, keywords and bot commands'
        onChange={(change, remove) => {
          const cleanedScopes = [...model.filter(sc => !remove.includes(sc))];
          cleanedScopes.push(...change);
          onChange({ scopes: Array.from(new Set(cleanedScopes)), haveAllScopes: modelAll, excludeSensitiveScopes: modelSensitive });
        }}
      />

      <ScopeToggle
        customName='quotes'
        selected={model}
        scopes={['quotes', 'timers', 'randomizer']}
        label='Quotes / Timers / Randomizer'
        caption='User will be able to read or manage quotes, timers and randomizers'
        onChange={(change, remove) => {
          const cleanedScopes = [...model.filter(sc => !remove.includes(sc))];
          cleanedScopes.push(...change);
          onChange({ scopes: Array.from(new Set(cleanedScopes)), haveAllScopes: modelAll, excludeSensitiveScopes: modelSensitive });
        }}
      />

      <ScopeToggle
        selected={model}
        scopes={['overlays']}
        label='Overlays'
        caption='User will be able to read, manage or control overlays related settings'
        onChange={(change, remove) => {
          const cleanedScopes = [...model.filter(sc => !remove.includes(sc))];
          cleanedScopes.push(...change);
          onChange({ scopes: Array.from(new Set(cleanedScopes)), haveAllScopes: modelAll, excludeSensitiveScopes: modelSensitive });
        }}
      />
      <ScopeToggle
        selected={model}
        scopes={['games', 'services', 'integrations', 'core', 'systems']}
        label='Settings'
        caption='User will be able to read or manage settings for games, services, integrations and more'
        onChange={(change, remove) => {
          const cleanedScopes = [...model.filter(sc => !remove.includes(sc))];
          cleanedScopes.push(...change);
          onChange({ scopes: Array.from(new Set(cleanedScopes)), haveAllScopes: modelAll, excludeSensitiveScopes: modelSensitive });
        }}
      />

      <ScopeToggle
        selected={model}
        scopes={['customvariables', 'events']}
        label='Custom Variables / Events'
        caption='User will be able to read or manage custom variables and events'
        onChange={(change, remove) => {
          const cleanedScopes = [...model.filter(sc => !remove.includes(sc))];
          cleanedScopes.push(...change);
          onChange({ scopes: Array.from(new Set(cleanedScopes)), haveAllScopes: modelAll, excludeSensitiveScopes: modelSensitive });
        }}
      />
    </>}
  </>;
};