import {
  Alert, Button, Stack,
} from '@mui/material';
import { AlertCustom, Alerts } from '@sogebot/backend/src/database/entity/overlay';
import { Atom, useAtomValue } from 'jotai';
import { isEqual } from 'lodash';
import React from 'react';

import { AccordionEmotes } from './Accordion/Emotes';
import { AccordionFilter } from './Accordion/Filter';
import { anSelectedAlert } from './src/atoms';
import { rules } from './src/rules';
import { AccordionFont } from '../../../Accordion/Font';
import { anSelectedItemOpts } from '../../atoms';
import { CSSDialog } from '../HTMLSettings/css';
import { HTMLDialog } from '../HTMLSettings/html';
import { JavascriptDialog } from '../HTMLSettings/javascript';

interface AlertSettingsCustomProps {
  model: AlertCustom
  onChange: (value: AlertCustom) => void
  onDelete?: () => void
}

const AlertSettingsCustom: React.FC<AlertSettingsCustomProps> = (props) => {
  const [ item, setItem ] = React.useState(props.model);
  const [ accordion, setAccordion ] = React.useState('');

  const parent = useAtomValue(anSelectedItemOpts as Atom<Alerts>);
  const selectedAlert = useAtomValue(anSelectedAlert);

  const isParent = item.font === null;

  React.useEffect(() => {
    if (!isEqual(item, props.model)) {
      props.onChange(item);
    }
  }, [ item ]);

  return (<>
    <Alert icon={false} severity="warning" sx={{ mb: 2 }}>Custom item doesn't have any animations, you will need to use your own CSS styles to do it</Alert>

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

    <AccordionEmotes open={accordion} onOpenChange={setAccordion} model={item.allowEmotes ?? {
      twitch: false, ffz: false, bttv: false,
    }} onChange={(allowEmotes) => setItem({
      ...item, allowEmotes,
    })}/>

    <AccordionFilter
      model={item.enabledWhen}
      open={accordion}
      rules={rules(selectedAlert?.hooks[0] ?? null)}
      onOpenChange={setAccordion} onChange={(filter) => {
        setItem({
          ...item, enabledWhen: filter,
        });
      }}/>

    <HTMLDialog model={item.html} onChange={value => setItem({
      ...item, html: value ?? '',
    })}/>
    <CSSDialog model={item.css} onChange={value => setItem({
      ...item, css: value ?? '',
    })}/>
    <JavascriptDialog  model={item.javascript} onChange={value => setItem({
      ...item, javascript: value ?? '',
    })}/>

    {props.onDelete && <Button sx={{ mt: 2 }}color='error' onClick={props.onDelete}>Delete</Button>}  </>
  );
};

export default AlertSettingsCustom;
