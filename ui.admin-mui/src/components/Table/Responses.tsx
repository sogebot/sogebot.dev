import { Keyword } from '@backend/database/entity/keyword';
import { FilterAlt, Key, Pause, PlayArrow } from '@mui/icons-material';
import { Divider, Grid, List, ListItem, Stack, Typography } from '@mui/material';
import orderBy from 'lodash/orderBy';
import React from 'react';
import { v4 } from 'uuid';

import { getPermissionName } from '../../helpers/getPermissionName';
import { usePermissions } from '../../hooks/usePermissions';
import { useTranslation } from '../../hooks/useTranslation';

export const Responses: React.FC<{
  responses: Keyword['responses'],
}> = ({ responses }) => {
  const [ id ] = React.useState(v4());
  const { translate } = useTranslation();
  const { permissions } = usePermissions();

  return <>
    {responses.length === 0
      ? translate('systems.customcommands.no-responses-set')
      : <List dense>
        {orderBy(responses, 'order', 'asc').map((response, idx) => (<ListItem key={`${id}-${idx}`}>
          <Stack width={'100%'}>
            {idx > 0 && <Divider flexItem variant="middle" sx={{ mb: 1 }}/>}
            <Grid container spacing={2}>
              <Grid item><Typography variant="caption">{ translate('response') }#{ idx + 1 }</Typography></Grid>
              <Grid item><Typography variant="caption"><Key sx={{ fontSize: 14 }}/> { getPermissionName(response.permission, permissions) }</Typography></Grid>
              <Grid item>
                <Typography variant="caption">
                  { response.stopIfExecuted
                    ? <><Pause sx={{ fontSize: 14 }}/> {translate('commons.stop-if-executed')}</>
                    : <><PlayArrow sx={{ fontSize: 14 }}/> {translate('commons.continue-if-executed')}</>
                  }
                </Typography>
              </Grid>
              <Grid item>
                <Typography variant="caption">
                  { response.filter.length > 0
                    && <><FilterAlt sx={{ fontSize: 14 }}/> {response.filter}</>
                  }
                </Typography>
              </Grid>
            </Grid>
            {response.response.split('\n').map((line, idxL) => (<Typography key={idxL}>{line}</Typography>))}
          </Stack>
        </ListItem>))}
      </List>
    }
  </>;
};