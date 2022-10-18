import {
  IntegratedSorting, Sorting, SortingState,
} from '@devexpress/dx-react-grid';
import {
  Grid as DataGrid, TableHeaderRow, VirtualTable,
} from '@devexpress/dx-react-grid-material-ui';
import {
  Box, Button, Slider, Stack, Typography,
} from '@mui/material';
import { HowLongToBeatGame } from '@sogebot/backend/dest/database/entity/howLongToBeatGame';
import { HOUR, MINUTE } from '@sogebot/ui-helpers/constants';
import { timestampToObject } from '@sogebot/ui-helpers/getTime';
import { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';

import { DateTypeProvider } from '~/src/components/Table/DateTypeProvider';
import { dayjs } from '~/src/helpers/dayjsHelper';
import { useColumnMaker } from '~/src/hooks/useColumnMaker';
import { useTranslation } from '~/src/hooks/useTranslation';
import { setOffset, setToggle } from '~/src/store/hltbSlice';

type Props = {
  row: HowLongToBeatGame
};

export const RowDetail: React.FC<Props> = ({ row }) => {
  const { translate } = useTranslation();
  const dispatch = useDispatch();

  const timeToReadable = useCallback((data: { days: number; hours: number; minutes: number; seconds: number}) => {
    const output = [];
    if (data.days) {
      output.push(`${data.days}d`);
    }
    if (data.hours) {
      output.push(`${data.hours}h`);
    }
    if (data.minutes) {
      output.push(`${data.minutes}m`);
    }
    if (data.seconds || output.length === 0) {
      output.push(`${data.seconds}s`);
    }
    return output.join(' ');
  }, []);

  const [sorting, setSorting] = useState<Sorting[]>([{
    columnName: 'createdAt', direction: 'desc',
  }]);

  const toggleCounted = useCallback((createdAt: string, type: 'main' | 'extra' | 'completionist') => {
    dispatch(setToggle({
      id: row.id,
      createdAt,
      type,
    }));
  }, [row, dispatch]);

  function calculateValue(value: number) {
    return 2 ** value;
  }

  function valueLabelFormat(value: number) {
    return (value > 0 ? ' +' : '') + dayjs.duration(value).format('H[h] m[m]').replace('0h', '').replace('-', '- ');
  }

  const handleChange = useCallback((createdAt: string, value: number | number[]) => {
    if (typeof value === 'number') {
      dispatch(setOffset({
        id: row.id,
        createdAt,
        value,
      }));
    }
  }, [dispatch, row]);

  const { columns, tableColumnExtensions } = useColumnMaker([
    {
      columnName:  'createdAt',
      translation: 'Created At',
      table:       {
        align: 'right', width: '250px',
      },
    }, {
      columnName: 'timestamp',
      table:      {
        align: 'right', width: '250px',
      },
      column: { getCellValue: (_row) => <Typography>{timeToReadable(timestampToObject(_row.timestamp))}</Typography> },
    }, {
      columnName: 'buttons',
      table:      {
        align: 'right', width: '450px',
      },
      translation: ' ',
      column:      {
        getCellValue: (_row) => <Stack direction={'row'} spacing={1}>
          <Button size="small" variant="contained" color={_row.isMainCounted ? 'success' : 'dark'} onClick={() => toggleCounted(_row.createdAt, 'main')}>
            { translate('systems.howlongtobeat.main') }
          </Button>
          <Button size="small" variant="contained" color={_row.isExtraCounted ? 'success' : 'dark'} onClick={() => toggleCounted(_row.createdAt, 'extra')}>
            { translate('systems.howlongtobeat.extra') }
          </Button>
          <Button size="small" variant="contained" color={_row.isCompletionistCounted ? 'success' : 'dark'} onClick={() => toggleCounted(_row.createdAt, 'completionist')}>
            { translate('systems.howlongtobeat.completionist') }
          </Button>
        </Stack>,
      },
    }, {
      columnName: 'offset',
      table:      {
        align: 'right', width: '350px',
      },
      translation: ' ',
      column:      {
        getCellValue: (_row) => <Stack direction={'row'} spacing={2}>
          <Slider
            value={_row.offset}
            min={-HOUR}
            step={MINUTE}
            max={HOUR}
            scale={calculateValue}
            valueLabelFormat={valueLabelFormat}
            onChange={(_ev, newValue) => handleChange(_row.createdAt, newValue)}
            valueLabelDisplay="off"
            size='small'
          />
          <Typography sx={{ minWidth: '50px' }}>{valueLabelFormat(_row.offset)}</Typography>
        </Stack>,
      },
    },
  ]);

  return (<>
    <Box sx={{
      placeContent: 'center', display: 'flex',
    }}>
      { row.streams.length === 0
        ? <Typography>No streams recorded for user</Typography>
        : <Box sx={{ width: 'calc(250px + 250px + 450px + 350px + 50px)' }}>
          <DataGrid
            rows={row.streams}
            columns={columns}
          >
            <DateTypeProvider for={['createdAt']}/>

            <SortingState
              sorting={sorting}
              onSortingChange={setSorting}
            />
            <IntegratedSorting />

            <VirtualTable columnExtensions={tableColumnExtensions}/>
            <TableHeaderRow/>
          </DataGrid>
        </Box>}
    </Box>
  </>
  );
};