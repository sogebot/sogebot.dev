import { Alerts, AlertText } from '@backend/database/entity/overlay';
import { Button, Stack } from '@mui/material';
import { Atom, useAtomValue } from 'jotai';
import { isEqual } from 'lodash';
import React from 'react';

import { AccordionAnimationIn } from './Accordion/AnimationIn';
import { AccordionAnimationOut } from './Accordion/AnimationOut';
import { AccordionDelay } from './Accordion/Delay';
import { AccordionEmotes } from './Accordion/Emotes';
import { AccordionFilter } from './Accordion/Filter';
import { AccordionMessageTemplate } from './Accordion/MessageTemplate';
import { anSelectedAlert, anSelectedAlertVariant } from './src/atoms';
import { rules } from './src/rules';
import { AccordionFont } from '../../../Accordion/Font';
import { anSelectedItemOpts } from '../../atoms';

interface AlertSettingsTextProps {
  model:     AlertText
  onChange:  (value: AlertText) => void
  onDelete?: () => void
}

const AlertSettingsText: React.FC<AlertSettingsTextProps> = (props) => {
  const [ item, setItem ] = React.useState(props.model);
  React.useEffect(() => {
    setItem(it => ({
      ...it, rotation: props.model.rotation, alignX: props.model.alignX, alignY: props.model.alignY, width: props.model.width, height: props.model.height,
    }));
  }, [ props.model.rotation, props.model.alignX, props.model.alignY, props.model.width, props.model.height]);

  const [ accordion, setAccordion ] = React.useState('');

  const parent = useAtomValue(anSelectedItemOpts as Atom<Alerts>);
  const variant = useAtomValue(anSelectedAlertVariant);
  const selectedAlert = useAtomValue(anSelectedAlert);

  const isParent = item.font === null;

  React.useEffect(() => {
    if (!isEqual(item, props.model)) {
      props.onChange(item);
    }
  }, [ item ]);
  return (parent && variant) ? <>
    <AccordionMessageTemplate open={accordion} onOpenChange={setAccordion} model={item.messageTemplate} onChange={(messageTemplate) => setItem({
      ...item, messageTemplate,
    })}/>
    <AccordionEmotes open={accordion} onOpenChange={setAccordion} model={item.allowEmotes ?? {
      twitch: false, ffz: false, bttv: false,
    }} onChange={(allowEmotes) => setItem({
      ...item, allowEmotes,
    })}/>
    <AccordionFont open={accordion}
      alwaysShowLabelDetails
      onOpenChange={setAccordion}
      model={item.font ?? parent[item.globalFont]}
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
      prepend={item.animationIn !== null ? <Stack direction='row'>
        <Button fullWidth onClick={() => {
          setItem({
            ...item, animationIn: null, animationInDuration: null,
          });
        }}>Use variant setting</Button>
      </Stack>
        : null}/>
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
      prepend={item.animationOut !== null ? <Stack direction='row'>
        <Button fullWidth onClick={() => {
          setItem({
            ...item, animationOut: null, animationOutDuration: null,
          });
        }}>Use variant setting</Button>
      </Stack>
        : null}/>

    <AccordionFilter
      model={item.enabledWhen}
      open={accordion}
      rules={rules(selectedAlert?.hooks[0] ?? null)}
      onOpenChange={setAccordion} onChange={(filter) => {
        setItem({
          ...item, enabledWhen: filter,
        });
      }}/>

    {props.onDelete && <Button sx={{ mt: 2 }}color='error' onClick={props.onDelete}>Delete</Button>}  </>
    : <></>;
};

export default AlertSettingsText;
