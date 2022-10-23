import { DragIndicatorTwoTone, ManageAccountsTwoTone } from '@mui/icons-material';
import {
  Box, ListItem, ListItemButton, ListItemIcon, ListItemText, Stack, Typography,
} from '@mui/material';
import { grey } from '@mui/material/colors';
import { Permissions } from '@sogebot/backend/dest/database/entity/permissions';
import { useRouter } from 'next/router';

import { useTranslation } from '~/src/hooks/useTranslation';
import { StripTypeORMEntity } from '~/src/types/stripTypeORMEntity';

export const PermissionsListItem: React.FC<{ draggableProvided?: any, permission: StripTypeORMEntity<Permissions> }> = ({
  draggableProvided,
  permission,
}) => {
  const router = useRouter();
  const { translate } = useTranslation();

  return <ListItem disablePadding key={permission.id}
    ref={draggableProvided?.innerRef}
    {...draggableProvided?.draggableProps}>
    <ListItemButton selected={router.query.permissionId === permission.id} onClick={() => router.push(`/settings/permissions/${permission.id}`)}>
      {draggableProvided && <ListItemIcon sx={{
        minWidth: '40px',
      }} {...draggableProvided.dragHandleProps}>
        <DragIndicatorTwoTone/>
      </ListItemIcon>}
      <ListItemIcon sx={{
        fontSize: '26px', minWidth: '40px',
      }}>
        { permission.isWaterfallAllowed ? '≥' : '=' }
      </ListItemIcon>
      <ListItemText
        primary={
          <Stack direction='row' alignItems={'center'}>
            <Typography  color={permission.isCorePermission ? 'white' : grey[400]} sx={{
              fontWeight: permission.isCorePermission ? 'bold' : 'normal', flexGrow: 1,
            }}>
              {permission.name}
            </Typography>
            <Box sx={{ height: '24px' }}>
              <Stack direction='row' alignItems={'center'} color={grey[400]} spacing={1}>
                <ManageAccountsTwoTone/>
                <Typography variant='button' fontSize={12}>
                  { translate('core.permissions.' + permission.automation) }
                </Typography>
              </Stack>
            </Box>
          </Stack>} />
    </ListItemButton>
  </ListItem>;
};