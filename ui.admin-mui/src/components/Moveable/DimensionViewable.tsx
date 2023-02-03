import React from 'react';
import { MoveableManagerInterface } from 'react-moveable';

export let zoom = 1;
export function setZoomDimensionViewable(value: number) {
  zoom = value;
}

export const DimensionViewable = {
  name:   'dimensionViewable',
  props:  {},
  events: {},
  render(moveable: MoveableManagerInterface<any, any>) {
    const rect = moveable.getRect();

    // Add key (required)
    // Add class prefix moveable-(required)
    return <div key={'dimension-viewer'} className={'moveable-dimension'} style={{
      position:     'absolute',
      left:         `${rect.width / 2}px`,
      top:          `${rect.height + 10}px`,
      background:   '#4af',
      borderRadius: '2px',
      padding:      '2px 4px',
      color:        'white',
      fontSize:     `${13 / zoom}px`,
      whiteSpace:   'nowrap',
      fontWeight:   'bold',
      willChange:   'transform',
      transform:    'translate(-50%, 0px)',
    }}>
      {Math.round(rect.offsetWidth)} x {Math.round(rect.offsetHeight)}
    </div>;
  },
} as const;