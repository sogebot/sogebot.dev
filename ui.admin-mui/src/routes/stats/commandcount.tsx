import { CommandsCount } from '@entity/commands';
import { Backdrop, Box, capitalize, Checkbox, CircularProgress, Paper, Slider, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import axios from 'axios';
import { countBy } from 'lodash';
import React from 'react';
import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts';
import { useLocalstorageState, useWindowSize } from 'rooks';

import { DAY } from '../../constants';
import getAccessToken from '../../getAccessToken';
import { dayjs } from '../../helpers/dayjsHelper';
import { useTranslation } from '../../hooks/useTranslation';

function shadeColor(color: string, percent: number) {
  // https://stackoverflow.com/a/13532993
  let R = parseInt(color.substring(1,3),16);
  let G = parseInt(color.substring(3,5),16);
  let B = parseInt(color.substring(5,7),16);

  R = Math.floor(R * (100 + percent) / 100);
  G = Math.floor(G * (100 + percent) / 100);
  B = Math.floor(B * (100 + percent) / 100);

  R = (R<255)?R:255;
  G = (G<255)?G:255;
  B = (B<255)?B:255;

  R = Math.round(R);
  G = Math.round(G);
  B = Math.round(B);

  const RR = ((R.toString(16).length==1)?'0'+R.toString(16):R.toString(16));
  const GG = ((G.toString(16).length==1)?'0'+G.toString(16):G.toString(16));
  const BB = ((B.toString(16).length==1)?'0'+B.toString(16):B.toString(16));

  return '#'+RR+GG+BB;
}

export const stringToColour = (str: string) => {
  let hash = 0;
  str.split('').forEach(char => {
    hash = char.charCodeAt(0) + ((hash << 5) - hash);
  });
  let colour = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    colour += value.toString(16).padStart(2, '0');
  }
  return shadeColor(colour, 70);
};

const marks = [
  {
    value: 1,
    label: 'A day',
  },
  {
    value: 2,
    label: 'A week',
  },
  {
    value: 3,
    label: '2 weeks',
  },
  {
    value: 4,
    label: 'A month',
  },
  {
    value: 5,
    label: '3 months',
  },
  {
    value: 6,
    label: '6 months',
  },
  {
    value: 7,
    label: 'An year',
  },
  {
    value: 8,
    label: 'Unlimited',
  },
];
function valueLabelFormat(value: number) {
  return marks[marks.findIndex((mark) => mark.value === value)].label;
}

const totalInInterval = (command: string, interval: number, values: CommandsCount[]): number => {
  return values.filter((o) => {
    const isCorrectCommand = o.command === command;
    const isInInterval = Date.now() - interval <= new Date(o.timestamp).getTime();
    return isCorrectCommand && isInInterval;
  }).length;
};
const total = (command: string, values: CommandsCount[]): number => {
  return values.filter(o => o.command === command).length;
};

const PageStatsBits = () => {
  const { translate } = useTranslation();

  const [ loading, setLoading ] = React.useState(true);
  const [ interval, setInterval ] = React.useState(1000);
  const [ _data, setData ] = React.useState<CommandsCount[]>([]);

  const [ showChartCommands, setShowChartCommands ] = useLocalstorageState<string[]>('/stats/commandcount/showChartCommands', []);

  const { innerWidth } = useWindowSize();

  const tableData = React.useMemo(() => {
    const items: {
      command: string,
      hour:    number,
      day:     number,
      week:    number,
      month:   number,
      year:    number,
      total:   number,
    }[] = [];
    for (const command of _data.map(o => o.command)) {
      if (items.find(o => o.command === command)) {
        continue;
      }
      items.push({
        command,
        hour:  totalInInterval(command, 1000 * 60 * 60, _data),
        day:   totalInInterval(command, 1000 * 60 * 60 * 24, _data),
        week:  totalInInterval(command, 1000 * 60 * 60 * 24 * 7, _data),
        month: totalInInterval(command, 1000 * 60 * 60 * 24 * 30, _data),
        year:  totalInInterval(command, 1000 * 60 * 60 * 24 * 365, _data),
        total: total(command, _data),
      });
    }
    return items;
  }, [ _data ]);

  const from = React.useMemo(() => {
    // oldest timestamp
    const oldestTimestamp = Math.min(..._data.map(o => new Date(o.timestamp).getTime()));
    switch (interval) {
      case 7:
        return Math.max(oldestTimestamp, dayjs().subtract(1, 'year').valueOf());
      case 6:
        return Math.max(oldestTimestamp, dayjs().subtract(6, 'month').valueOf());
      case 5:
        return Math.max(oldestTimestamp, dayjs().subtract(3, 'month').valueOf());
      case 4:
        return Math.max(oldestTimestamp, dayjs().subtract(1, 'month').valueOf());
      case 3:
        return Math.max(oldestTimestamp, dayjs().subtract(2, 'week').valueOf());
      case 2:
        return Math.max(oldestTimestamp, dayjs().subtract(1, 'week').valueOf());
      case 1:
        return Math.max(oldestTimestamp, dayjs().subtract(1, 'day').valueOf());
      default:
        return Math.max(oldestTimestamp, 0);
    }
  }, [ _data, interval ]);

  const timestampSmooth = React.useMemo((): number => {
    switch (interval) {
      case 7:
        return DAY * 15;
      case 6:
        return DAY * 7;
      case 5:
        return DAY * 3;
      case 4:
        return DAY;
      case 3:
        return DAY / 2;
      case 2:
        return DAY / 3;
      case 1:
        return DAY / 24;
      default:
        return DAY * 31;
    }
  }, [ from, interval ]);

  const timestampList = React.useMemo((): number[] => {
    const to = Date.now();
    const list: number[] = [];
    for (
      let timestamp = (from / (timestampSmooth) * (timestampSmooth));
      timestamp <= (to / (timestampSmooth) * (timestampSmooth));
      timestamp = timestamp + (timestampSmooth)) {
      list.push(timestamp);
    }
    return list;
  }, [ _data, timestampSmooth, from ]);

  const data = React.useMemo(
    () =>  {
      const output: ({
        [command: string]: number,
      } & { name: string })[] = [];
      const usedCommand: string[] = [];
      const to = Date.now();
      for (const command of showChartCommands) {
        const timestamps = _data
          .filter((o) => {
            const isCommand = o.command === command;
            const isHigherThanFromDate = new Date(o.timestamp).getTime() >= from;
            const isLowerThanToDate = new Date(o.timestamp).getTime() <= to;
            return isCommand && isHigherThanFromDate && isLowerThanToDate;
          })
          .map((o) => {
            // find smooth timestamp
            let timestamp = from;
            while (timestamp <= new Date(o.timestamp).getTime()) {
              timestamp += timestampSmooth;
            }
            if (timestamp > to) {
              timestamp = to;
            }
            return timestamp;
          });
        const countByTimestamps = countBy(timestamps);
        for (const t of timestampList) {
          if (!countByTimestamps[t]) {
            countByTimestamps[t] = 0;
          }
        }
        const countByTimestampsOrdered: any = {};
        for (const k of Object.keys(countByTimestamps).sort()) {
          countByTimestampsOrdered[new Date(Number(k)).toLocaleString()] = countByTimestamps[k];
        }

        for (const [timestamp, value] of Object.entries(countByTimestampsOrdered)) {
          const item = output.find(o => o.name === timestamp);
          if (!item) {
            output.push({
              [command]: value as number,
              name:      timestamp,
            } as any);
          } else {
            item[command] = countByTimestampsOrdered[timestamp];
          }
        }
        usedCommand.push(command);

      }

      for (const item of output) {
        for (const _command of usedCommand) {
          item[_command] = item[_command] ?? 0;
        }
      }
      return output;
    }, [_data, showChartCommands, interval, timestampList, timestampSmooth]);

  const refresh = React.useCallback(() => {
    axios.get('/api/stats/commandcount', {
      headers: {
        Authorization: `Bearer ${getAccessToken()}`
      }
    }).then(({ data: axiosData }) => {
      const val = axiosData.data;
      setData(val);
      if (showChartCommands.length === 0) {
        setShowChartCommands(val.splice(0, 5).map((o: any) => o.command));
      }
      setLoading(false);
    });
  }, [showChartCommands]);

  React.useEffect(() => {
    refresh();
  }, []);

  type tooltipProps = {
    active: boolean, payload: typeof data[number], label: string
  };
  const CustomTooltip: any = ({ active, payload, label }: tooltipProps) => {
    if (active && payload && payload.length) {
      return (<Paper sx={{ p: 2 }}>
        <Typography variant='button'>{label}</Typography>
        {(payload as any).map((o: any) => <Typography variant='body2' key={o.dataKey} sx={{ display: 'flex' }}>
          <Box sx={{
            bgcolor: o.stroke, width: 20, height: 20,
          }}></Box>
          &nbsp;
          <Typography component='div' sx={{ fontWeight: 'bold' }}>{o.dataKey}</Typography>
          &nbsp;
          <Typography component='div' >{o.value}</Typography>
        </Typography>)}
      </Paper>
      );
    }

    return null;
  };

  return <>
    <Backdrop open={loading}>
      <CircularProgress/>
    </Backdrop>

    <LineChart
      width={(innerWidth ?? 0) - 80}
      height={300}
      data={data}
      margin={{
        top:    20,
        left:   -30,
        bottom: 5,
      }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip content={<CustomTooltip />} />
      { showChartCommands.map(command => <Line type="step" dataKey={command} strokeWidth={2} stroke={stringToColour(command)} dot={false} activeDot={{ r: 8 }} />)}
    </LineChart>

    <Box sx={{
      width: `${(innerWidth ?? 0) - 80}px`, px: 5,
    }}>
      <Slider
        valueLabelFormat={valueLabelFormat}
        getAriaValueText={valueLabelFormat}
        step={null}
        valueLabelDisplay="off"
        marks={marks}
        value={interval}
        min={1}
        max={8}
        onChange={(_, value) => setInterval(Array.isArray(value) ? value[0] : value)}
      />
    </Box>

    {tableData.length > 0
      ? <TableContainer component={Paper} sx={{ p: 2 }}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell align="left">{capitalize(translate('command'))}</TableCell>
              <TableCell align="center">{capitalize(translate('stats.commandcount.hour'))}</TableCell>
              <TableCell align="center">{capitalize(translate('stats.commandcount.day'))}</TableCell>
              <TableCell align="center">{capitalize(translate('stats.commandcount.week'))}</TableCell>
              <TableCell align="center">{capitalize(translate('stats.commandcount.month'))}</TableCell>
              <TableCell align="center">{capitalize(translate('stats.commandcount.year'))}</TableCell>
              <TableCell align="center">{capitalize(translate('stats.commandcount.total'))}</TableCell>
              <TableCell align="right"></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tableData.map((row) => (
              <TableRow
                key={row.command}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell component="th" scope="row">
                  {row.command}
                </TableCell>
                <TableCell align="center">{row.hour}</TableCell>
                <TableCell align="center">{row.day}</TableCell>
                <TableCell align="center">{row.week}</TableCell>
                <TableCell align="center">{row.month}</TableCell>
                <TableCell align="center">{row.year}</TableCell>
                <TableCell align="center">{row.total}</TableCell>
                <TableCell align="center">
                  <Checkbox checked={showChartCommands.includes(row.command)} onChange={(_, checked) => {
                    setShowChartCommands(o => checked ? [...o, row.command] : o.filter(cmd => cmd !== row.command));
                  }}/>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      : <Typography sx={{ textAlign: 'center' }}>No items found</Typography>}
  </>;
};

export default PageStatsBits;
