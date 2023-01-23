import { Stack, Typography } from '@mui/material';
import { Box } from '@mui/system';
import { Variable } from '@sogebot/backend/dest/database/entity/variable';
import { QuickActions } from '@sogebot/backend/src/database/entity/dashboard';
import React from 'react';

import { ColorButton } from '../_ColorButton';

export const DashboardWidgetActionCustomVariableEvalButton: React.FC<{ item: QuickActions.Item; variable: Variable}> = ({
  item, variable,
}) => {

  return (<>
    <ColorButton
      key={item.id}
      variant="contained"
      htmlcolor={item.options.color}
      fullWidth
      disabled
      sx={{ borderRadius: 0 }}>
      <Box sx={{
        position: 'absolute', width: '100%', height: '100%',
      }}></Box>
      <Stack direction="row" alignItems='center' width='100%'>
        <Stack sx={{ width: '100%' }} spacing={0}>
          <Typography sx={{
            fontWeight: 'bold', fontSize: '14px', lineHeight: '20px',
          }}>Eval cannot be used</Typography>
          <Typography variant="button" sx={{
            fontWeight: '300', fontSize: '12px', lineHeight: '10px',
          }}>{variable.variableName}</Typography>
        </Stack>
      </Stack>
    </ColorButton>
  </>
  );
};