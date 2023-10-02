import { Button, Stack } from '@mui/material';
import { AlertCustom, Alerts } from '@sogebot/backend/src/database/entity/overlay';
import { Atom, useAtomValue } from 'jotai';
import { isEqual } from 'lodash';
import React from 'react';

import { AccordionFont } from '../../../Accordion/Font';
import { anSelectedItemOpts } from '../../atoms';
import { CSSDialog } from '../HTMLSettings/css';
import { HTMLDialog } from '../HTMLSettings/html';
import { JavascriptDialog } from '../HTMLSettings/javascript';

interface AlertSettingsCustomProps {
  model: AlertCustom
  onChange: (value: AlertCustom) => void
}

const AlertSettingsCustom: React.FC<AlertSettingsCustomProps> = (props) => {
  const [ item, setItem ] = React.useState(props.model);
  const [ accordion, setAccordion ] = React.useState('');

  const parent = useAtomValue(anSelectedItemOpts as Atom<Alerts>);

  const isParent = item.font === null;

  React.useEffect(() => {
    if (!isEqual(item, props.model)) {
      props.onChange(item);
    }
  }, [ item ]);

  return (<>
    <AccordionFont open={accordion}
      alwaysShowLabelDetails
      onOpenChange={setAccordion} model={item.font ?? parent[item.globalFont]}
      onChange={(font) => setItem({
        ...item, font,
      })}
      customLabelDetails={(isParent || !item.font)
        ? <strong>Global {item.globalFont.replace('globalFont', '')}</strong>
        : <><strong>Modified</strong> {item.font.family} {'size' in item.font && `${item.font.size}px`}</>}
      prepend={<Stack direction='row'>
        <Button variant={item.globalFont === 'globalFont1' && isParent ? 'contained' : undefined} fullWidth onClick={() => {
          setItem({
            ...item, globalFont: 'globalFont1', font: null,
          });
        }}>Global 1</Button>
        <Button variant={item.globalFont === 'globalFont2' && isParent ? 'contained' : undefined} fullWidth onClick={() => {
          setItem({
            ...item, globalFont: 'globalFont2', font: null,
          });
        }}>Global 2</Button>
      </Stack>}
    />

    <HTMLDialog model={item.html} onChange={value => setItem({
      ...item, html: value ?? '',
    })}/>
    <CSSDialog model={item.css} onChange={value => setItem({
      ...item, css: value ?? '',
    })}/>
    <JavascriptDialog  model={item.javascript} onChange={value => setItem({
      ...item, javascript: value ?? '',
    })}/>
  </>
  );
};

export default AlertSettingsCustom;
