import { Box, Grid, Paper, Slider, Stack, Typography } from '@mui/material';
import React from 'react';

import { usePermissions } from '../../hooks/usePermissions';
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
  'error', 'light', 'success', 'info'
] as const;

export const ScopeToggle: React.FC<Props> = ({ scopes, label, caption, selected, onChange, customName, flat }) => {
  const { scopes: allScopes } = usePermissions();

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
  // TODO: sensitive

  const [ scope, setScope ] = React.useState(isNoAccess
    ? 0
    : isReadOnly
      ? 1
      : isManageOnly
        ? 2
        : 3);

  React.useEffect(() => {
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
      setCustom();
    }
  }, [scope]);
  const setNoAccess = () => onChange([], filteredScopes);
  const setReadOnly = () => onChange(filteredScopes.filter(s => s.endsWith('read')), filteredScopes);
  const setManageOnly = () => onChange(filteredScopes.filter(s => s.endsWith('manage')), filteredScopes);
  const setCustom = () => onChange([...filteredSelected, `${customName}:custom`], filteredScopes);

  return <Paper variant='outlined' sx={{
    p: 2,
    border: flat ? 0 : undefined,
    width: flat ? undefined : 'max(1000px, 50%)',
    margin: 'auto'
  }}>
    <Grid container spacing={1}>
      <Grid item xs={6}>
        <Stack>
          <Typography variant={flat ? 'h6' : 'h5'}>{label}</Typography>
          {caption && <Typography variant='caption'>{caption}</Typography>}
        </Stack>
      </Grid>
      <Grid item xs sx={{ pr: 3, display: 'flex', justifyContent: 'right' }}>
        <Stack sx={{
          width: '150px',
        }}>
          <Box sx={{
            display: 'flex',
            justifyContent: customName ? 'space-between' : 'center',
            position: 'relative',
            left: customName ? '25px' : undefined,
            width: customName ? '145px' : undefined,
          }}>
            <Typography variant='caption' onClick={() => setScope(1)} sx={{
              color: scope === 1 ? theme.palette.light.main : theme.palette.text.disabled,
              cursor: 'pointer',
              position: 'absolute',
              height: '50px',
              left: customName ? 0 : undefined,
            }}>Read-only</Typography>
            {customName && <Typography variant='caption' onClick={() => setScope(3)} sx={{
              color: scope === 3 ? theme.palette.info.main : theme.palette.text.disabled,
              cursor: 'pointer',
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
            }}
            value={scope}
            onChangeCommitted={(_, v) => setScope(v as number)}
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
            <Typography variant='caption' onClick={() => setScope(0)} sx={{
              color: scope === 0 ? theme.palette.error.main : theme.palette.text.disabled,
              cursor: 'pointer',
              position: 'absolute',
              height: '50px',
              left: flat ? 0 : undefined,
            }}>No access</Typography>
            <Typography variant='caption' onClick={() => setScope(2)} sx={{
              color: scope === 2 ? theme.palette.success.main : theme.palette.text.disabled,
              cursor: 'pointer',
              position: 'absolute',
              height: '50px',
              right: 0,
            }}>Full access</Typography>
          </Box>
        </Stack>
      </Grid>
    </Grid>

    {isCustom && <Grid container>
      {scopes.map((sc) => <Grid item xs={12} xl={6}>
        <ScopeToggle
          flat
          selected={selected.filter(s => s.startsWith(sc))}
          scopes={[sc]}
          label={sc}
          onChange={(change, remove) => {
            onChange(change, remove);
          }}/>
      </Grid>
      )}
    </Grid>}
  </Paper>;

};