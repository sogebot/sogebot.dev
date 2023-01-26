import { Theme } from '@emotion/react';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import {
  SxProps, TableBody, TableBodyClasses,
} from '@mui/material';
import React from 'react';
import { CommonProps } from 'react-window';

export const DroppableComponent = (onDragEnd: (result: any, provided: any) => void) => (props: JSX.IntrinsicAttributes & { component: React.ElementType<any>; } & { children?: React.ReactNode; classes?: Partial<TableBodyClasses> | undefined; sx?: SxProps<Theme> | undefined; } & CommonProps & Omit<any, 'children' | 'sx' | keyof CommonProps>) => {
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId={'1'} direction="vertical">
        {(provided) => {
          return (
            <TableBody ref={provided.innerRef} {...provided.droppableProps} {...props}>
              {props.children}
              {provided.placeholder}
            </TableBody>
          );
        }}
      </Droppable>
    </DragDropContext>
  );
};