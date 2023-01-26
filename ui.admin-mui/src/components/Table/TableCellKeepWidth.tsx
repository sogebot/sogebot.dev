import { TableCell } from '@mui/material';
import React from 'react';

export const TableCellKeepWidth: React.FC<{ width?: number, children?: any, dragHandleProps?: any, snapshot?: any, sx?: any  }> = ({ width, children, dragHandleProps, snapshot, sx }) => {
  const ref = React.useRef<HTMLElement>();
  const [widthCalc, setWidth] = React.useState(width ?? 0);
  const isDragging = React.useMemo(() => {
    return snapshot.isDragging;
  }, [snapshot]);

  React.useEffect(() => {
    if (ref.current && widthCalc === 0) {
      setWidth(ref.current.getBoundingClientRect().width);
    }
  }, [ref]);

  return (
    <TableCell {...dragHandleProps} ref={ref} sx={{
      backgroundColor: '#1e1e1e',
      width:           isDragging ? `${widthCalc}px` : 'inherit',
      borderBottom:    '1px solid rgba(81, 81, 81, 1)',
      cursor:          dragHandleProps ? 'grab !important' : undefined,
      ...(dragHandleProps?.sx || {}),
      ...sx,
    }}>{children}</TableCell>
  );
};