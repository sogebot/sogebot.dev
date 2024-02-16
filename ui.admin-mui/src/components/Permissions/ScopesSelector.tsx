import { Divider, FormControlLabel, FormGroup, FormLabel, Grid, Switch } from '@mui/material';
import { Permissions } from '@sogebot/backend/dest/database/entity/permissions';
import React, {  } from 'react';

import { usePermissions } from '../../hooks/usePermissions';

export const ScopesSelector: React.FC<{
  model:    Permissions['scopes'],
  modelAll:    Permissions['haveAllScopes'],
  onChange: (values: { scopes: Permissions['scopes'], haveAllScopes: Permissions['haveAllScopes'] }) => void
}> = ({
  onChange, model, modelAll
}) => {
  const { scopes } = usePermissions();
  console.log({ onChange });

  const toggle = (scope: string) => {
    onChange({ scopes: model.includes(scope) ? model.filter(s => s !== scope) : [...model, scope], haveAllScopes: modelAll });
  };

  return  <>
    <Divider sx={{ m: 1.5 }}>
      <FormLabel>Scopes</FormLabel>
    </Divider>

    <Grid container spacing={0}>
      {scopes.map(scope => <Grid item key={scope} xs={2}>
        <FormGroup>
          <FormControlLabel control={<Switch checked={scopes.includes(scope)} onClick={() => toggle(scope)}/>} label={scope} />
        </FormGroup>
      </Grid>)}
    </Grid>
    {JSON.stringify({ scopes, model })}
  </>;
};