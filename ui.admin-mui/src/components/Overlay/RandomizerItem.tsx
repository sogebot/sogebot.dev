import {
  Box, Fade, FormControl, Grow, InputLabel, MenuItem, Select, Typography,
} from '@mui/material';
import { Randomizer as Overlay } from '@sogebot/backend/dest/database/entity/overlay';
import { Randomizer } from '@sogebot/backend/dest/database/entity/randomizer';
import { shadowGenerator, textStrokeGenerator } from '@sogebot/ui-helpers/text';
import { Mutex } from 'async-mutex';
import axios from 'axios';
import gsap from 'gsap';
import { random } from 'lodash';
import React from 'react';
import { Helmet } from 'react-helmet';
import { useIntervalWhen } from 'rooks';
import shortid from 'shortid';

import type { Props } from './ChatItem';
import { getContrastColor } from '../../colors';
import getAccessToken from '../../getAccessToken';
import { getSocket } from '../../helpers/socket';
import { loadFont } from '../Accordion/Font';
import { generateItems } from '../Form/RandomizerEdit';

const mutex = new Mutex();
const delay = (time: number) => new Promise((resolve) => setTimeout(resolve, time));

const isResponsiveVoiceEnabled = () => {
  return new Promise<void>((resolve) => {
    const check = () => {
      if (typeof (window as any).responsiveVoice === 'undefined') {
        setTimeout(() => check(), 200);
      } else {
        console.debug('= ResponsiveVoice init OK');
        (window as any).responsiveVoice.init();
        resolve();
      }
    };
    check();
  });
};

let isSpeaking = false;
const isTTSPlaying = {
  0: () => typeof window.responsiveVoice !== 'undefined' && window.responsiveVoice.isPlaying(),
  1: () => isSpeaking,
};
const speak = (service: 0 | 1, key: string, text: string, voice: string, rate: number, pitch: number, volume: number) => {
  if (isTTSPlaying[service]()) {
    // wait and try later
    setTimeout(() => speak(service, key, text, voice, rate, pitch, volume), 1000);
    return;
  }

  if (service === 0) {
    // RESPONSIVE VOICE
    window.responsiveVoice.speak(text, voice, {
      rate, pitch, volume,
    });
  } else {
    // GOOGLE
    isSpeaking = true;
    getSocket('/core/tts', true).emit('speak', {
      voice, rate, pitch, volume, key, text,
    }, (err, b64mp3) => {
      if (err) {
        isSpeaking = false;
        return console.error(err);
      }
      const snd = new Audio(`data:audio/mp3;base64,` + b64mp3);
      snd.play();
      snd.onended = () => (isSpeaking = false);
    });
  }
};

function getMiddleElement () {
  const clientWidth = window.innerWidth;
  let element: null | HTMLElement = null;
  for (const child of Array.from(document.getElementById('tape')?.children ?? [])) {
    if (child.getBoundingClientRect().x < clientWidth / 2) {
      element = child as HTMLElement;
    } else {
      break;
    }
  }
  return element;
}

function blinkElementColor (element: HTMLElement) {
  console.log({
    element, gsap,
  });
  const tl = gsap.timeline({
    repeat: 4, repeatDelay: 0,
  });
  tl.to(element, { color: 'darkorange' });
  tl.to(element, { color: element.style.color });
}

function blinkElementBackground (element: HTMLElement) {
  const tl = gsap.timeline({
    repeat: 4, repeatDelay: 0,
  });
  tl.to(element, { backgroundColor: 'darkorange' });
  tl.to(element, { backgroundColor: element.style.backgroundColor });
}

export const RandomizerItem: React.FC<Props<Overlay>> = ({ active, selected }) => {
  const [responsiveVoiceKey, setResponsiveVoiceKey] = React.useState<string | null>(null);

  const [ randomizerId, setRandomizerId ] = React.useState('');
  const [ randomizers, setRandomizers ] = React.useState<Randomizer[]>([]);
  const [ threadId ] = React.useState(shortid());

  // simple randomizer
  const [ simpleIndex, setSimpleIndex ] = React.useState(0);

  const animationTriggered = React.useRef(false);
  const [ tapeLoops, setTapeLoops ] = React.useState(0);
  const tapeLoopsRef = React.useRef(tapeLoops);
  React.useEffect(() => {
    tapeLoopsRef.current = tapeLoops;
  }, [tapeLoops]);

  const currentRandomizer = React.useMemo<Randomizer | undefined>(() => {
    const randomizer = randomizers.find(o => o.id === randomizerId);
    if (randomizer) {
      loadFont(randomizer.customizationFont.family);
    }
    return randomizer;
  }, [randomizers, randomizerId]);
  const currentRandomizerRef = React.useRef(currentRandomizer);
  React.useEffect(() => {
    currentRandomizerRef.current = currentRandomizer;
  }, [currentRandomizer]);

  React.useEffect(() => {
    console.log(`====== Randomizer (${threadId}) ======`);

    getSocket('/registries/randomizer', true).on('spin', async ({ service, key }) => {
      if (service === 0) {
        setResponsiveVoiceKey(key);
        await isResponsiveVoiceEnabled();
      }

      if (!currentRandomizerRef.current) {
        console.error('No randomizer is visible!');
        return;
      }

      if (animationTriggered.current) {
        return;
      }
      animationTriggered.current = true;

      if (currentRandomizerRef.current.type === 'simple') {
        let selectedIdx = 0;
        await new Promise<void>((resolve) => {
          let moveBy = random(100, Math.max(200, (currentRandomizerRef.current?.items.length ?? 0) * 10));
          const move = async () => {
            if (moveBy === 0) {
              resolve();
              return;
            }
            if (moveBy < 3) {
              await delay(1000);
            } else if (moveBy < 10) {
              await delay(200);
            } else if (moveBy < 20) {
              await delay(100);
            } else if (moveBy < 50) {
              await delay(50);
            } else if (moveBy < 100) {
              await delay(25);
            }
            setSimpleIndex(idx => {
              const newIdx = idx + 1;
              selectedIdx = currentRandomizerRef.current?.items[newIdx] ? newIdx : 0;
              return selectedIdx;
            });
            moveBy--;
            setTimeout(() => move(), 10);
          };
          move();
        });
        animationTriggered.current = false;
        console.log('Blinking', document.getElementById('simple'));
        console.log('Speaking', currentRandomizerRef.current?.items[selectedIdx].name);
        blinkElementColor(document.getElementById('simple')!);
        speak(service, key, currentRandomizerRef.current?.items[selectedIdx].name, currentRandomizerRef.current.tts.voice, currentRandomizerRef.current.tts.rate, currentRandomizerRef.current.tts.pitch, currentRandomizerRef.current.tts.volume);

      }

      if (currentRandomizerRef.current.type === 'tape') {
        // get initial size of div of 1 loop
        const width = (document.getElementById('tape')?.clientWidth ?? 0) / (tapeLoopsRef.current + 5);

        // add several loops
        const newLoops = tapeLoopsRef.current + Math.floor(Math.random() * 5);
        setTapeLoops(newLoops);

        // we need to move x loops with last loop random
        const newPos = width * (newLoops + 1) + Math.floor(Math.random() * width);

        gsap.to(document.getElementById('tape'), {
          x:          -newPos,
          duration:   5 + Math.random() * 5,
          ease:       'ease-out',
          onComplete: () => {
            animationTriggered.current = false;

            // we need to get element in the middle
            const winnerEl = getMiddleElement();
            if (winnerEl) {
              if (currentRandomizerRef.current && currentRandomizerRef.current.tts.enabled) {
                speak(service, key, winnerEl.innerHTML.trim(), currentRandomizerRef.current.tts.voice, currentRandomizerRef.current.tts.rate, currentRandomizerRef.current.tts.pitch, currentRandomizerRef.current.tts.volume);
              }
              blinkElementBackground(winnerEl);
            }
          },
        });
      }
    });
  }, []);

  const refresh = React.useCallback(async () => {
    axios.get(`${JSON.parse(localStorage.server)}/api/registries/randomizer`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
      .then(({ data }) => {
        setRandomizers(data.data);
      });
  }, []);

  React.useEffect(() => {
    setSimpleIndex(random(currentRandomizerRef.current?.items.length ?? 0));
  }, [randomizerId]);

  useIntervalWhen(async () => {
    // we need to lock mutex because we are doing mid states
    if (mutex.isLocked()) {
      return;
    }
    const release = await mutex.acquire();
    if (!active) {
      await refresh();
    } else {
      const response = await axios.get(`${JSON.parse(localStorage.server)}/api/registries/randomizer/visible`, { headers: { authorization: `Bearer ${getAccessToken()}` } });
      const randomizer = response.data.data;

      // if randomizer is not visible anymore, do midstate isShown:false, then remove
      if (!randomizer) {
        if (randomizers[0]) {
          setRandomizers(o => [{
            ...o[0], isShown: false,
          } as Randomizer]);
          await delay(500);
        }
        setRandomizers([]);
        setSimpleIndex(0);
        release();
        return;
      }

      // if we are changing randomizer, then we do midstate and then show new one
      if (randomizerId !== randomizer.id) {
        if (randomizers[0]) {
          setRandomizers(o => [{
            ...o[0], isShown: false,
          } as Randomizer]);
          await delay(500);
        }
      }
      setRandomizers([randomizer as Randomizer]);
      setRandomizerId(randomizer.id);

      if (randomizer.items.length === 0) {
        console.error('No items detected in your randomizer');
        release();
        return;
      }
    }
    release();
  }, 1000, true, true);

  return <>
    <Helmet>
      {responsiveVoiceKey && <script src={`https://code.responsivevoice.org/responsivevoice.js?key=${responsiveVoiceKey}`}></script>}
    </Helmet>
    <Box sx={{
      color:         'black',
      width:         '100%',
      height:        '100%',
      overflow:      'hidden',
      position:      'relative',
      textTransform: 'none !important',
      '*':           { lineHeight: 'normal' },
    }}>
      <Fade in={(currentRandomizer?.isShown ?? false) || (currentRandomizer !== undefined && !active)} unmountOnExit mountOnEnter>
        <Box sx={{ width: 'max-content' }}>
          {currentRandomizer && <Box>
            <Box
              sx={{
                textAlign:   'center',
                zIndex:      9999,
                left:        '50%',
                width:       '2px',
                position:    'absolute',
                bottom:      0,
                margin:      'auto',
                overflow:    'hidden',
                borderLeft:  '2px solid black',
                borderRight: '2px solid white',
                height:      `${document.getElementById('tape') ? document.getElementById('tape')!.offsetHeight : 0}px`,
                transition:  'all 200ms',
                boxShadow:   '0px 0px 10px 0px rgba(0,0,0,1)',
                clipPath:    'inset(0 -15px 0 -15px)',
              }}
            />
            {currentRandomizer.type === 'simple' && <Box sx={{
              height: 'fit-content', position: 'absolute',  width: 'max-content', bottom: 0, left: '50%', transform: `translateX(-50%)`,
            }}>
              <Box
                id="simple"
                style={{
                  color:      generateItems(currentRandomizer!.items)[simpleIndex].color,
                  width:      '100%',
                  padding:    '10px',
                  display:    'inline-block',
                  textAlign:  'center',
                  fontFamily: `'${currentRandomizer.customizationFont.family}'`,
                  fontSize:   currentRandomizer.customizationFont.size + 'px',
                  fontWeight: currentRandomizer.customizationFont.weight,
                  textShadow: [
                    textStrokeGenerator(
                      currentRandomizer.customizationFont.borderPx,
                      currentRandomizer.customizationFont.borderColor,
                    ),
                    shadowGenerator(currentRandomizer.customizationFont.shadow)].filter(Boolean).join(', '),
                }}
              >{generateItems(currentRandomizer!.items)[simpleIndex].name}</Box>
            </Box>}
            {currentRandomizer.type === 'tape' && <Box sx={{
              height: 'fit-content', position: 'absolute',  width: 'max-content', bottom: 0,
            }}>
              <Box id="tape" sx={{
                width: '100%', overflow: 'hidden',
              }}>
                {Array(5 + tapeLoops).fill(0).map((_, loop) => generateItems(currentRandomizer!.items).map((o, idx) => <Box
                  key={`${o.id}_${loop}_${idx}`}
                  style={{
                    backgroundColor: o.color,
                    color:           getContrastColor(o.color),
                    width:           'fit-content',
                    minWidth:        '200px',
                    padding:         '10px',
                    display:         'inline-block',
                    textAlign:       'center',
                    fontFamily:      `'${currentRandomizer.customizationFont.family}'`,
                    fontSize:        currentRandomizer.customizationFont.size + 'px',
                    fontWeight:      currentRandomizer.customizationFont.weight,
                    textShadow:      [
                      textStrokeGenerator(
                        currentRandomizer.customizationFont.borderPx,
                        currentRandomizer.customizationFont.borderColor,
                      ),
                      shadowGenerator(currentRandomizer.customizationFont.shadow)].filter(Boolean).join(', '),
                  }}
                >{o.name}</Box>),
                ) }
              </Box>
            </Box>}
          </Box>}
        </Box>
      </Fade>
    </Box>

    <Grow in={selected} unmountOnExit mountOnEnter>
      <Box sx={{
        position: 'absolute', top: `-50px`, fontSize: '10px', textAlign: 'left', left: 0, textTransform: 'none !important',
      }}>
        <FormControl variant="filled" sx={{ width: '100%' }}>
          <InputLabel id="demo-simple-select-standard-label" shrink>Randomizer to test</InputLabel>
          <Select
            fullWidth
            sx={{ minWidth: '250px' }}
            size='small'
            displayEmpty
            labelId="demo-simple-select-standard-label"
            id="demo-simple-select-standard"
            value={randomizerId}
            label="Countdown"
            onChange={(event) => setRandomizerId(event.target.value)}
          >
            <MenuItem value='' key='' sx={{ fontSize: '14px' }}><em>None</em></MenuItem>
            {randomizers.map(val => <MenuItem value={val.id} key={val.id}>
              <Typography variant='body2'>
                {val.name}
                <Typography component='span' sx={{
                  px: 0.5, fontWeight: 'bold',
                }}>{val.command}</Typography>
                <small>{val.id}</small>
              </Typography>
            </MenuItem>)}
          </Select>
        </FormControl>
      </Box>
    </Grow>
  </>;
};

/*
<!DOCTYPE html>
<html>
  <head>
    <style>
      .container {
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .wheel {
        position: relative;
        width: 700px;
        height: 700px;
        border: 1px solid black;
        border-radius: 50%;
        overflow: hidden;
      }

      .segment {
        position: absolute;
        top: 50%;
        left: 50%;
        display: flex;
        flex-wrap: wrap;
        margin-left: auto;
        transform: translateX(-50%);
        transform-origin: 0 0;
        width: 9999999px;
        height: 50%;
        clip-path: polygon(50% 0%, 100% 100%, 0% 100%);
      }

      .segment::after {
        text-align: center;
        align-self: center;
        margin: auto;
        transform-origin: 50% 50%;
    content: 'Lorem Ipsum Dolor';
    width:max-content;
    rotate: 90deg;
      }

      .segment:nth-child(1) {
        background-color: #1900ff;
      }

.segment:nth-child(2) {
  background-color: #3cff00;
  rotate: 180deg;
}

      .arrow {
        position: absolute;
        top: 0;
        left: 50%;
        transform: translate(-50%, -50%) rotate(0deg);
        width: 0;
        height: 0;
        border-style: solid;
        border-width: 0 20px 30px 20px;
        border-color: transparent transparent #000000 transparent;
      }

      #spin-button {
        margin-top: 20px;
        padding: 10px 20px;
        font-size: 20px;
        cursor: pointer;
      }

      #result {
        font-size: 30px;
        font-weight: bold;
        margin-top: 20px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="wheel">
        <div class="segment">
        </div>
        <div class="segment">
        </div>
        <!-- Segments will be dynamically created with JavaScript -->
      </div>
      <button id="spin-button" onclick="spin()">Spin the wheel</button>
      <p id="result"></p>
    </div>
</body>
</html>
*/