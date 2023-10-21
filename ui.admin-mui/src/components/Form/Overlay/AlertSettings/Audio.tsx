import { Button } from '@mui/material';
import { AlertAudio } from '@sogebot/backend/src/database/entity/overlay';
import { isEqual } from 'lodash';
import React from 'react';

import { AccordionDelay } from './Accordion/Delay';
import { FormSelectorGallery } from '../../Selector/Gallery';

interface AlertSettingsAudioProps {
  model: AlertAudio
  onChange: (value: AlertAudio) => void
  onDelete?: () => void
}

const AlertSettingsAudio: React.FC<AlertSettingsAudioProps> = (props) => {
  const [ item, setItem ] = React.useState(props.model);
  const [ accordion, setAccordion ] = React.useState('');

  React.useEffect(() => {
    if (!isEqual(item, props.model)) {
      props.onChange(item);
    }
  }, [ item ]);

  return (<>
    <FormSelectorGallery type='audio' volume={item.volume * 100} label='Select audio'
      onChange={(galleryId, volume) => {
        const galleryIdChanged = item.galleryId !== (galleryId ?? '%default%');
        const volumeChanged = item.volume !== (volume ? volume / 100 : 0);
        if (galleryIdChanged || volumeChanged) {
          setItem({
            ...item, galleryId: galleryId ?? '%default%', volume: volume ? volume / 100 : 0,
          });
        }
      }} value={item.galleryId}/>
    <AccordionDelay
      label={'Delay'}
      max={60} model={item.delay} onOpenChange={(v) => setAccordion(v)} open={accordion} onChange={delay => {
        if (item.delay === delay) {
          return;
        }
        setItem({
          ...item, delay,
        });
      }
      }/>
    {props.onDelete && <Button sx={{ mt: 2 }}color='error' onClick={props.onDelete}>Delete</Button>}
  </>
  );
};

export default AlertSettingsAudio;
