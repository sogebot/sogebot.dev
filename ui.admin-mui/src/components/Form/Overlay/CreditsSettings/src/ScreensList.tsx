import { clips, events, title } from './DefaultScreens';

export const screensList = {
  custom: {
    title:       'Custom HTML/CSS',
    description: 'You can define your own screen how you like!',
    settings:    {
      ...title ,
      waitBetweenScreens: 0,
      name:               '',
      items:              [],
    },
  },
  events: {
    title:       'Events',
    description: 'Shows all your selected events during stream.',
    settings:    events,
  },
  clips: {
    title:       'Clips',
    description: 'Carousel of all of your clips during stream or specified time.',
    settings:    clips,
  },
} as const;