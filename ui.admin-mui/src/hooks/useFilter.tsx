import { Filter } from '@devexpress/dx-react-grid';
import { Add } from '@mui/icons-material';
import {
  Box, Button, Chip, FormControl, FormControlLabel, FormLabel, Input, MenuItem, Popover, Radio, RadioGroup,
} from '@mui/material';
import { Stack } from '@mui/system';
import { capitalize } from 'lodash';
import PopupState, { bindPopover, bindTrigger } from 'material-ui-popup-state';
import React from 'react';

import { useTranslation } from '~/src/hooks/useTranslation';

export const useFilter = <T,>(availableFilters: {
  columnName: keyof T;
  translationKey?: string;
  type: 'string' | 'number' | 'boolean';
}[]) => {
  const { translate } = useTranslation();

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

  const applyFilter = React.useCallback((popups: any[]) => {
    if (newFilter && String(newFilter.value).length > 0) {
      setFilters([
        ...filters,
        newFilter,
      ]);
    }

    for (const popup of popups) {
      popup.close();
    }
  }, [ newFilter, filters ]);

  const handleDelete = React.useCallback((idx: number) => {
    console.log('Deleting filter ', idx);
    setFilters(filters.filter((_, i) => i !== idx));
  }, [ filters ]);

  const handleDeleteAll = React.useCallback(() => {
    console.log('Deleting all filters');
    setFilters([]);
  }, [ filters ]);

  const getTranslationKeyOfColumnName = React.useCallback((columnName: string) => {
    return availableFilters.find(o => o.columnName === columnName)?.translationKey || columnName;
  }, [ availableFilters ]);

  const element = React.useMemo(() => {
    return <>
      { filters.map((filter, idx) => <Chip key={idx} label={
        <><strong>{capitalize(translate(getTranslationKeyOfColumnName(filter.columnName)))}</strong> { translate('registry.alerts.filter.' + filter.operation) } <strong>{String(filter.value)}</strong></>
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
                        >{capitalize(translate(f.translationKey || (f.columnName as string)))}</MenuItem>
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
                          {newFilter && <Box sx={{ padding: '5px' }}>
                            {f.type === 'boolean' && <FormControl>
                              <FormLabel id="boolean-group-label">{capitalize(translate(f.translationKey || (f.columnName as string)))}</FormLabel>
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
                              <FormLabel>{capitalize(translate(f.translationKey || (f.columnName as string)))}</FormLabel>
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
                              <Box sx={{ width: '100%', p: 2 }}>
                                <Input
                                  fullWidth
                                  value={newFilter.value}
                                  onChange={handleNumberChange}
                                  type='number'
                                />
                              </Box>
                            </>}
                            {f.type === 'string' && <>
                              <FormLabel>{capitalize(translate(f.translationKey || (f.columnName as string)))}</FormLabel>
                              <RadioGroup
                                sx={{ ml: 2 }}
                                value={newFilter.operation}
                                onChange={handleTypeChange}
                              >
                                <FormControlLabel value='equal' control={<Radio />} label={capitalize(translate('registry.alerts.filter.equal'))} />
                                <FormControlLabel value='notEqual' control={<Radio />} label={capitalize(translate('registry.alerts.filter.notEqual'))} />
                                <FormControlLabel value='contains' control={<Radio />} label={capitalize(translate('registry.alerts.filter.contain'))} />
                              </RadioGroup>
                              <Box sx={{ width: '100%', p: 2 }}>
                                <Input
                                  fullWidth
                                  value={newFilter.value}
                                  onChange={handleStringChange}
                                />
                              </Box>
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
  }, [ handleDelete, availableFilters, applyFilter, filters, getTranslationKeyOfColumnName, handleNumberChange, handleStringChange, handleTypeChange, initializeDefaultFilter, newFilter, translate ]);

  return { element, filters };

};