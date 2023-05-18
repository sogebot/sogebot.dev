import { Carousel } from '@sogebot/backend/dest/database/entity/overlay';
import React from 'react';

import { ImageDialog } from './ImageCarouselSettings/image';

type Props = {
  model: Carousel;
  onUpdate: (value: Carousel) => void;
};

export const ImageCarouselSettings: React.FC<Props> = ({ model, onUpdate }) => {
  return <>
    <ImageDialog model={model.images} onChange={value =>  onUpdate({
      ...model, images: value ?? [],
    })}/>
  </>;
};