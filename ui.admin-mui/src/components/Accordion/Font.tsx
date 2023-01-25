import { ExpandMoreTwoTone } from '@mui/icons-material';
import {
  Accordion, AccordionDetails, AccordionProps, AccordionSummary, FormControl, InputLabel, MenuItem, Select, Typography,
} from '@mui/material';
import { Randomizer } from '@sogebot/backend/dest/database/entity/randomizer';
import axios from 'axios';
import React from 'react';

import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useTranslation } from '../../hooks/useTranslation';

function loadFont (value: string) {
  const head = document.getElementsByTagName('head')[0];
  const style = document.createElement('style');
  style.type = 'text/css';
  console.debug('Loading font', value);
  const font = value.replace(/ /g, '+');
  const css = '@import url(\'https://fonts.googleapis.com/css?family=' + font + '\');';
  style.appendChild(document.createTextNode(css));
  head.appendChild(style);
}

type Props = Omit<AccordionProps, 'children' | 'onChange'> & {
  model: Randomizer['customizationFont'],
  open: string,
  onClick: (value: string) => void;
  onChange: (value: Randomizer['customizationFont']) => void;
};
export const AccordionFont: React.FC<Props> = (props) => {
  const accordionId = 'font';
  const { open,
    onClick,
    onChange,
    model,
    ...accordionProps } = props;
  const { translate } = useTranslation();
  const [server] = useLocalStorage('server', 'https://demobot.sogebot.xyz');
  const [ fonts, setFonts ] = React.useState<string[]>([]);

  const handleClick = () => {
    onClick(open === accordionId ? '' : accordionId);
  };

  React.useEffect(() => {
    if (server) {
      axios.get(`${server}/fonts`)
        .then(({ data }) => {
          setFonts(data.items.map((o: any) => o.family));
        });
    }
  }, [server]);

  React.useEffect(() => {
    loadFont(model.family);
  }, [ model.family ]);

  return <Accordion {...accordionProps} disabled={props.disabled} expanded={open === accordionId && !props.disabled}>
    <AccordionSummary
      expandIcon={<ExpandMoreTwoTone />}
      onClick={() => handleClick()}
      aria-controls="panel1a-content"
      id="panel1a-header"
    >
      <Typography>{ translate('registry.alerts.font.setting') }</Typography>
    </AccordionSummary>
    <AccordionDetails>

      {fonts.length > 0 && <FormControl fullWidth variant="filled" >
        <InputLabel id="registry.alerts.font.name">{translate('registry.alerts.font.name')}</InputLabel>
        <Select
          MenuProps={{ PaperProps: { sx: { maxHeight: 200 } } }}
          label={translate('registry.alerts.voice')}
          labelId="registry.alerts.font.name"
          value={model.family}
          onChange={(ev) => onChange({
            ...model, family: ev.target.value as typeof model.family,
          })}
        >
          {fonts.map(o => <MenuItem value={o} key={o}>{o}</MenuItem>)}
        </Select>
      </FormControl>}

    </AccordionDetails>
  </Accordion>;
};