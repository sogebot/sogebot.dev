import { DataTypeProvider, DataTypeProviderProps } from '@devexpress/dx-react-grid';
import { Check, Clear } from '@mui/icons-material';
import React, { ReactNode } from 'react';

export const BoolFormatter = ({ value }: { value: boolean }) => {
  return value ? <Check/> : <Clear/>;
};
export const BoolTypeProvider = (props: React.JSX.IntrinsicAttributes & DataTypeProviderProps & { children?: ReactNode; }) => (
  <DataTypeProvider
    formatterComponent={BoolFormatter}
    {...props}
  />
);