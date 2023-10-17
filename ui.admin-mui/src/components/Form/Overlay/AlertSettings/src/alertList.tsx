const defaultAudio = {
  id:        '__id__',
  width:     20,
  height:    20,
  alignX:    '__center__',
  alignY:    '__center__',
  rotation:  0,
  type:      'audio',
  galleryId: '%default%',
  volume:    0.2,
  delay:     0,
};

const defaultImage = {
  id:                   '__id__',
  width:                160,
  height:               205,
  alignX:               '__center__',
  alignY:               '__center__',
  rotation:             0,
  align:                'center',
  type:                 'gallery',
  volume:               0.2,
  loop:                 true,
  galleryId:            '%default%',
  isVideo:              false,
  animationDelay:       0,
  animationInDuration:  null,
  animationOutDuration: null,
  animationIn:          null,
  animationOut:         null,
};

const defaultText = (messageTemplate: string) => ({
  id:                   '__id__',
  width:                160,
  height:               100,
  alignX:               '__center__',
  alignY:               '__center__',
  rotation:             0,
  align:                'center',
  globalFont:           'globalFont1',
  font:                 null,
  tts:                  { enabled: false },
  type:                 'text',
  messageTemplate:      messageTemplate,
  animationDelay:       1500,
  animationInDuration:  null,
  animationOutDuration: null,
  animationIn:          null,
  animationOut:         null,
  allowEmotes:          {
    twitch: false, ffz: false, bttv: false,
  },
});

const defaultMessage = {
  id:                   '__id__',
  width:                160,
  height:               100,
  alignX:               '__center__',
  alignY:               '__center__',
  rotation:             0,
  align:                'center',
  globalFont:           'globalFont2',
  font:                 null,
  type:                 'text',
  messageTemplate:      '{message}',
  animationDelay:       3000,
  animationInDuration:  null,
  animationOutDuration: null,
  animationIn:          null,
  animationOut:         null,
  allowEmotes:          {
    twitch: true, ffz: true, bttv: true,
  },
};

const defaultTTS = (ttsTemplate: string) => ({
  id:          '__id__',
  width:       20,
  height:      20,
  alignX:      '__center__',
  alignY:      '__center__',
  rotation:    0,
  type:        'tts',
  speakDelay:  0,
  tts:         null,
  ttsTemplate: ttsTemplate,
  enabledWhen: null,
});

const defaultAlerts = {
  follow:           { items: [defaultAudio, defaultImage, defaultText('*{name}* is now following!')] } ,
  sub:              { items: [defaultAudio, defaultImage, defaultText('*{name}* just subscribed!')] },
  resub:            { items: [defaultAudio, defaultImage, defaultText('*{name}* just resubscribed! {amount} {monthsName}'), defaultMessage, defaultTTS('{message}')] },
  subgift:          { items: [defaultAudio, defaultImage, defaultText('*{name}* just gifted sub to *{recipient}*! *{amount}* {monthsName}')] },
  subcommunitygift: { items: [defaultAudio, defaultImage, defaultText('*{name}* just gifted *{amount}* subscribes!')] },
  raid:             { items: [defaultAudio, defaultImage, defaultText('*{name}* is raiding with a party of *{amount}* raiders!')] },
  promo:            { items: [defaultAudio, defaultImage, defaultText('{name} | {game}')] },
  tip:              { items: [defaultAudio, defaultImage, defaultText('*{name}* tipped *{amount}{currency}*!'), defaultMessage, defaultTTS('{message}')] },
  cheer:            { items: [defaultAudio, defaultImage, defaultText('*{name}* cheered! x*{amount}*'), defaultMessage, defaultTTS('{message}')] },
  rewardredeem:     { items: [defaultAudio, defaultImage, defaultText('*{name}* was redeemed by *{recipient}*!')] },
  custom:           { items: [defaultAudio, defaultImage, defaultText('*{name}* was redeemed by *{recipient}* for x*{amount}*!')] },
};

const defaultItemValues = (cur: string) => ({
  name:                 `Default ${cur} alert`,
  enabled:              true,
  hooks:                [cur],
  id:                   '__id__',
  weight:               1,
  filter:               null,
  ttsTemplate:          '',
  alertDuration:        10000,
  animationInDuration:  1000,
  animationOutDuration: 1000,
  animationIn:          'fadeIn',
  animationOut:         'fadeOut',
  animationText:        'wobble',
  animationTextOptions: {
    speed:            'normal',
    maxTimeToDecrypt: 4000,
    characters:       '█▓░ </>',
  },
  variants: [],
});

export const alertList = {
  empty: {
    title:       'Empty alert',
    description: 'You can define your own screen how you like!',
    item:        {
      enabled:  true,
      id:       '__id__',
      name:     'Empty alert',
      weight:   1,
      hooks:    [],
      items:    [],
      variants: [],
      filter:   null,

      alertDuration:        10000,
      animationInDuration:  1000,
      animationIn:          'fadeIn',
      animationOutDuration: 1000,
      animationOut:         'fadeOut',
      animationText:        'wobble',
      animationTextOptions: {
        speed:            'normal',
        maxTimeToDecrypt: 4000,
        characters:       '█▓░ </>',
      },
    },
  },
  ...Object.keys(defaultAlerts).reduce((prev, cur) => {
    return {
      ...prev,
      [cur]: {
        title:       `Default ${cur} alert`,
        description: `Add basic ${cur} alert`,
        item:        {
          ...defaultItemValues(cur),
          items: defaultAlerts[cur as keyof typeof defaultAlerts].items,
        },
      },
    };
  }, {}),
  test: {
    title:       'Tip alert with custom component',
    description: 'Add tip alert with custom component',
    item:        {
      enabled:              true,
      name:                 'Custom tip alert',
      id:                   '__id__',
      hooks:                ['tip'],
      weight:               1,
      alertDuration:        10000,
      animationInDuration:  1000,
      animationOutDuration: 1000,
      animationIn:          'fadeIn',
      animationOut:         'fadeOut',
      animationText:        'wobble',
      animationTextOptions: {
        speed:            'normal',
        maxTimeToDecrypt: 4000,
        characters:       '█▓░ </>',
      },
      variants: [],
      items:    [{
        id:        '__id__',
        width:     20,
        height:    20,
        alignX:    '__center__',
        alignY:    '__center__',
        rotation:  0,
        type:      'audio',
        galleryId: '%default%',
        volume:    0.2,
        delay:     0,
      }, {
        id:          '__id__',
        width:       20,
        height:      20,
        alignX:      '__center__',
        alignY:      '__center__',
        rotation:    0,
        type:        'tts',
        speakDelay:  0,
        tts:         null,
        ttsTemplate: '{name} tipped you with {amount}{currency}! {message}',
        enabledWhen: null,
      }, {
        id:          '__id__',
        width:       700,
        height:      100,
        alignX:      '__center__',
        alignY:      '__center__',
        rotation:    0,
        type:        'custom',
        allowEmotes: {
          twitch: false, ffz: false, bttv: false,
        },
        enabledWhen: null,
        globalFont:  'globalFont1',
        font:        null,
        html:        `    <div id="__text__">
      <div class="main" >
        <div class="type"><span class="text">follow</span></div>
        <div class="name">{name}</div>
      </div>
    </div>`,
        css: `
        .text {
            display: inline-block;
              animation: fadeInText 2s forwards ease-out;
        }

        .main {
            text-align: center;
            width: 100%;
              animation: fadeIn 1.5s ease-out forwards,
                                fadeIn 1.5s 8.5s ease-in reverse forwards;
              transform: translateY(0);
              position: absolute;
        }

        .type {
            overflow: hidden;
            background-color: orange;
            padding: 5px;
            margin-bottom: 5px;
            font-weight: bold;
            text-transform: uppercase;
            width: fit-content;
            text-align: center;
            color: black;
            margin-left: 50%;
            transform: translateX(-50%);
        }

        .name {
            padding: 10px;
            font-weight: bold;
            text-transform: uppercase;
            color: white;
            line-height: 10px;
            font-size: 35px;
            text-shadow: 2px 2px black;
        }

        @keyframes fadeIn {
          0% {opacity:0; transform: translateY(300px)}
          60% {transform: translateY(-5px)}
          100% {opacity:1; transform: translateY(0px)}
        }


        @keyframes fadeInText {
          0% {opacity:0; transform: translateY(350px)}
          50% {transform: translateY(-5px)}
          100% {opacity:1;transform: translateY(0px)}
        }`,
        javascript: '',
      }],
      filter: null,
    },
  },
};