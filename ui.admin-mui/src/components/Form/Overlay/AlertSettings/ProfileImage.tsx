import {
  Button,
  Stack,
} from '@mui/material';
import { AlertProfileImage } from '@sogebot/backend/src/database/entity/overlay';
import { useAtomValue } from 'jotai';
import { isEqual } from 'lodash';
import React from 'react';

import { AccordionAnimationIn } from './Accordion/AnimationIn';
import { AccordionAnimationOut } from './Accordion/AnimationOut';
import { AccordionDelay } from './Accordion/Delay';
import { anSelectedAlertVariant } from './src/atoms';

interface AlertSettingsProfileImageProps {
  model: AlertProfileImage
  onChange: (value: AlertProfileImage) => void
  onDelete?: () => void
}

const AlertSettingsProfileImage: React.FC<AlertSettingsProfileImageProps> = (props) => {
  const [ item, setItem ] = React.useState(props.model);
  const [ accordion, setAccordion ] = React.useState('');
  const variant = useAtomValue(anSelectedAlertVariant);

  React.useEffect(() => {
    if (!isEqual(item, props.model)) {
      props.onChange(item);
    }
  }, [ item ]);
  return (<>
    <AccordionDelay
      label={'Animation delay'}
      max={60} model={item.animationDelay} onOpenChange={(v) => setAccordion(v)} open={accordion} onChange={animationDelay => {
        if (item.animationDelay === animationDelay) {
          return;
        }
        setItem({
          ...item, animationDelay,
        });
      }}/>
    <AccordionAnimationIn
      alwaysShowLabelDetails
      model={{
        animationIn:         item.animationIn ? item.animationIn : variant!.animationIn,
        animationInDuration: item.animationInDuration ? item.animationInDuration : variant!.animationInDuration,
      }} open={accordion} onOpenChange={setAccordion} onChange={(val) => {
        if (item.animationIn === val.animationIn && item.animationInDuration === val.animationInDuration) {
          return;
        }
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
        if (item.animationOut === val.animationOut && item.animationOutDuration === val.animationOutDuration) {
          return;
        }
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

    {props.onDelete && <Button sx={{ mt: 2 }}color='error' onClick={props.onDelete}>Delete</Button>}  </>
  );
};

export default AlertSettingsProfileImage;
