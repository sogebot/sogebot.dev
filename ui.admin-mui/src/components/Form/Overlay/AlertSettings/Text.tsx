import { Button, Stack } from '@mui/material';
import { Alerts, AlertText } from '@sogebot/backend/src/database/entity/overlay';
import { Atom, useAtomValue } from 'jotai';
import { isEqual } from 'lodash';
import React from 'react';

import { AccordionAnimationIn } from './Accordion/AnimationIn';
import { AccordionAnimationOut } from './Accordion/AnimationOut';
import { AccordionDelay } from './Accordion/Delay';
import { AccordionMessageTemplate } from './Accordion/MessageTemplate';
import { anSelectedAlertVariant } from './src/atoms';
import { AccordionFont } from '../../../Accordion/Font';
import { anSelectedItemOpts } from '../../atoms';

interface AlertSettingsTextProps {
  model: AlertText
  onChange: (value: AlertText) => void
}

const AlertSettingsText: React.FC<AlertSettingsTextProps> = (props) => {
  const [ item, setItem ] = React.useState(props.model);
  const [ accordion, setAccordion ] = React.useState('');

  const parent = useAtomValue(anSelectedItemOpts as Atom<Alerts>);
  const variant = useAtomValue(anSelectedAlertVariant);

  const isParent = item.font === null;

  React.useEffect(() => {
    if (!isEqual(item, props.model)) {
      props.onChange(item);
    }
  }, [ item ]);
  return (<>
    <AccordionMessageTemplate open={accordion} onOpenChange={setAccordion} model={item.messageTemplate} onChange={(messageTemplate) => setItem({
      ...item, messageTemplate,
    })}/>
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
    <AccordionDelay
      label={'Animation delay'}
      max={60} model={item.animationDelay} onOpenChange={(v) => setAccordion(v)} open={accordion} onChange={animationDelay => setItem({
        ...item, animationDelay,
      })}/>
    <AccordionAnimationIn
      alwaysShowLabelDetails
      model={{
        animationIn:         item.animationIn ? item.animationIn : variant!.animationIn,
        animationInDuration: item.animationInDuration ? item.animationInDuration : variant!.animationInDuration,
      }} open={accordion} onOpenChange={setAccordion} onChange={(val) => {
        setItem({
          ...item,
          'animationIn':         val.animationIn as any,
          'animationInDuration': val.animationInDuration,
        });
      }}
      customLabelDetails={(item.animationIn === null)
        ? <strong>Variant</strong>
        : <><strong>Modified</strong> {item.animationIn} {(item.animationInDuration ?? 0) / 1000}s</>}
      prepend={item.animationIn !== null && <Stack direction='row'>
        <Button fullWidth onClick={() => {
          setItem({
            ...item, animationIn: null, animationInDuration: null,
          });
        }}>Use variant setting</Button>
      </Stack>}/>
    <AccordionAnimationOut
      alwaysShowLabelDetails
      model={{
        animationOut:         item.animationOut ? item.animationOut : variant!.animationOut,
        animationOutDuration: item.animationOutDuration ? item.animationOutDuration : variant!.animationOutDuration,
      }} open={accordion} onOpenChange={setAccordion} onChange={(val) => {
        setItem({
          ...item,
          'animationOut':         val.animationOut as any,
          'animationOutDuration': val.animationOutDuration,
        });
      }}
      customLabelDetails={(item.animationOut === null)
        ? <strong>Variant</strong>
        : <><strong>Modified</strong> {item.animationOut} {(item.animationOutDuration ?? 0) / 1000}s</>}
      prepend={item.animationOut !== null && <Stack direction='row'>
        <Button fullWidth onClick={() => {
          setItem({
            ...item, animationOut: null, animationOutDuration: null,
          });
        }}>Use variant setting</Button>
      </Stack>}/>
  </>
  );
};

export default AlertSettingsText;
