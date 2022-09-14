import { DataTypeProvider, DataTypeProviderProps } from '@devexpress/dx-react-grid';
import { Typography } from '@mui/material';
import { ReactNode } from 'react';

export const ListFormatter = ({ value }: { value: string[] }) => {
  return <Typography>{value.join(', ')}</Typography>;
};
export const ListTypeProvider = (props: JSX.IntrinsicAttributes & DataTypeProviderProps & { children?: ReactNode; }) => (
  <DataTypeProvider
    formatterComponent={ListFormatter}
    {...props}
  />
);