import { DataTypeProvider, DataTypeProviderProps } from '@devexpress/dx-react-grid';
import { Typography } from '@mui/material';
import React, { ReactNode } from 'react';

import { dayjs } from '../../helpers/dayjsHelper';

export const DateFormatter = ({ value }: { value: string }) => {
  return (<Typography>{ dayjs(value).format('LL LTS') }</Typography>);
};
export const DateTypeProvider = (props: JSX.IntrinsicAttributes & DataTypeProviderProps & { children?: ReactNode; }) => (
  <DataTypeProvider
    formatterComponent={DateFormatter}
    {...props}
  />
);