import { TabContext, TabList, TabPanel } from '@mui/lab';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, SxProps, Tab, Theme } from '@mui/material';
import React from 'react';

import { FormTriggerAlert } from '../Input/TriggerAlert';

type Props = {
  source: string;
  buttonsx?: SxProps<Theme>;
  onSave: (source: string) => void;
};
const regex = /Alerts\.trigger\((?<config>.*?)\)/g;

export const TriggerAlertDialog: React.FC<Props> = ({ source, buttonsx, onSave }) => {
  const [ open, setOpen ] = React.useState(false);
  const [ model, setModel ] = React.useState(source);

  const [tabValue, setTabValue] = React.useState('1');
  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setTabValue(newValue);
  };

  React.useEffect(() => {
    setModel(source);
  }, [ source ]);

  const alerts = React.useMemo<string[]>(() => {
    const matches = model.match(regex);
    if (matches) {
      const values: string[] = [];
      for (const match of matches) {
        values.push(match.replace('Alerts.trigger(', '$triggerAlert(').replaceAll('\'', ''));
      }
      return values;
    }
    return [];
  }, [ model ]);

  const handleChangeIdx = (value: string, idx: number) => {
    const [ id, config ] = value.replace('$triggerAlert(', '').replace(')', '').split(',').map(o => o.trim());
    console.log({ id, config, idx });

    let count = 0;
    setModel((it) => it.replace(regex, (match) => {
      count++;
      if (count === idx + 1) {
        const updatedSource = config
          ? `Alerts.trigger('${id}', '${config}')`
          : `Alerts.trigger('${id}')`  ;
        console.log({ updatedSource });
        return updatedSource;
      } else {
        return match;
      }
    }));
  };

  return <>
    <TabContext value={tabValue}>
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth='xl'>
        <DialogContent dividers sx={{ py: 0 }}>
          <TabList onChange={handleTabChange}>
            {alerts.map((_, idx) => <Tab key={idx} label={`Alert ${idx + 1}`} value={String(idx + 1)}/>)}
          </TabList>
        </DialogContent>
        <DialogContent dividers>
          <DialogContentText>
            {alerts.map((alert, idx) => <TabPanel key={idx} value={String(idx + 1)}>
              <FormTriggerAlert value={{
                response: alert
              }} idx={idx} onChange={(value) => handleChangeIdx(value.response, idx)}/>
            </TabPanel>)}
          </DialogContentText>
        </DialogContent>

        <DialogActions>
          <Button variant='contained' onClick={() => {
            setOpen(false);
          }}>Close</Button>
          <Button variant='contained' onClick={() => {
            setOpen(false); onSave(model);
          }}>Save</Button>
        </DialogActions>
      </Dialog>
    </TabContext>

    <Button fullWidth sx={buttonsx} variant='text' onClick={() => setOpen(true)}>Open Alert Trigger Editor</Button>
  </>;
};