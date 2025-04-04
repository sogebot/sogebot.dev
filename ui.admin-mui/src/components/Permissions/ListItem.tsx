import { Permissions } from '@entity/permissions';
import { DragIndicatorTwoTone, ManageAccountsTwoTone } from '@mui/icons-material';
import { Button, ListItemIcon, ListItemText, Stack, Typography } from '@mui/material';
import { grey } from '@mui/material/colors';
import React from 'react';
import { useParams } from 'react-router-dom';

import { useScope } from '../../hooks/useScope';
import { useTranslation } from '../../hooks/useTranslation';

export const PermissionsListItem: React.FC<{ draggableProvided?: any, permission: Permissions }> = ({
  draggableProvided,
  permission,
}) => {
  const scope = useScope('permissions');
  const { id } = useParams();
  const { translate } = useTranslation();
  const isActive = id === permission.id;

  return <Button key={permission.id}
    ref={draggableProvided?.innerRef}
    {...draggableProvided?.draggableProps}
    href={`/settings/permissions/edit/${permission.id}`}
    sx={{
      '& *': {
        color: isActive ? 'black !important' : undefined,
      }
    }}
    variant={isActive ? 'contained' : 'text'}>
    {(draggableProvided && scope.manage) && <ListItemIcon sx={{ minWidth: '40px' }} {...draggableProvided.dragHandleProps}>
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
            fontWeight:   permission.isCorePermission ? 'bold' : 'normal',
            flexGrow:     1,
            width:        '100%',
            textOverflow: 'ellipsis',
            overflow:     'hidden',
          }}>
            {permission.name}
          </Typography>
          <Stack direction='row' width={'100%'} alignItems={'center'} justifyContent={'right'} color={grey[400]} spacing={1}>
            <ManageAccountsTwoTone/>
            <Typography variant='button' fontSize={12}>
              { translate('core.permissions.' + permission.automation) }
            </Typography>
          </Stack>
        </Stack>} />
  </Button>;
};