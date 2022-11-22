import {
  DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { LoadingButton } from '@mui/lab';
import {
  Backdrop,
  Box,
  CircularProgress,
  List,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { xor } from 'lodash';
import { useRouter } from 'next/router';
import {
  useCallback, useEffect, useMemo, useState,
} from 'react';
import { useSelector } from 'react-redux';
import { useRefElement } from 'rooks';

import { SortableListItem } from '~/src/components/Sortable/SortableListItem';
import { useSettings } from '~/src/hooks/useSettings';
import { useTranslation } from '~/src/hooks/useTranslation';

const PageSettingsModulesSystemsUserinfo: React.FC<{
  onVisible: () => void,
}> = ({
  onVisible,
}) => {
  const validator = useMemo(() => ({
    'customization.lastSeenFormat': [
      (value: string) => String(value).length > 0 || 'isNotEmpty',
    ],
    'me.formatSeparator': [
      (value: string) => String(value).length > 0 || 'isNotEmpty',
    ],
  }), []);

  const router = useRouter();
  const { translate } = useTranslation();

  const { settings, loading, refresh, save, saving, errors, TextFieldProps, handleChange } = useSettings('/systems/userinfo' as any, validator);

  useEffect(() => {
    refresh();
  }, [ router, refresh ]);

  const [ref, element]  = useRefElement<HTMLElement>();
  const scrollY = useSelector<number, number>((state: any) => state.page.scrollY);
  useEffect(() => {
    if (element) {
      if (element.offsetTop < scrollY + 100 && element.offsetTop + element.clientHeight > scrollY - 100) {
        onVisible();
      }
    }
  }, [element, scrollY, onVisible]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: { active: any; over: any; }) {
    const { active, over } = event;

    if (!active || !over || !settings) {
      return;
    }
    if (active.id !== over.id) {
      const oldIndex = settings.me.order[0].indexOf(active.id);
      const newIndex = settings.me.order[0].indexOf(over.id);
      handleChange('me.order', arrayMove(settings.me.order[0], oldIndex, newIndex));
    }
    setActiveId(null);
  }
  const [activeId, setActiveId] = useState<null | string>(null);

  function handleDragStart(event: { active: any; }) {
    const { active } = event;
    setActiveId(active.id);
  }

  const toggleVisibility = useCallback((item: string) => {
    if (settings) {
      handleChange('me._formatDisabled', xor(settings.me._formatDisabled[0], [item]));
    }
  }, [settings, handleChange]);

  return (<Box ref={ref} id="userinfo">
    <Typography variant='h2' sx={{ pb: 2 }}>{ translate('menu.userinfo') }</Typography>
    {settings && <Paper elevation={1} sx={{ p: 1 }}>
      <Stack spacing={1}>
        <TextField
          {...TextFieldProps('customization.lastSeenFormat', { helperText: translate('systems.userinfo.settings.lastSeenFormat.help') })}
          label={translate(`systems.userinfo.settings.lastSeenFormat.title`)}
        />
        <TextField
          {...TextFieldProps('me.formatSeparator')}
          label={translate(`systems.userinfo.settings.formatSeparator`)}
        />

        <List dense>
          <DndContext
            sensors={sensors}
            onDragEnd={handleDragEnd}
            onDragStart={handleDragStart}
          >
            <SortableContext
              items={settings.me.order[0]}
              strategy={horizontalListSortingStrategy}
            >
              {settings.me.order[0].map((item: string) => <SortableListItem
                draggable
                key={item}
                id={item}
                visible={!settings.me._formatDisabled[0].includes(item)}
                onVisibilityChange={() => toggleVisibility(item)}
                isDragging={item === activeId} />)}
            </SortableContext>
          </DndContext>
        </List>
      </Stack>
    </Paper>}

    <Stack direction='row' justifyContent='center' sx={{ pt: 2 }}>
      <LoadingButton sx={{ width: 300 }} variant='contained' loading={saving} onClick={save} disabled={errors.length > 0}>Save changes</LoadingButton>
    </Stack>

    <Backdrop open={loading} >
      <CircularProgress color="inherit"/>
    </Backdrop>
  </Box>
  );
};

export default PageSettingsModulesSystemsUserinfo;
