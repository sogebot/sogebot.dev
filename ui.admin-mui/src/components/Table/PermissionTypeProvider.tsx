import { DataTypeProvider, DataTypeProviderProps } from '@devexpress/dx-react-grid';
import { Typography } from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { ReactNode } from 'react';

export const PermissionFormatter = ({ value }: { value: string }) => {
  if (value !== '_disabled') {
    return (<Typography>{value}</Typography>);
  } else {
    return (<Typography sx={{ color: grey[400] }}>Disabled</Typography>);
  }
};
export const PermissionTypeProvider = (props: JSX.IntrinsicAttributes & DataTypeProviderProps & { children?: ReactNode; }) => (
  <DataTypeProvider
    formatterComponent={PermissionFormatter}
    {...props}
  />
);