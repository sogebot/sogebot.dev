import { Filter } from '@devexpress/dx-react-grid';
import { Add } from '@mui/icons-material';
import {
  Box, Button, Chip, FormControl, FormControlLabel, FormLabel, Input, MenuItem, Popover, Radio, RadioGroup, Select,
} from '@mui/material';
import { Stack } from '@mui/system';
import { capitalize } from 'lodash';
import PopupState, { bindPopover, bindTrigger } from 'material-ui-popup-state';
import React from 'react';

import { usePermissions } from '~/src/hooks/usePermissions';
import { useTranslation } from '~/src/hooks/useTranslation';

export const useFilter = <T,>(availableFilters: {
  columnName: keyof T;
  translation: string;
  type: 'string' | 'number' | 'boolean' | 'permission' | 'list';
  valueRender?: (value: string) => string;
  options?: {
    showDisabled?: boolean,
    disabledName?: string,
    disabledValue?: string,
    listValues?: string[],
  }
}[]) => {
  const { translate } = useTranslation();
  const { permissions } = usePermissions();

  const [ filters, setFilters ] = React.useState<Filter[]>([]);
  const [ newFilter, setNewFilter ] = React.useState<Filter>();

  const initializeDefaultFilter = React.useCallback((filter: typeof availableFilters[number]) => {
    if (filter.type === 'boolean') {
      setNewFilter({
        columnName: filter.columnName as string,
        operation:  'equal',
        value:      true,
      });
    }
    if (filter.type === 'number') {
      setNewFilter({
        columnName: filter.columnName as string,
        operation:  'equal',
        value:      0,
      });
    }
    if (filter.type === 'string') {
      setNewFilter({
        columnName: filter.columnName as string,
        operation:  'contains',
        value:      '',
      });
    }
    if (filter.type === 'permission') {
      setNewFilter({
        columnName: filter.columnName as string,
        operation:  'includes',
        value:      [],
      });
    }
    if (filter.type === 'list') {
      setNewFilter({
        columnName: filter.columnName as string,
        operation:  'includes',
        value:      [],
      });
    }
  }, []);

  React.useEffect(() => {
    console.log({ newFilter });
  }, [ newFilter ]);

  const handleBooleanChange = (columnName: string, event: React.ChangeEvent) => {
    setNewFilter({
      columnName: columnName as string,
      operation:  'equal',
      value:      (event.target as HTMLInputElement).value === 'true',
    });
  };

  const handleTypeChange = React.useCallback((event: React.ChangeEvent) => {
    if (newFilter) {
      setNewFilter({
        ...newFilter,
        operation: (event.target as HTMLInputElement).value,
      });
    }
  }, [ newFilter ]);

  const handleNumberChange = React.useCallback((event: React.ChangeEvent) => {
    if (newFilter) {
      setNewFilter({
        ...newFilter,
        value: Number((event.target as HTMLInputElement).value),
      });
    }
  }, [ newFilter ]);

  const handleStringChange = React.useCallback((event: React.ChangeEvent) => {
    if (newFilter) {
      setNewFilter({
        ...newFilter,
        value: (event.target as HTMLInputElement).value,
      });
    }
  }, [ newFilter ]);

  const handleListChange = React.useCallback((value: null | string[] | string) => {
    if (newFilter) {
      setNewFilter({
        ...newFilter,
        value: value,
      });
    }
  }, [ newFilter ]);

  const applyFilter = React.useCallback((popups: any[]) => {
    if (newFilter) {
      if ((Array.isArray(newFilter.value) && newFilter.value.length > 0) || String(newFilter.value).length > 0) {
        setFilters([
          ...filters,
          newFilter,
        ]);
      }
    }

    setTimeout(() => {
      for (const popup of popups) {
        popup.close();
      }
    }, 10);
  }, [ newFilter, filters ]);

  const handleDelete = React.useCallback((idx: number) => {
    console.log('Deleting filter ', idx);
    setFilters(filters.filter((_, i) => i !== idx));
  }, [ filters ]);

  const handleDeleteAll = React.useCallback(() => {
    console.log('Deleting all filters');
    setFilters([]);
  }, [ ]);

  const getValueOfColumnName = React.useCallback((columnName: string, value: string | string[]) => {
    const defaultRender: (v: string) => string = (v) => v;

    const current = availableFilters.find(o => o.columnName === columnName)!;
    if (!Array.isArray(value)) {
      return (current.valueRender || defaultRender)(String(current.options?.disabledValue === value ? current.options?.disabledValue : value));
    }

    const out: string[] = [];
    for (const val of value) {
      if (val === current.options?.disabledValue || val === '_disabled') {
        out.push(current.options?.disabledName || 'Disabled');
      } else {
        out.push((current.valueRender || defaultRender)(val));
      }
    }
    return out.join(', ');
  }, [ availableFilters ]);

  const getTranslationOfColumnName = React.useCallback((columnName: string) => {
    const current = availableFilters.find(o => o.columnName === columnName)!;
    return current.translation;
  }, [ availableFilters ]);

  const element = React.useMemo(() => {
    return <>
      { filters.map((filter, idx) => <Chip key={idx} label={
        <>
          <strong>{getTranslationOfColumnName(filter.columnName)}</strong>
          &nbsp;{ translate('registry.alerts.filter.' + filter.operation) }&nbsp;
          <strong>{getValueOfColumnName(filter.columnName, filter.value)}</strong>
        </>
      } onDelete={() => handleDelete(idx)} />)}
      { filters.length > 0 &&<Button variant='text' color="error" onClick={() => handleDeleteAll()}>Clear all</Button> }
      <PopupState variant="popover" popupId="demo-popup-menu">
        {(popupState) => (
          <React.Fragment>
            <Button variant='text' color={popupState.isOpen ? 'primary' : 'inherit'} {...bindTrigger(popupState)}>
              <Add/> filter
            </Button>
            <Popover {...bindPopover(popupState)} id="filter-popover-popup"
              anchorOrigin={{
                vertical:   'bottom',
                horizontal: 'left',
              }}
              transformOrigin={{
                vertical:   'top',
                horizontal: 'left',
              }}>
              { availableFilters.map(f => {
                return (
                  <PopupState key={(f.columnName as string)} variant="popover"  popupId={'popup-popover-' + (f.columnName as string)}>
                    {(popupState2) => (
                      <React.Fragment>
                        <MenuItem selected={popupState2.isOpen}
                          autoFocus={false}
                          {...bindTrigger(popupState2)}
                          onClick={(event) => {
                            bindTrigger(popupState2).onClick(event); initializeDefaultFilter(f);
                          }}
                          onTouchStart={(event) => {
                            bindTrigger(popupState2).onTouchStart(event); initializeDefaultFilter(f);
                          }}
                        >{f.translation}</MenuItem>
                        <Popover
                          {...bindPopover(popupState2)}
                          anchorEl={() => {
                            return document.getElementById('filter-popover-popup')?.children[2] as Element;
                          }}
                          anchorOrigin={{
                            vertical:   'top',
                            horizontal: 'right',
                          }}
                          transformOrigin={{
                            vertical:   'top',
                            horizontal: 'left',
                          }}
                          sx={{ marginLeft: '5px' }}
                        >
                          {newFilter && <Box sx={{ padding: '10px' }}>
                            {f.type === 'boolean' && <FormControl>
                              <FormLabel id="boolean-group-label">{f.translation}</FormLabel>
                              <RadioGroup
                                sx={{ ml: 2 }}
                                aria-labelledby="boolean-group-label"
                                defaultValue='true'
                                onChange={(event) => handleBooleanChange(f.columnName as string, event)}
                              >
                                <FormControlLabel value='true' control={<Radio />} label="True" />
                                <FormControlLabel value='false' control={<Radio />} label="False" />
                              </RadioGroup>
                            </FormControl>}
                            {f.type === 'number' && <>
                              <FormLabel>{f.translation}</FormLabel>
                              <RadioGroup
                                sx={{ ml: 2 }}
                                value={newFilter.operation}
                                onChange={handleTypeChange}
                              >
                                <FormControlLabel value='greaterThan' control={<Radio />} label={capitalize(translate('registry.alerts.filter.greaterThan'))} />
                                <FormControlLabel value='greaterThanOrEqual' control={<Radio />} label={capitalize(translate('registry.alerts.filter.greaterThanOrEqual'))} />
                                <FormControlLabel value='equal' control={<Radio />} label={capitalize(translate('registry.alerts.filter.equal'))} />
                                <FormControlLabel value='lessThan' control={<Radio />} label={capitalize(translate('registry.alerts.filter.lessThan'))} />
                                <FormControlLabel value='lessThanOrEqual' control={<Radio />} label={capitalize(translate('registry.alerts.filter.lessThanOrEqual'))} />
                                <FormControlLabel value='notEqual' control={<Radio />} label={capitalize(translate('registry.alerts.filter.notEqual'))} />
                              </RadioGroup>
                              <Box sx={{
                                width: '100%', p: 2,
                              }}>
                                <Input
                                  fullWidth
                                  value={newFilter.value}
                                  onChange={handleNumberChange}
                                  type='number'
                                />
                              </Box>
                            </>}
                            {f.type === 'string' && <>
                              <FormLabel>{f.translation}</FormLabel>
                              <RadioGroup
                                sx={{ ml: 2 }}
                                value={newFilter.operation}
                                onChange={handleTypeChange}
                              >
                                <FormControlLabel value='equal' control={<Radio />} label={capitalize(translate('registry.alerts.filter.equal'))} />
                                <FormControlLabel value='notEqual' control={<Radio />} label={capitalize(translate('registry.alerts.filter.notEqual'))} />
                                <FormControlLabel value='contains' control={<Radio />} label={capitalize(translate('registry.alerts.filter.contain'))} />
                              </RadioGroup>
                              <Box sx={{
                                width: '100%', p: 2,
                              }}>
                                <Input
                                  fullWidth
                                  value={newFilter.value}
                                  onChange={handleStringChange}
                                  onKeyDown={(ev) => ev.key === 'Enter' && applyFilter([popupState, popupState2])}
                                />
                              </Box>
                            </>}
                            {f.type === 'permission' && <>
                              <FormLabel>{f.translation}</FormLabel>
                              <Select
                                variant='standard'
                                fullWidth
                                multiple
                                displayEmpty
                                value={newFilter.value}
                                onChange={e => handleListChange(e.target.value ? e.target.value : null)}
                                renderValue={(selected: string[]) => {
                                  return selected.map(o => o !== '_disabled' ? o : f.options?.disabledName || 'Disabled').join(', ');
                                }}
                              >
                                {f.options?.showDisabled && <MenuItem value='_disabled'>{f.options?.disabledName || 'Disabled'}</MenuItem>}
                                {permissions?.map(o => (<MenuItem key={o.id} value={o.name}>{o.name}</MenuItem>))}
                              </Select>
                            </>}
                            {f.type === 'list' && <>
                              <FormLabel>{f.translation}</FormLabel>
                              <Select
                                variant='standard'
                                fullWidth
                                multiple
                                displayEmpty
                                value={newFilter.value}
                                onChange={e => handleListChange(e.target.value ? e.target.value : null)}
                                renderValue={(selected: string[]) => {
                                  return selected.map(o => {
                                    if (o !== f.options?.disabledValue) {
                                      return f.valueRender ? f.valueRender(o) : o;
                                    }
                                    return f.options?.disabledName || 'Disabled';
                                  }).join(', ');
                                }}
                              >
                                {f.options?.showDisabled && <MenuItem value={f.options?.disabledValue || 'Disabled'}>{f.options?.disabledName || 'Disabled'}</MenuItem>}
                                {f.options?.listValues?.map(o => (<MenuItem key={o} value={o}>{f.valueRender ? f.valueRender(o) : o}</MenuItem>))}
                              </Select>
                            </>}

                            <Stack direction="row" spacing={2}>
                              <Button onClick={() => {
                                popupState2.close(); popupState.close();
                              }} sx={{ minWidth: '100px' }}>Cancel</Button>
                              <Button onClick={() => applyFilter([popupState, popupState2])} variant="contained" sx={{ minWidth: '200px' }}>Apply Filter</Button>
                            </Stack>
                          </Box>}
                        </Popover>
                      </React.Fragment>
                    )}
                  </PopupState>
                );
              })
              }
            </Popover>
          </React.Fragment>
        )}
      </PopupState>
    </>;
  }, [ handleListChange, handleDeleteAll, permissions, handleDelete, availableFilters, applyFilter, filters, getTranslationOfColumnName, getValueOfColumnName, handleNumberChange, handleStringChange, handleTypeChange, initializeDefaultFilter, newFilter, translate ]);

  return {
    element, filters,
  };

};