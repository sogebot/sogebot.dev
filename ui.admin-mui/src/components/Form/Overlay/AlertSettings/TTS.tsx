import { Button, Stack } from '@mui/material';
import { Alerts,  AlertTTS } from '@sogebot/backend/src/database/entity/overlay';
import { Atom, useAtomValue } from 'jotai';
import { isEqual } from 'lodash';
import React from 'react';

import { AccordionFilter } from './Accordion/Filter';
import { AccordionTTSTemplate } from './Accordion/TTSTemplate';
import { anSelectedAlert } from './src/atoms';
import { rules } from './src/rules';
import { AccordionTTS } from '../../../Accordion/TTS';
import { anSelectedItemOpts } from '../../atoms';

interface AlertSettingsTTSProps {
  model: AlertTTS
  onChange: (value: AlertTTS) => void
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

    <AccordionFilter
      model={item.enabledWhen}
      open={accordion}
      rules={rules(selectedAlert?.hooks[0] ?? null)}
      onOpenChange={setAccordion} onChange={(filter) => {
        setItem({
          ...item, enabledWhen: filter,
        });
      }}/>
  </>
  );
};

export default AlertSettingsTTS;
