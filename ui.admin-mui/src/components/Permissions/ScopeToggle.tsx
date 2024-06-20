import { CheckCircleTwoTone, WarningTwoTone } from '@mui/icons-material';
import { Box, FormControlLabel, FormGroup, FormHelperText, Grid, Paper, Slider, Stack, Switch, Typography } from '@mui/material';
import { capitalize } from 'lodash';
import React from 'react';

import { usePermissions } from '../../hooks/usePermissions';
import { useScope } from '../../hooks/useScope';
import theme from '../../theme';

type Props = {
  customName?: string,
  flat?: boolean,
  label: string,
  caption?: string,
  scopes: string[],
  selected: string[],
  onChange: (values: string[], removeScopes: string[]) => void
};

const scopeColors = [
  'error', 'light', 'success', 'success', 'info'
] as const;

export const ScopeToggle: React.FC<Props> = ({ scopes, label, caption, selected, onChange, customName, flat }) => {
  const { scopes: allScopes } = usePermissions();
  const permissionScope = useScope('permissions');

  const filteredScopes = [...allScopes.filter(scope => scopes.some(avscope => scope.startsWith(avscope)))];
  if (customName) {
    filteredScopes.push(`${customName}:custom`);
  }

  const filteredSelected = selected.filter(s => filteredScopes.includes(s));
  const isNoAccess = filteredSelected.length === 0;
  const isReadOnly = filteredSelected.filter(s => s.endsWith('read')).length === filteredSelected.length
  && filteredScopes.filter(s => s.endsWith('read')).length === filteredSelected.length;
  const isManageOnly = filteredSelected.filter(s => s.endsWith('manage')).length === filteredSelected.length
  && filteredScopes.filter(s => s.endsWith('manage')).length === filteredSelected.length;
  const isCustom = customName && filteredSelected.includes(`${customName}:custom`);

  const haveSensitiveScope = filteredScopes.some(s => s.includes('sensitive'));
  const isSensitive = filteredSelected.some(s => s.includes('sensitive'));

  const [ scope, setScope ] = React.useState(isNoAccess
    ? 0
    : isReadOnly
      ? 1
      : isManageOnly
        ? 2
        : isSensitive
          ? 3
          : 4);

  React.useEffect(() => {
    if (!permissionScope.manage) {
      return;
    }
    if (scope === 0) {
      setNoAccess();
    }
    if (scope === 1) {
      setReadOnly();
    }
    if (scope === 2) {
      setManageOnly();
    }
    if (scope === 3) {
      setManageAndSensitive();
    }
    if (scope === 4) {
      setCustom();
    }
  }, [scope, permissionScope]);
  const setNoAccess = () => onChange([], filteredScopes);
  const setReadOnly = () => onChange(filteredScopes.filter(s => s.endsWith('read')), filteredScopes);
  const setManageOnly = () => onChange(filteredScopes.filter(s => s.endsWith('manage')), filteredScopes);
  const setManageAndSensitive = () => onChange(filteredScopes.filter(s => s.endsWith('manage') || s.endsWith('sensitive')), filteredScopes);
  const setCustom = () => onChange([...filteredSelected, `${customName}:custom`], filteredScopes);

  return <Paper variant='outlined' sx={{
    p: 2,
    border: flat ? 0 : undefined,
    margin: 'auto',
    mt: !flat ? 0.5 : undefined,
  }}>
    <Grid container spacing={1}>
      <Grid item xs={6}>
        <Stack>
          <Typography variant={flat ? 'h6' : 'h5'}>{label}</Typography>
          {caption && <Typography variant='caption'>{caption}</Typography>}
        </Stack>
      </Grid>
      <Grid item xs sx={{ pr: 3, display: 'flex', justifyContent: 'right' }}>
        <Stack>
          <Stack sx={{
            width: '150px',
            alignSelf: 'flex-end',
          }}>
            <Box sx={{
              display: 'flex',
              justifyContent: customName ? 'space-between' : 'center',
              position: 'relative',
              left: customName ? '25px' : undefined,
              width: customName ? '145px' : undefined,
            }}>
              <Typography variant='caption' onClick={() => permissionScope.manage && setScope(1)} sx={{
                color: scope === 1 ? theme.palette.light.main : theme.palette.text.disabled,
                cursor: permissionScope.manage ? 'pointer' : 'not-allowed',
                position: 'absolute',
                height: '50px',
                left: customName ? 0 : undefined,
              }}>Read-only</Typography>
              {customName && <Typography variant='caption' onClick={() => permissionScope.manage && setScope(4)} sx={{
                color: scope === 3 ? theme.palette.info.main : theme.palette.text.disabled,
                cursor: permissionScope.manage ? 'pointer' : 'not-allowed',
                position: 'absolute',
                height: '50px',
                right: 0,
              }}>Custom</Typography>}
            </Box>
            <Slider
              sx={{
                width: '150px',
                alignSelf: 'center',
                position: 'relative',
                top: '12px',
                marginBottom: '6px',
                cursor: permissionScope.manage ? 'pointer' : 'not-allowed'
              }}
              disabled={!permissionScope.manage}
              value={scope}
              onChangeCommitted={(_, v) => permissionScope.manage && setScope(v as number)}
              step={1}
              color={scopeColors[scope]}
              max={customName ? 3 : 2}
              marks={true}
              valueLabelDisplay={'off'}
            />
            <Box sx={{
              display: 'flex',
              justifyContent: 'space-between',
              position: 'relative',
              left: '-30px',
              width: customName ? '160px' : '205px'
            }}>
              <Typography variant='caption' onClick={() => permissionScope.manage && setScope(0)} sx={{
                color: scope === 0 ? theme.palette.error.main : theme.palette.text.disabled,
                cursor: permissionScope.manage ? 'pointer' : 'not-allowed',
                position: 'absolute',
                height: '50px',
                left: flat ? 0 : undefined,
              }}>No access</Typography>
              <Typography variant='caption' onClick={() => permissionScope.manage && setScope(2)} sx={{
                color: (scope === 2 || scope === 3) ? theme.palette.success.main : theme.palette.text.disabled,
                cursor: permissionScope.manage ? 'pointer' : 'not-allowed',
                position: 'absolute',
                height: '50px',
                right: 0,
              }}>Full access</Typography>
            </Box>
          </Stack>

          {((scope === 2 || scope === 3) && haveSensitiveScope) && <FormGroup sx={{ pt: 2 }}>
            <FormControlLabel control={<Switch color='error' checked={scope === 3} onClick={() => setScope(scope === 2  ? 3 : 2)}/>} label={<>
      Include sensitive scopes
              <Box sx={{
                position: 'relative',
                display: 'inline-block',
                top: '5px',
                left: '10px',
              }}>
                {scope == 3
                  ? <WarningTwoTone color='error'/>
                  : <CheckCircleTwoTone color='success'/>
                }
              </Box>
            </>} />
            <FormHelperText sx={{
              position: 'relative', top: '-5px', height: '30px', width: '250px'
            }}>
              <Typography sx={{
                fontSize: '0.75rem',
                color: scope === 2
                  ? theme.palette.success.main
                  : theme.palette.error.main,
              }}>
                {scope === 2
                  ? 'This permission group has safe access to your bot.'
                  : <>This permission group has <strong>unsafe</strong> access to bot and broadcaster tokens!</>
                }
              </Typography>
            </FormHelperText>
          </FormGroup>}
        </Stack>
      </Grid>
    </Grid>

    {isCustom && <Grid container>
      {scopes.map((sc) => <Grid item xs={12} xl={6} key={capitalize(sc.replace(/_/g, ' '))}>
        <ScopeToggle
          flat
          selected={selected.filter(s => s.startsWith(sc))}
          scopes={[sc]}
          label={capitalize(sc.replace(/_/g, ' '))}
          onChange={(change, remove) => {
            onChange(change, remove);
          }}/>
      </Grid>
      )}
    </Grid>}
  </Paper>;

};