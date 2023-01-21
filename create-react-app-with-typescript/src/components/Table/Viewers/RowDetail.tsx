import {
  Grid as DataGrid, Table, TableHeaderRow,
} from '@devexpress/dx-react-grid-material-ui';
import {
  Box, Button, LinearProgress, Typography,
} from '@mui/material';
import { EventListInterface } from '@sogebot/backend/dest/database/entity/eventList';
import React, {
  useEffect, useMemo, useState,
} from 'react';
import SimpleBar from 'simplebar-react';

import { dayjs } from '../../../helpers/dayjsHelper';
import { getSocket } from '../../../helpers/socket';
import { useColumnMaker } from '../../../hooks/useColumnMaker';
import { useTranslation } from '../../../hooks/useTranslation';

type Props = {
  row: any
};

enum filterType {
  all, tips, bits, sub,
}

export const RowDetail: React.FC<Props> = ({ row }) => {
  const [ loading, setLoading ] = useState(true);
  const [ history, setHistory ] = useState<EventListInterface[]>([]);
  const { translate } = useTranslation();

  const [ filter, setFilter ] = useState<filterType>(filterType.all);

  const { columns, tableColumnExtensions } = useColumnMaker<EventListInterface & { info: string }>([
    {
      columnName: 'timestamp',
      column:     {
        getCellValue: (_row) => {
          return (
            _row.timestamp && <span>{ dayjs(_row.timestamp).format('LL') } { dayjs(_row.timestamp).format('LTS') }</span>
          );
        },
      },
    },
    { columnName: 'event' }, {
      columnName:  'info',
      translation: ' ',
      column:      {
        getCellValue: (_row) => {
          return (
            (_row.event === 'raid' && <span>{ translate('managers.viewers.hostAndRaidViewersCount').replace('$value', JSON.parse(_row.values_json).viewers)}</span>)
            || (_row.event === 'subcommunitygift' && <span>{ _row.event } - { JSON.parse(_row.values_json).count }</span>)
            || (_row.event === 'subgift' && <span>{_row.userId === row.userId
              ? translate('managers.viewers.receivedSubscribeFrom').replace('$value', JSON.parse(_row.values_json).fromId)
              : translate('managers.viewers.giftedSubscribeTo').replace('$value', _row.userId)}</span>)
            || (_row.event === 'tip' && <span>{ JSON.parse(_row.values_json).amount } { JSON.parse(_row.values_json).currency }{JSON.parse(_row.values_json).message.length > 0 && <div>{ JSON.parse(_row.values_json).message }</div>}</span>)
            || (_row.event === 'cheer' && <span>{ JSON.parse(_row.values_json).bits } {JSON.parse(_row.values_json).message.length > 0 && <div>{ JSON.parse(_row.values_json).message }</div>}</span>)

          );
        },
      },
    },
  ]);

  const filteredHistory = useMemo(() => {
    return history.filter(o => {
      if (filter === filterType.all) {
        return true;
      }

      if (filter === filterType.bits) {
        return o.event === 'cheer';
      }

      if (filter === filterType.tips) {
        return o.event === 'tip';
      }

      if (filter === filterType.sub) {
        return o.event === 'subgift' || o.event === 'subcommunitygift' || o.event ==='sub' || o.event === 'resub';
      }
    });
  }, [filter, history]);

  useEffect(() => {
    getSocket('/overlays/eventlist').emit('eventlist::getUserEvents', row.userId, (err, events) => {
      if (err) {
        return console.error(err);
      }
      setHistory(events);
      setLoading(false);
    });
  }, [ row ]);

  return (<>
    <Box sx={{
      placeContent: 'center', display: 'flex',
    }}>
      {loading
        ? <LinearProgress  sx={{ width: '50%' }} />
        : <>
          { history.length === 0
            ? <Typography>No events recorded for user</Typography>
            : <Box  sx={{ width: '50%' }}>
              <Button onClick={() => setFilter(filterType.all)} variant={filter === filterType.all ? 'contained' : 'text'}>All</Button>
              <Button onClick={() => setFilter(filterType.bits)} variant={filter === filterType.bits ? 'contained' : 'text'}>Cheers</Button>
              <Button onClick={() => setFilter(filterType.tips)} variant={filter === filterType.tips ? 'contained' : 'text'}>Tips</Button>
              <Button onClick={() => setFilter(filterType.sub)} variant={filter === filterType.sub ? 'contained' : 'text'}>Subs / Resubs / Gifts</Button>
              <SimpleBar style={{ maxHeight: '300px' }} autoHide={false}>
                <DataGrid
                  rows={filteredHistory}
                  columns={columns}
                >
                  <Table columnExtensions={tableColumnExtensions}/>
                  <TableHeaderRow/>
                </DataGrid>
              </SimpleBar>
            </Box>}
        </>}
    </Box>
  </>
  );
};