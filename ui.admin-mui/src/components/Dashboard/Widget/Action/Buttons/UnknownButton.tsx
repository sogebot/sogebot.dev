import { Stack, Typography } from '@mui/material';
import { Box } from '@mui/system';
import { QuickActions } from '@sogebot/backend/src/database/entity/dashboard';

import { ColorButton } from '../_ColorButton';

export const DashboardWidgetActionUnknownButton: React.FC<{ item: QuickActions.Item, variableName: string }> = ({
  variableName, item,
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
          <Typography variant="button" sx={{
            fontWeight: '300', fontSize: '12px', lineHeight: '10px',
          }}>{variableName}</Typography>
        </Stack>
      </Stack>
    </ColorButton>
  </>
  );
};