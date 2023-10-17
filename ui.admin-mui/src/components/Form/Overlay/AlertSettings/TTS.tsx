import {
  Alert, Button, Stack,
} from '@mui/material';
import { Alerts,  AlertTTS } from '@sogebot/backend/src/database/entity/overlay';
import { Atom, useAtomValue } from 'jotai';
import { isEqual } from 'lodash';
import React from 'react';

import { AccordionDelay } from './Accordion/Delay';
import { AccordionFilter } from './Accordion/Filter';
import { AccordionTTSTemplate } from './Accordion/TTSTemplate';
import { anSelectedAlert } from './src/atoms';
import { rules } from './src/rules';
import { AccordionTTS } from '../../../Accordion/TTS';
import { anSelectedItemOpts } from '../../atoms';

interface AlertSettingsTTSProps {
  model: AlertTTS
  onChange: (value: AlertTTS) => void
  onDelete: () => void
}

const AlertSettingsTTS: React.FC<AlertSettingsTTSProps> = (props) => {
  const [ item, setItem ] = React.useState(props.model);
  const [ accordion, setAccordion ] = React.useState('');

  const parent = useAtomValue(anSelectedItemOpts as Atom<Alerts>);

  const selectedAlert = useAtomValue(anSelectedAlert);

  React.useEffect(() => {
    if (!isEqual(item, props.model)) {
      props.onChange(item);
    }
  }, [ item ]);

  return (<>
    <Alert icon={false} severity="warning" sx={{ mb: 2 }}>TTS will speak after all audio components finished playing. If you need additional delay, set it in this component settings.</Alert>

    <AccordionTTSTemplate open={accordion} onOpenChange={setAccordion} model={item.ttsTemplate} onChange={(ttsTemplate) => setItem({
      ...item, ttsTemplate,
    })}/>

    <AccordionTTS
      alwaysShowLabelDetails
      model={item.tts ? item.tts : parent.tts} open={accordion} onOpenChange={setAccordion} onChange={(val) => {
        setItem({
          ...item,
          'tts': val,
        });
      }}
      customLabelDetails={(item.tts === null)
        ? <strong>Global</strong>
        : <><strong>Modified</strong> {item.tts.voice}</>}
      prepend={item.tts !== null && <Stack direction='row'>
        <Button fullWidth onClick={() => {
          setItem({
            ...item, tts: null,
          });
        }}>Use global setting</Button>
      </Stack>}/>

    <AccordionDelay
      label={'Speak delay'}
      max={60} model={item.speakDelay ?? 0} onOpenChange={(v) => setAccordion(v)} open={accordion} onChange={speakDelay => setItem({
        ...item, speakDelay,
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
    <Button sx={{ mt: 2 }}color='error' onClick={props.onDelete}>Delete</Button>
  </>
  );
};

export default AlertSettingsTTS;
