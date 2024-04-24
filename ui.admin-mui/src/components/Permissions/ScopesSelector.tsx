import { CheckCircleTwoTone, WarningTwoTone } from '@mui/icons-material';
import { Box, Divider, FormControlLabel, FormGroup, FormHelperText, FormLabel, Grid, Paper, Slider, Stack, Switch, Typography } from '@mui/material';
import { Permissions } from '@sogebot/backend/dest/database/entity/permissions';
import React, {  } from 'react';

// import { usePermissions } from '../../hooks/usePermissions';
import theme from '../../theme';

export const ScopesSelector: React.FC<{
  model:    Permissions['scopes'],
  modelAll:    Permissions['haveAllScopes'],
  modelSensitive:    Permissions['excludeSensitiveScopes'],
  onChange: (values: { scopes: Permissions['scopes'], haveAllScopes: Permissions['haveAllScopes'], excludeSensitiveScopes: Permissions['excludeSensitiveScopes'] }) => void
}> = ({
  onChange, model, modelAll, modelSensitive
}) => {
  // const { scopes } = usePermissions();

  // const toggle = (scope: string) => {
  //   onChange({ scopes: model.includes(scope) ? model.filter(s => s !== scope) : [...model, scope], haveAllScopes: modelAll, excludeSensitiveScopes: modelSensitive });
  // };

  const [ scope, setScope ] = React.useState(0);
  const [ scope2, setScope2 ] = React.useState(0);

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

      <Paper sx={{ p: 2, m: 0.5 }}>
        <Grid container spacing={1}>
          <Grid item xs={6}>
            <Stack>
              <Typography variant='h5'>Dashboard access</Typography>
              <Typography variant='caption'>User will be able to login to dashboard or manage dashboard</Typography>
            </Stack>
          </Grid>
          <Grid item xs sx={{ pr: 3, display: 'flex', justifyContent: 'center' }}>
            <Stack sx={{
              width: '150px',
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Typography variant='caption' onClick={() => setScope(1)} sx={{
                  color: scope === 1 ? theme.palette.primary.main : theme.palette.text.disabled,
                  cursor: 'pointer',
                  lineHeight: '10px'
                }}>Read-only</Typography>
              </Box>
              <Slider
                sx={{
                  width: '100px',
                  alignSelf: 'center'
                }}
                value={scope}
                onChangeCommitted={(_, v) => setScope(v as number)}
                step={1}
                color="primary"
                max={2}
                marks={true}
                valueLabelDisplay={'off'}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant='caption' onClick={() => setScope(0)} sx={{
                  color: scope === 0 ? theme.palette.primary.main : theme.palette.text.disabled,
                  cursor: 'pointer',
                  lineHeight: '10px'
                }}>No access</Typography>
                <Typography variant='caption' onClick={() => setScope(2)} sx={{
                  color: scope === 2 ? theme.palette.primary.main : theme.palette.text.disabled,
                  cursor: 'pointer',
                  lineHeight: '10px'
                }}>Full access</Typography>
              </Box>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 2, m: 0.5 }}>
        <Grid container spacing={1}>
          <Grid item xs={6}>
            <Stack>
              <Typography variant='h5'>Commands / Keywords</Typography>
              <Typography variant='caption'>User will be able to read or manage aliases, prices, cooldowns, custom commands, keywords and bot commands</Typography>
            </Stack>
          </Grid>
          <Grid item xs sx={{ pr: 3, display: 'flex', justifyContent: 'center' }}>
            <Stack sx={{
              width: '150px',
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Typography variant='caption' onClick={() => setScope2(1)} sx={{
                  color: scope2 === 1 ? theme.palette.light.main : theme.palette.text.disabled,
                  cursor: 'pointer',
                  lineHeight: '10px'
                }}>Read-only</Typography>
              </Box>
              <Slider
                sx={{
                  width: '100px',
                  alignSelf: 'center'
                }}
                value={scope2}
                onChangeCommitted={(_, v) => setScope2(v as number)}
                step={1}
                color={scope2 === 0
                  ? 'error'
                  : scope2 === 1
                    ? 'light'
                    : 'success'}
                max={2}
                marks={true}
                valueLabelDisplay={'off'}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant='caption' onClick={() => setScope2(0)} sx={{
                  color: scope2 === 0 ? theme.palette.error.main : theme.palette.text.disabled,
                  cursor: 'pointer',
                  lineHeight: '10px'
                }}>No access</Typography>
                <Typography variant='caption' onClick={() => setScope2(2)} sx={{
                  color: scope2 === 2 ? theme.palette.success.main : theme.palette.text.disabled,
                  cursor: 'pointer',
                  lineHeight: '10px'
                }}>Full access</Typography>
              </Box>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* <Grid container spacing={0}>
        {scopes.map(scope => <Grid item key={scope} xs={2}>
          <FormGroup>
            <FormControlLabel control={<Switch checked={model.includes(scope)} onClick={() => toggle(scope)}/>} label={scope} />
          </FormGroup>
        </Grid>)}
      </Grid> */}
      {/* {JSON.stringify({ scopes, model })} */}
    </>}
  </>;
};