import { Backdrop, Box, capitalize, Checkbox, CircularProgress, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import axios from 'axios';
import React from 'react';
import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts';
import { useLocalstorageState, useWindowSize } from 'rooks';

import { stringToColour } from './commandcount';
import getAccessToken from '../../getAccessToken';

const avg = (data: number[]) => {
  return data.reduce((a, b) => (a + b)) / data.length;
};

const max = (data: number[]) => {
  return Math.max(...data);
};

const min = (data: number[]) => {
  return Math.min(...data);
};

const PageStatsProfiler = () => {
  const [ loading, setLoading ] = React.useState(true);
  const [ _data, setData ] = React.useState<{
    function: string, min: number, max: number, avg: number, samples: number, times: number[],
  }[]>([]);

  const [ showChartFunctions, setShowChartFunctions ] = useLocalstorageState<string[]>('/stats/commandcount/showChartFunctions', []);

  const { innerWidth } = useWindowSize();

  const data = React.useMemo(
    () =>  {
      const output: ({
        [command: string]: number,
      } & { name: string })[] = [];

      for (let sample = 0; sample <= 250; sample++) {
        const item: Record<string, any> = { name: `Sample #${sample}` };
        for (const fnc of showChartFunctions) {
          const value = _data.find(o => o.function === fnc)?.times[sample];
          if (value) {
            item[fnc] = value;
          }
        }
        output.push(item as any);
      }
      return output;
    }, [_data, showChartFunctions]);

  const refresh = React.useCallback(() => {
    axios.get('/api/stats/profiler', {
      headers: {
        Authorization: `Bearer ${getAccessToken()}`
      }
    }).then(({ data: axiosData }) => {
      const items: typeof _data = [];
      for (const item of axiosData.data) {
        items.push({
          function: item[0],
          min:      Number(min(item[1]).toFixed(4)),
          max:      Number(max(item[1]).toFixed(4)),
          avg:      Number(avg(item[1]).toFixed(4)),
          samples:  item[1].length,
          times:    item[1],
        });
      }
      setData(items);
      if (showChartFunctions.length === 0) {
        setShowChartFunctions(items.splice(0, 5).map(o => o.function));
      }
      setLoading(false);
    });
  }, [showChartFunctions]);

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
          <Typography component='div' >{o.value}ms</Typography>
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
      { showChartFunctions.map(command => <Line type="step" dataKey={command} strokeWidth={2} stroke={stringToColour(command)} dot={false} activeDot={{ r: 8 }} />)}
    </LineChart>

    {_data.length > 0
      ? <TableContainer component={Paper} sx={{ p: 2 }}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell align="left">{capitalize('function')}</TableCell>
              <TableCell align="right">{capitalize('samples')}</TableCell>
              <TableCell align="right">{capitalize('min time')}</TableCell>
              <TableCell align="right">{capitalize('max time')}</TableCell>
              <TableCell align="right">{capitalize('average time')}</TableCell>
              <TableCell align="right"></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {_data.map((row) => (
              <TableRow
                key={row.function}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell component="th" scope="row">
                  {row.function}
                </TableCell>
                <TableCell align="right">{row.samples}</TableCell>
                <TableCell align="right">{row.min}ms</TableCell>
                <TableCell align="right">{row.max}ms</TableCell>
                <TableCell align="right">{row.avg}ms</TableCell>
                <TableCell align="center">
                  <Checkbox checked={showChartFunctions.includes(row.function)} onChange={(_, checked) => {
                    setShowChartFunctions(o => checked ? [...o, row.function] : o.filter(cmd => cmd !== row.function));
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

export default PageStatsProfiler;
