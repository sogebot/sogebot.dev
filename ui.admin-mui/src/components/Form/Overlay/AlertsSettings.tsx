import { Alerts } from '@backend/database/entity/overlay';
import { Button, Dialog, DialogActions } from '@mui/material';
import { Atom, useAtomValue } from 'jotai';
import React from 'react';

import { AccordionDelay } from './AlertSettings/Accordion/Delay';
import { AccordionParry } from './AlertSettings/Accordion/Parry';
import { AccordionProfanity } from './AlertSettings/Accordion/Profanity';
import { AlertSettingsGroup } from './AlertSettings/Group';
import { AlertsRegistryTesterAccordion } from './AlertSettings/tester';
import { useAppDispatch } from '../../../hooks/useAppDispatch';
import { useTranslation } from '../../../hooks/useTranslation';
import { setParentDelKeyDisableStatus } from '../../../store/overlaySlice';
import { AccordionFont } from '../../Accordion/Font';
import { AccordionTTS } from '../../Accordion/TTS';
import { anSelectedItemCanvas, anSelectedItemOpts } from '../atoms';

type Props = {
  onUpdate: (value: Alerts) => void;
};

export const AlertsSettings: React.FC<Props> = ({ onUpdate }) => {
  const { translate } = useTranslation();
  const [ openedAccordion, setOpenedAccordion ] = React.useState('');

  const [ open, setOpen ] = React.useState(false);

  const model = useAtomValue(anSelectedItemOpts as Atom<Alerts>);
  const canvas = useAtomValue(anSelectedItemCanvas);

  const [ changes, setChanges ] = React.useState<Alerts['items'] | null>(null);

  const dispatch = useAppDispatch();
  React.useEffect(() => {
    dispatch(setParentDelKeyDisableStatus(open));
  }, [open]);

  return model && <>
    <AccordionDelay model={model.alertDelayInMs} onChange={alertDelayInMs => onUpdate({
      ...model, alertDelayInMs,
    })} open={openedAccordion} onOpenChange={val => setOpenedAccordion(val)}/>

    <AccordionParry model={model.parry} onChange={parry => onUpdate({
      ...model, parry,
    })} open={openedAccordion} onOpenChange={val => setOpenedAccordion(val)}/>

    <AccordionProfanity model={model.profanityFilter} onChange={profanityFilter => onUpdate({
      ...model, profanityFilter,
    })} open={openedAccordion} onOpenChange={val => setOpenedAccordion(val)}/>

    <AccordionFont model={model.globalFont1} label={`${translate('registry.alerts.font.setting')} global 1`} onChange={globalFont1 => onUpdate({
      ...model, globalFont1,
    })} open={openedAccordion} onOpenChange={val => setOpenedAccordion(val)}/>

    <AccordionFont model={model.globalFont2} label={`${translate('registry.alerts.font.setting')} global 2`} onChange={globalFont2 => onUpdate({
      ...model, globalFont2,
    })} open={openedAccordion} onOpenChange={val => setOpenedAccordion(val)}/>

    <AccordionTTS model={model.tts} onChange={tts => onUpdate({
      ...model, tts,
    })} open={openedAccordion} onOpenChange={val => setOpenedAccordion(val)}/>

    <AlertsRegistryTesterAccordion/>

    <Button sx={{ py: 1 }} fullWidth onClick={() => setOpen(true)} variant='contained'>Configure</Button>
    <Dialog
      open={open}
      fullScreen>
      <AlertSettingsGroup canvas={canvas} onUpdate={(items) => {
        setChanges(items);
      }}/>
      <DialogActions>
        <Button color='error' sx={{ width: 150 }} onClick={() => {
          setOpen(false);
        }}>Discard</Button>
        <Button sx={{ width: 150 }} onClick={() => {
          if (changes) {
            onUpdate({
              ...model, items: changes,
            });
          }
          setOpen(false);
        }}>Close</Button>
      </DialogActions>
    </Dialog>

  </>;
};