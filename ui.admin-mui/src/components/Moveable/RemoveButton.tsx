import { DeleteTwoTone } from '@mui/icons-material';
import { Button } from '@mui/material';
import React from 'react';
import { MoveableManagerInterface } from 'react-moveable';

export let zoom = 1;
export function setZoomRemoveButton(value: number) {
  zoom = value;
}

export const RemoveButton = {
  name:   'removeButton',
  props:  {},
  events: {},
  render(moveable: MoveableManagerInterface<any, any>) {
    const rect = moveable.getRect();

    // Add key (required)
    // Add class prefix moveable-(required)
    return <div key={'delete-button-viewer'} className={'moveable-deletebutton'} style={{
      position:        'absolute',
      left:            `${rect.width + 10}px`,
      top:             `${0}px`,
      padding:         '0',
      color:           'white',
      whiteSpace:      'nowrap',
      backgroundColor: 'transparent',
    }}>
      <Button
        color='error'
        variant='contained'
        sx={{
          minWidth: `unset`,
          padding:  '2px',
        }} onClick={() => moveable.triggerEvent('onDelete', { })}><DeleteTwoTone sx={{ fontSize: `${20 / zoom}px` }}/></Button>
    </div>;
  },
} as const;