import { Box } from '@mui/material';
import { Eventlist } from '@sogebot/backend/dest/database/entity/overlay';
import React from 'react';

import { loadFont } from '../Accordion/Font';

type Props = {
  item: Eventlist,
  id: string,
  groupId: string,
  /** Overlay is active, e.g. used in overlay */
  active?: boolean,
};
export const EventlistItem: React.FC<Props> = ({ item, active }) => {
  const [ model, setModel ] = React.useState(item);

  React.useEffect(() => {
    setModel(item);
  }, [item]);

  React.useEffect(() => {
    loadFont(model.usernameFont.family);
    loadFont(model.eventFont.family);

    if (active) {
      console.log(`====== EVENTLIST ======`);
    }
  }, [item]);

  return <>
    <Box>
      Eventlist, yay
    </Box>
  </>;
};