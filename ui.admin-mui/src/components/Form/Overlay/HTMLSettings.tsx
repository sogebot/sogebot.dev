import { HTML } from '@entity/overlay';
import React from 'react';

import { CSSDialog } from './HTMLSettings/css';
import { HTMLDialog } from './HTMLSettings/html';
import { JavascriptDialog } from './HTMLSettings/javascript';

type Props = {
  model:    HTML;
  onUpdate: (value: HTML) => void;
};

export const HTMLSettings: React.FC<Props> = ({ model, onUpdate }) => {
  return <>
    <HTMLDialog model={model.html} onChange={value =>  onUpdate({
      ...model, html: value ?? '',
    })}/>

    <CSSDialog model={model.css} onChange={value =>  onUpdate({
      ...model, css: value ?? '',
    })}/>

    <JavascriptDialog model={model.javascript} onChange={value =>  onUpdate({
      ...model, javascript: value ?? '',
    })}/>
  </>;
};