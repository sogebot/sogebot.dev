import { Credits } from '@entity/overlay';
import { v4 } from 'uuid';

import { css, html } from './Templates';

export const separator200 = {
  id:                 v4(),
  height:             200,
  items:              [],
  name:               'Separator (200px)',
  type:               'custom',
  waitBetweenScreens: null,
  speed:              null,
};
export const separator500 = {
  id:                 v4(),
  height:             500,
  items:              [],
  name:               'Separator (500px)',
  type:               'custom',
  waitBetweenScreens: null,
  speed:              null,
};
export const separator1000 = {
  id:                 v4(),
  height:             1000,
  items:              [],
  name:               'Separator (1000px)',
  type:               'custom',
  waitBetweenScreens: null,
  speed:              null,
};

export const title = {
  id:     v4(),
  height: 550,
  items:  [
    {
      id:       v4(),
      alignX:   (1920 - 1600) / 2,
      alignY:   25,
      css,
      height:   500,
      width:    1600,
      rotation: 0,
      html,
      font:     {
        family:      'Cabin Condensed',
        align:       'center',
        weight:      500,
        color:       '#ffffff',
        size:        20,
        borderColor: '#000000',
        borderPx:    1,
        shadow:      [],
      },
    },
  ],
  name:               'Title Screen',
  type:               'custom',
  waitBetweenScreens: 0,
  speed:              null,
};

export const events = {
  id:            v4(),
  type:          'events',
  name:          'Events',
  columns:       3,
  excludeEvents: [
    'custom', 'promo', 'rewardredeem',
  ],
  waitBetweenScreens: null,
  speed:              null,
  headers:            {},
  headerFont:         {
    family:      'Cabin Condensed',
    align:       'left',
    weight:      900,
    color:       '#ffffff',
    size:        50,
    borderColor: '#000000',
    borderPx:    1,
    shadow:      [],
    pl:          100,
    pr:          0,
    pb:          50,
    pt:          100,
  },
  itemFont: {
    family:      'Cabin Condensed',
    align:       'center',
    weight:      500,
    color:       '#ffffff',
    size:        35,
    borderColor: '#000000',
    borderPx:    1,
    shadow:      [],
    pl:          0,
    pr:          0,
    pb:          20,
    pt:          0,
  },
  highlightFont: {
    family:      'Cabin Condensed',
    align:       'center',
    weight:      900,
    color:       '#FFD700',
    size:        35,
    borderColor: '#000000',
    borderPx:    1,
    shadow:      [],
  },
};

export const clips = {
  id:                 v4(),
  type:               'clips',
  name:               'Clips',
  play:               true,
  period:             'stream',
  periodValue:        2,
  numOfClips:         3,
  volume:             30,
  waitBetweenScreens: null,
  speed:              null,
  gameFont:           {
    family:      'Cabin Condensed',
    align:       'left',
    weight:      500,
    color:       '#ffffff',
    size:        35,
    borderColor: '#000000',
    borderPx:    1,
    shadow:      [],
    pl:          40,
    pr:          0,
    pb:          0,
    pt:          0,
  },
  titleFont: {
    family:      'Cabin Condensed',
    align:       'left',
    weight:      500,
    color:       '#ffffff',
    size:        60,
    borderColor: '#000000',
    borderPx:    1,
    shadow:      [],
    pl:          40,
    pr:          0,
    pb:          0,
    pt:          30,
  },
  createdByFont: {
    family:      'Cabin Condensed',
    align:       'left',
    weight:      500,
    color:       '#FFD700',
    size:        30,
    borderColor: '#000000',
    borderPx:    1,
    shadow:      [],
    pl:          40,
    pr:          0,
    pb:          0,
    pt:          0,
  },
};

export const creditsDefaultScreens = [
  {
    ...separator1000, id: v4(),
  },
  title,
  separator500,
  events,
  clips,
  {
    id:     v4(),
    height: 1080,
    items:  [
      {
        id:       v4(),
        alignX:   (1920 - 1600) / 2,
        alignY:   (1080 - 250) / 2,
        css,
        height:   185,
        width:    1600,
        rotation: 0,
        html:     'Thanks for watching!',
        font:     {
          family:      'Cabin Condensed',
          align:       'center',
          weight:      900,
          color:       '#ffffff',
          size:        130,
          borderColor: '#000000',
          borderPx:    1,
          shadow:      [],
        },
      },
    ],
    name:               'Ending Screen',
    type:               'custom',
    waitBetweenScreens: 0,
    speed:              null,
  },
] as Credits['screens'];