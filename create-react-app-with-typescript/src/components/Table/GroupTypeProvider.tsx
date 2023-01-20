import { DataTypeProvider, DataTypeProviderProps } from '@devexpress/dx-react-grid';
import { Typography } from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { ReactNode } from 'react';

export const GroupFormatter = ({ value }: { value: string }) => {
  if (value !== '_ungroup') {
    return (<Typography>{value}</Typography>);
  } else {
    return (<Typography sx={{ color: grey[400] }}>Ungrouped</Typography>);
  }
};
export const GroupTypeProvider = (props: JSX.IntrinsicAttributes & DataTypeProviderProps & { children?: ReactNode; }) => (
  <DataTypeProvider
    formatterComponent={GroupFormatter}
    {...props}
  />
);