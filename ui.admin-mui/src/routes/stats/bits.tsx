import { Backdrop, CircularProgress, FormControl, Link, MenuItem, Paper, Select, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { UserBitInterface } from '@sogebot/backend/dest/database/entity/user';
import axios from 'axios';
import capitalize from 'lodash/capitalize';
import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts';
import { useLocalstorageState, useWindowSize } from 'rooks';

import { dayjs } from '../../helpers/dayjsHelper';
import { useTranslation } from '../../hooks/useTranslation';

const PageStatsBits = () => {
  const [server] = useLocalstorageState('server', 'https://demobot.sogebot.xyz');
  const { translate } = useTranslation();

  const [ loading, setLoading ] = React.useState(true);
  const [ year, setYear ] = React.useState(new Date().getFullYear());
  const [ _data, setData ] = React.useState<Readonly<Required<UserBitInterface & {
    username: string;
  }>>[]>([]);

  const { innerWidth } = useWindowSize();

  const data = React.useMemo(
    () =>  {
      const output: any[] = [];
      const filteredByYear = _data.filter(o => {
        return new Date(o.cheeredAt).getFullYear() === year;
      });
      for (let month = 1; month <= 12; month++) {
        output.push({
          name: dayjs(`2022-${month}-01`).format('MMMM'),
          bits: filteredByYear
            .filter(o => new Date(o.cheeredAt).getMonth() === month - 1)
            .reduce((prev, current) => prev + current.amount, 0),
        });
      }
      return output;
    }, [_data, year]);

  const availableYears = React.useMemo(() => {
    if (loading) {
      return [new Date().getFullYear()];
    }
    const years = new Set(_data.map(o => {
      return new Date(o.cheeredAt).getFullYear();
    }));
    const uniqueYears = Array.from(years);
    let yearToAdd = new Date().getFullYear();
    while(!uniqueYears.includes(yearToAdd)) {
      uniqueYears.push(yearToAdd);
      yearToAdd--;
    }
    return uniqueYears.sort();
  }, [_data, loading]);

  const refresh = () => {
    axios.get('/api/stats/bits').then(({ data: axiosData }) => {
      setData(axiosData.data);
      setLoading(false);
    });
  };

  React.useEffect(() => {
    refresh();
  }, []);

  type tooltipProps = {
    active: boolean, payload: typeof data[number], label: string
  };
  const CustomTooltip: any = ({ active, payload, label }: tooltipProps) => {
    if (active && payload && payload.length) {
      return (<Paper sx={{ p: 2 }}>
        <Typography variant='button'>{label} {year}</Typography>
        <Typography variant='body2'>{payload[0].value} bits</Typography>
      </Paper>
      );
    }

    return null;
  };

  return <>
    <Backdrop open={loading}>
      <CircularProgress/>
    </Backdrop>

    <FormControl fullWidth variant="outlined">
      <Select
        value={year}
        onChange={(ev) => setYear(Number(ev.target.value ?? new Date().getFullYear()) )}
      >
        {availableYears.map(o => <MenuItem value={o} key={o}>{o}</MenuItem>)}
      </Select>
    </FormControl>

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
      <Line type="step" dataKey="bits" strokeWidth={2} stroke="#8884d8" dot={false} activeDot={{ r: 8 }} />
    </LineChart>

    {_data.filter(o => new Date(o.cheeredAt).getFullYear() === year).length > 0
      ? <TableContainer component={Paper} sx={{ p: 2 }}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell align="left">{capitalize(translate('date'))}</TableCell>
              <TableCell align="right">{capitalize(translate('responses.variable.amount'))}</TableCell>
              <TableCell align="left">{capitalize(translate('message'))}</TableCell>
              <TableCell align="left">{capitalize(translate('user'))}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {_data.filter(o => new Date(o.cheeredAt).getFullYear() === year).map((row) => (
              <TableRow
                key={row.id}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell component="th" scope="row">
                  {dayjs(row.cheeredAt).format('LLL')}
                </TableCell>
                <TableCell align="right">{row.amount}</TableCell>
                <TableCell align="left">{row.message}</TableCell>
                <TableCell align="left">
                  <Link component={RouterLink} to={`/manage/viewers/${row.userId}?server=${server}`}>{row.username}#{row.userId}</Link>
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
