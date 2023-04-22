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

function blinkElementWoFBackground (element: HTMLElement) {
  const tl = gsap.timeline({
    repeat: 4, repeatDelay: 0,
  });
  const newBg = element.style.background.replace(/(rgb\(\w+, \w+, \w+\))/g, 'rgb(255, 140, 0)');
  tl.to(element, { background: newBg });
  tl.to(element, { background: element.style.background });
}

export const RandomizerItem: React.FC<Props<Overlay>> = ({ height, width, active, selected }) => {
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
        const tapeWidth = (document.getElementById('tape')?.clientWidth ?? 0) / (tapeLoopsRef.current + 5);

        // add several loops
        const newLoops = tapeLoopsRef.current + Math.floor(Math.random() * 5);
        setTapeLoops(newLoops);

        // we need to move x loops with last loop random
        const newPos = tapeWidth * (newLoops + 1) + Math.floor(Math.random() * tapeWidth);

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

      if (currentRandomizerRef.current.type === 'wheelOfFortune') {
        // add 10 loops (11 if we already rotated)
        const loops = ((document.getElementById('wheel')!.style.transform.length > 0 ? 11 : 10) + Math.random() * 5) * 360;

        gsap.to(document.getElementById('wheel'), {
          rotate:     `${loops}deg`,
          duration:   5 + Math.random() * 5,
          ease:       'easeOut',
          onComplete: () => {
            // cleanup rotation value to one rotation
            gsap.to(document.getElementById('wheel'), {
              duration: 0, rotate: `${loops % 360}deg`,
            });
            animationTriggered.current = false;
            if (currentRandomizerRef.current) {
              const winDeg = loops % 360;
              const numOfItems = generateItems(currentRandomizerRef.current!.items).length;
              const degPerItem = 360 / numOfItems;
              const index = Math.floor(winDeg / degPerItem);

              if (currentRandomizerRef.current.tts.enabled) {
                speak(service, key, generateItems(currentRandomizerRef.current!.items).reverse()[index].name, currentRandomizerRef.current.tts.voice, currentRandomizerRef.current.tts.rate, currentRandomizerRef.current.tts.pitch, currentRandomizerRef.current.tts.volume);
              }

              const segments = Array.from(document.getElementsByClassName('segment')).reverse();
              blinkElementWoFBackground(segments[index] as HTMLElement);
              console.log(segments[index]);
            }
            // TODO: get winner to blink and speak
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

            {/* {JSON.stringify({ items: generateItems(currentRandomizer!.items) })} */}
            {currentRandomizer.type === 'wheelOfFortune' && <>
              <Box sx={{
                position:  'absolute',
                left:      '50%',
                top:       '-35px',
                transform: 'translateX(-50%)',
                zIndex:    2,
              }}>
                <Box sx={{
                  width:        '0',
                  height:       '0',
                  position:     'relative',
                  borderBottom: 'solid 50px transparent',
                  borderTop:    'solid 50px black',
                  borderLeft:   'solid 30px transparent',
                  borderRight:  'solid 30px transparent',
                  '&::before':  {
                    display:      'block',
                    bottom:       '-50px',
                    borderStyle:  'solid',
                    borderWidth:  '48px 48px 0 48px',
                    borderColor:  'white transparent transparent transparent',
                    content:      '""',
                    width:        '0',
                    height:       '0',
                    position:     'absolute',
                    borderBottom: 'solid 48px transparent',
                    borderTop:    'solid 48px white',
                    borderLeft:   'solid 24px transparent',
                    borderRight:  'solid 24px transparent',
                    top:          '-50px',
                    left:         '-24px',
                  },
                }}/>
              </Box>
              <Box id="wheel" sx={{
                border:       '2px solid black',
                borderRadius: '50%',
                position:     'relative',
                overflow:     'hidden',
                // center
                transform:    `translateX(${(width - Math.min(width, height)) / 2}px)`,
                width:        `${Math.min(width, height)}px`,
                height:       `${Math.min(width, height)}px`,
              }}>
                {generateItems(currentRandomizer!.items).map((item, idx) => <Box
                  data-type='segment'
                  className='segment'
                  data-value='item1'
                  style={{ background: `conic-gradient(${item.color} ${(360 / generateItems(currentRandomizer!.items).length) + 0.1}deg, transparent ${(360 / generateItems(currentRandomizer!.items).length)}deg calc(${(360 / generateItems(currentRandomizer!.items).length) + 0}deg))` }}
                  sx={{
                    position: 'absolute',
                    rotate:   `${idx * (360 / generateItems(currentRandomizer!.items).length)}deg`,
                    width:    `${Math.min(width, height) - 4}px !important`,
                    height:   `${Math.min(width, height) - 4}px !important`,
                  }}>
                  <Box sx={{
                    rotate:          `${180 / generateItems(currentRandomizer!.items).length}deg`,
                    transformOrigin: '50% 100%',
                    color:           'white',
                    textAlign:       'center',
                    height:          `${(Math.min(width, height) - 4) / 2}px`,
                    fontFamily:      `'${currentRandomizer.customizationFont.family}'`,
                    fontSize:        currentRandomizer.customizationFont.size + 'px',
                    fontWeight:      currentRandomizer.customizationFont.weight,
                    textShadow:      [
                      textStrokeGenerator(
                        currentRandomizer.customizationFont.borderPx,
                        currentRandomizer.customizationFont.borderColor,
                      ),
                      shadowGenerator(currentRandomizer.customizationFont.shadow)].filter(Boolean).join(', '),
                  }}>
                    <span style={{
                      writingMode:     'vertical-rl',
                      height:          `${Math.min(width, height) / 2}px`,
                      textOrientation: 'mixed',
                      transform:       'rotate(180deg)',
                      display:         'inline-block',
                      // backgroundColor: 'blue',
                      // clipPath:        'polygon(56% 0%, 150% 100%, -50% 100%)',
                      // clipPath:        `polygon(56% 0%, ${(Math.min(width, height) / generateItems(currentRandomizer!.items).length) * 2}px 100%, -50% 100%)`,
                    }}>
                      {item.name}
                    </span>
                  </Box>
                </Box>,
                )}
              </Box>
            </>}
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
