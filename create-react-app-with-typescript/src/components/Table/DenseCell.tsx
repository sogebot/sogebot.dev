import { VirtualTable } from '@devexpress/dx-react-grid-material-ui';
import React from 'react';

const DenseCell = (props: any) => (
  <VirtualTable.Cell
    {...props}
    style={{
      padding: '0.5rem', height: '80px', margin: 0,
    }}
  />
);

export default DenseCell;