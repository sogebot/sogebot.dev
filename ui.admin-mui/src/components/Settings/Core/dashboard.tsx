import {
  DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { SwapVertTwoTone } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Box,
  Button,
  Divider,
  Grid,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { blueGrey } from '@mui/material/colors';
import { useRouter } from 'next/router';
import {
  useCallback, useEffect, useMemo, useState,
} from 'react';
import { useSelector } from 'react-redux';
import { useRefElement } from 'rooks';
import { v4 } from 'uuid';

import { DashboardSortableItem } from '~/src/components/Sortable/DashboardSortableItem';
import { useSettings } from '~/src/hooks/useSettings';

const PageSettingsModulesCoreDashboard: React.FC<{
  onVisible: () => void,
}> = ({
  onVisible,
}) => {
  const router = useRouter();
  const { settings, setSettings, refresh, save, saving } = useSettings('/core/dashboard');

  useEffect(() => {
    refresh();
  }, [ router, refresh ]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: { active: any; over: any; }) {
    const { active, over } = event;

    if (!active || !over) {
      return;
    }
    if (active.id !== over.id) {
      setSettings((s) => {
        if (s) {
          const oldIndex = s.µWidgets[0].indexOf(active.id);
          const newIndex = s.µWidgets[0].indexOf(over.id);
          return {
            ...s,
            µWidgets: [
              arrayMove(s.µWidgets[0], oldIndex, newIndex),
              s.µWidgets[1],
            ],
          };
        } else {
          return s;
        }
      });
    }
    setActiveId(null);
  }
  const [activeId, setActiveId] = useState<null | string>(null);

  function handleDragStart(event: { active: any; }) {
    const { active } = event;
    setActiveId(active.id);
  }

  const availableµWidgetsFiltered = useMemo(() => {
    const availableµWidgets = [
      'twitch|status',
      'twitch|uptime',
      'twitch|viewers',
      'twitch|maxViewers',
      'twitch|newChatters',
      'twitch|chatMessages',
      'twitch|followers',
      'twitch|subscribers',
      'twitch|bits',
      'general|tips',
      'twitch|watchedTime',
      'general|currentSong',
    ];

    if (!settings) {
      return availableµWidgets;
    }

    return availableµWidgets.filter(o => {
      return settings.µWidgets[0].filter((p: string) => p.includes(o)).length === 0;
    });
  }, [settings ]);

  const [clickedId, setClickedId] = useState<null | string>(null);

  const swapItems = useCallback(() => {
    if (!clickedId) {
      return;
    }

    setSettings((s) => {
      if (s) {
        const newClickedId = availableµWidgetsFiltered.includes(clickedId)
          ? clickedId + `|${v4()}`
          : clickedId.split('|').filter((_, idx) => idx < 2).join('|');
        setClickedId(newClickedId);
        return {
          ...s,
          µWidgets: [
            availableµWidgetsFiltered.includes(clickedId)
              ? [...s.µWidgets[0], newClickedId]
              : s.µWidgets[0].filter((o: string) => !o.includes(newClickedId)),
            s.µWidgets[1],
          ],
        };
      } else {
        return s;
      }
    });
  }, [clickedId, availableµWidgetsFiltered, setSettings]);

  const [ref, element]  = useRefElement<HTMLElement>();
  const scrollY = useSelector<number, number>((state: any) => state.page.scrollY);
  useEffect(() => {
    if (element) {
      if (element.offsetTop < scrollY + 100 && element.offsetTop + element.clientHeight > scrollY - 100) {
        onVisible();
      }
    }
  }, [element, scrollY, onVisible]);

  return (<Box id="dashboard" ref={ref}>
    <Typography variant='h2' sx={{ pb: 2 }}>Dashboard</Typography>
    {settings && <Paper elevation={1} sx={{ p: 1 }}>
      <Divider><Typography variant='h5'>µWidgets</Typography></Divider>
      <Paper sx={{
        p: 2, m: 2, backgroundColor: blueGrey[900],
      }} variant='outlined'>
        <Divider><Typography variant='h6'>Used</Typography></Divider>
        <Grid container spacing={1} sx={{ pt: 2 }}>
          <DndContext
            sensors={sensors}
            onDragEnd={handleDragEnd}
            onDragStart={handleDragStart}
          >
            <SortableContext
              items={settings.µWidgets[0]}
              strategy={rectSortingStrategy}
            >
              {settings.µWidgets[0].map((item: string) => <DashboardSortableItem draggable onClick={() => setClickedId(clickedId === item ? null : item)} key={item} id={item} isClicked={item === clickedId} isDragging={item === activeId} />)}
            </SortableContext>
          </DndContext>
        </Grid>

        <Box textAlign={'center'} sx={{ p: 2 }}>
          <Button disabled={!clickedId} variant='contained' sx={{ minWidth: 300 }} onClick={swapItems}><SwapVertTwoTone/></Button>
        </Box>

        <Divider><Typography variant='h6'>Available</Typography></Divider>
        <Grid container spacing={1} sx={{ pt: 2 }}>
          {availableµWidgetsFiltered.map((item: string) => <DashboardSortableItem onClick={() => setClickedId(clickedId === item ? null : item)} key={item} id={item} isClicked={item === clickedId} isDragging={item === activeId} />)}
        </Grid>
      </Paper>
    </Paper>
    }

    <Stack direction='row' justifyContent='center' sx={{ pt: 2 }}>
      <LoadingButton sx={{ width: 300 }} variant='contained' loading={saving} onClick={save}>Save changes</LoadingButton>
    </Stack>
  </Box>
  );
};

export default PageSettingsModulesCoreDashboard;
