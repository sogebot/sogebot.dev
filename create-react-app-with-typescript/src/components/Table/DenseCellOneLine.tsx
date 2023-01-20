import { VirtualTable } from '@devexpress/dx-react-grid-material-ui';
import React from 'react'

const DenseCellOneLine = (props: any) => (
  <VirtualTable.Cell
    {...props}
    style={{
      padding: '0.5rem', height: '40px', margin: 0, lineHeight: 0,
    }}
  />
);

export default DenseCellOneLine;