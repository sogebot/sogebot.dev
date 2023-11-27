import Box from '@mui/material/Box';
import { Credits, CreditsScreenCustom } from '@sogebot/backend/dest/database/entity/overlay';
import gsap from 'gsap';
import React from 'react';
import { useIntervalWhen } from 'rooks';

import { Props } from './ChatItem';
import { CreditsClips } from './CreditsClips';
import { CreditsCustomItem } from './CreditsCustomItem';
import { CreditsEvents } from './CreditsEvents';

const speed = {
  'very slow': 50,
  'slow':      25,
  'medium':    15,
  'fast':      5,
  'very fast': 2,
} as const;

const prevCumulativeHeight = new Map<string, number>();
const currentScreenIdx = new Map<string, number>();
const waitingForClipsToFinish = new Map<string, boolean>();

export const CreditsItem: React.FC<Props<Credits>> = ({ item, width, height }) => {
  const [ isRolling, setIsRolling ] = React.useState(false);
  const [ screensHeight, setScreensHeight ] = React.useState<number[]>([]);
  const [ id ] = React.useState(crypto.randomUUID());
  const [ clipsScreenId, setClipScreenId ] = React.useState('');

  const [ screensLoaded, setScreensLoaded ] = React.useState(0);

  const areAllScreensLoaded = screensLoaded
    === item.screens.filter(o => o.type !== 'custom').length + item.screens.filter(o => o.type === 'custom').reduce((prev, cur) => prev + (cur as CreditsScreenCustom).items.length, 0);
  const screensHeightAvailable = React.useMemo(() => screensHeight.length === item.screens.length, [ screensHeight, item.screens ]);

  const handleScreenLoaded = () => {
    setScreensLoaded(o => o + 1);
  };

  React.useEffect(() => {
    if (areAllScreensLoaded && screensHeightAvailable) {
      // init roll if everything is loaded
      roll();
    }
  }, [ screensHeightAvailable ]);

  const roll = () => {
    if ((currentScreenIdx.get(id) ?? 0) === item.screens.length) {
      console.log('credits::overlay', 'Rolling finished !!!');
      return;
    }

    if (!isRolling) {
      const el = document.getElementById(`screen-${currentScreenIdx.get(id) ?? 0}`);
      const container = document.getElementById(`container-${id}`);
      if (!el || !container) {
        console.log('Element', el, 'or container', container, 'not available.');
        setTimeout(() => roll(), 10);
        return;
      }

      const rect = el.getBoundingClientRect();
      const bottomPosition = rect.bottom;

      console.log('credits::overlay', currentScreenIdx.get(id) ?? 0, bottomPosition, el);
      if (bottomPosition <= height) {
        console.log('credits::overlay', 'Screen is visible and bottom is visible, moving to check another screen');
        // check if we need to wait
        const waitBetweenScreens = item.screens[currentScreenIdx.get(id) ?? 0].waitBetweenScreens ?? item.waitBetweenScreens;
        console.log('credits::overlay', `Waiting for ${waitBetweenScreens}ms.`);
        setIsRolling(true);
        setTimeout(() => {
          currentScreenIdx.set(id, (currentScreenIdx.get(id) ?? 0) + 1);
          setIsRolling(false);
          roll();
        }, waitBetweenScreens);
      } else {
        let cumulativeHeight = 0;
        for (let i = 0; i <= (currentScreenIdx.get(id) ?? 0); i++) {
          cumulativeHeight += screensHeight[i];
        }

        // check if it is last item, then just go to bottom and not all the way top (this can be done by empty custom item)
        if (currentScreenIdx.get(id) ?? 0 === item.screens.length - 1) {
          console.log('credits::overlay', 'Screen is last item, rolling only to bottom');
          cumulativeHeight = cumulativeHeight - height;
        }

        setIsRolling(true);
        const duration = (cumulativeHeight - (prevCumulativeHeight.get(id) ?? 0)) * speed[item.screens[currentScreenIdx.get(id) ?? 0].speed ?? item.speed];
        prevCumulativeHeight.set(id, cumulativeHeight);
        if (isNaN(cumulativeHeight)) {
          setIsRolling(false);
          console.log('credits::overlay', 'Something went wrong with calculation', {
            cumulativeHeight, prevCumulativeHeight: prevCumulativeHeight.get(id),
          });
        }
        console.log('credits::overlay', 'Screen is not rolled, moving to new pos', -cumulativeHeight, 'with duration', duration/1000, 'ms', el);
        gsap.to(container, {
          ease:       'none',
          y:          `${-cumulativeHeight}px`,
          duration:   duration / 1000,
          onComplete: () => {
            const checkIfComplete = () => {
              // we need to wait until clips are finished
              if (waitingForClipsToFinish.get(`${id}-${item.screens[(currentScreenIdx.get(id) ?? 0)].id}`)) {
                setTimeout(() => setClipScreenId(item.screens[(currentScreenIdx.get(id) ?? 0)].id), 1000);
                console.log('credits::overlay', 'Waiting for clips to finish !!!');
                setTimeout(() => checkIfComplete(), 1000);
                return;
              }
              // check if we need to wait
              const waitBetweenScreens = item.screens[currentScreenIdx.get(id) ?? 0].waitBetweenScreens ?? item.waitBetweenScreens;
              console.log('credits::overlay', `Waiting for ${waitBetweenScreens}ms.`);
              setTimeout(() => {
                setIsRolling(false);
                roll();
              }, waitBetweenScreens);
            };
            checkIfComplete();
          },
        });
      }
    } else {
      setTimeout(() => roll(), 10);
    }
  };

  useIntervalWhen(() => {
    if (areAllScreensLoaded) {
      const heights = item.screens.map((_, idx) => {
        const el = document.getElementById(`screen-${idx}`);
        console.log('credits::overlay', `screen-${idx}`, el?.offsetHeight);
        return el?.offsetHeight;
      });
      if (!heights.find(it => it === undefined)) {
        setScreensHeight(heights as number[]);
      }
    }
  }, 100, screensHeight.length === 0);

  return <Box  sx={{
    width:      `${width}px`,
    height:     `${height}px`,
    overflow:   'hidden',
    // setting opacity to 0 if we are waiting for all data
    opacity:    screensHeight.length === 0 ? 0 : 1,
    transition: 'opacity 0.3s',
  }}>
    <Box id={`container-${id}`} sx={{
      width: '100%', height: '100%',
    }}>
      { item.screens.map((screen, idx) => <Box id={`screen-${idx}`} key={`screen-${idx}`}>
        {screen.type === 'custom' && <Box sx={{
          width: `${width}px`, height: `${screen.height}px`, position: 'relative',
        }}>
          {screen.items.map(it => <Box key={it.id} sx={{
            position:        'absolute',
            width:           `${it.width}px`,
            height:          `${it.height}px`,
            backgroundColor: `transparent`,
            border:          `0 !important`,
            left:            `${it.alignX}px`,
            top:             `${it.alignY}px`,
            transform:       `rotate(${ it.rotation ?? 0 }deg)`,
          }}>
            {/* We need to set absolute position with Box */}
            <CreditsCustomItem groupId='' height={it.height} width={it.width} id={it.id} item={it} active onLoaded={handleScreenLoaded}/>
          </Box>)}
        </Box>}

        {screen.type === 'events' && <Box sx={{
          width: `${width}px`, height: `fit-content`, position: 'relative',
        }}>
          <CreditsEvents height={0} width={width} item={screen} groupId={''} id={screen.id} active onLoaded={handleScreenLoaded}/>
        </Box>}

        {screen.type === 'clips' && <Box sx={{
          width: `${width}px`, height: `fit-content`, position: 'relative',
        }}>
          <CreditsClips
            play={screen.id === clipsScreenId}
            height={height}
            width={width}
            item={screen}
            groupId={''}
            id={screen.id}
            active
            onLoaded={(shouldWait) => {
              waitingForClipsToFinish.set(`${id}-${screen.id}`, shouldWait);
              handleScreenLoaded();
            }} onFinished={() => {
              waitingForClipsToFinish.delete(`${id}-${screen.id}`);
            }}/>
        </Box>}
      </Box>)}
    </Box>
  </Box>;
};
