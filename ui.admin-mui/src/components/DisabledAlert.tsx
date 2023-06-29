import { Alert, Grid } from '@mui/material';
import React, { useEffect, useState } from 'react';

import { useAppSelector } from '../hooks/useAppDispatch';
import { useTranslation } from '../hooks/useTranslation';

type System = { system: string };
type Integration = { integration: string };

export const DisabledAlert: React.FC<System | Integration> = (props) => {
  const { translate } = useTranslation();
  const invisible = { display: 'none' };

  const { systems, integrations } = useAppSelector(state => state.loader);
  const [ enabled, setEnabled ] = useState(true);

  const isPropsSystem = (val: any): val is System => {
    return typeof val.system !== 'undefined';
  };

  useEffect(() => {
    if (!systems || !integrations) {
      return;
    }
    if (isPropsSystem(props)) {
      setEnabled(systems.find(o => o.name === props.system)?.enabled || false);
    } else {
      setEnabled(integrations.find(o => o.name === props.integration)?.enabled || false);
    }
  }, [systems, integrations, props]);

  return (
    <><span style={invisible}/>
      {
        !enabled && <Grid item>
          <Alert severity="warning" variant='outlined' sx={{
            padding:               0,
            px:                    2,
            height:                '36.5px',
            '& .MuiAlert-message': { overflow: 'hidden' },
          }}>
            { translate('this-system-is-disabled') }
          </Alert>
        </Grid>
      }</>
  );
};