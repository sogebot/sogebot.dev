import { IntegratedSorting, Sorting, SortingState } from '@devexpress/dx-react-grid';
import { Grid as DataGrid, Table, TableHeaderRow } from '@devexpress/dx-react-grid-material-ui';
import { HowLongToBeatGame } from '@entity/howLongToBeatGame';
import { Box, Button, Slider, Stack, Typography } from '@mui/material';
import React, { useCallback, useState } from 'react';
import SimpleBar from 'simplebar-react';

import { HOUR, MINUTE } from '../../../constants';
import { dayjs } from '../../../helpers/dayjsHelper';
import { timestampToObject } from '../../../helpers/getTime';
import { useAppDispatch } from '../../../hooks/useAppDispatch';
import { useColumnMaker } from '../../../hooks/useColumnMaker';
import { useTranslation } from '../../../hooks/useTranslation';
import { setOffset, setToggle } from '../../../store/hltbSlice';
import { DateTypeProvider } from '../DateTypeProvider';

type Props = {
  row: HowLongToBeatGame
};

export const RowDetail: React.FC<Props> = ({ row }) => {
  const { translate } = useTranslation();
  const dispatch = useAppDispatch();

  const timeToReadable = useCallback((data: { days: number; hours: number; minutes: number; seconds: number }) => {
    const output: string[] = [];
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

  const marks = [
    {
      value: 0,
      label: 'no offset',
    },
    {
      value: -1 * HOUR,
      label: '- 1 hour',
    },
    {
      value: HOUR,
      label: '1 hour',
    },
    {
      value: -2 * HOUR,
      label: '- 2 hours',
    },
    {
      value: 2 * HOUR,
      label: '2 hours',
    },
    {
      value: -3 * HOUR,
      label: '- 3 hours',
    },
    {
      value: 3 * HOUR,
      label: '3 hours',
    },
    {
      value: -4 * HOUR,
      label: '- 4 hours',
    },
    {
      value: 4 * HOUR,
      label: '4 hours',
    },
  ];

  const { columns, tableColumnExtensions } = useColumnMaker<HowLongToBeatGame['streams'][number] & { buttons: string }>([
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
          <Box sx={{
            padding: '0 0 0 30px', width: '100%',
          }}>
            <Slider
              value={_row.offset}
              min={-2 * HOUR}
              step={10 * MINUTE}
              max={2 * HOUR}
              scale={calculateValue}
              valueLabelFormat={valueLabelFormat}
              onChange={(_ev, newValue) => handleChange(_row.createdAt, newValue)}
              valueLabelDisplay="off"
              size='small'
              marks={marks}
            />
          </Box>
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
          <SimpleBar style={{ maxHeight: 'calc(50vh)' }} autoHide={false}>
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

              <Table columnExtensions={tableColumnExtensions}/>
              <TableHeaderRow/>
            </DataGrid>
          </SimpleBar>
        </Box>}
    </Box>
  </>
  );
};