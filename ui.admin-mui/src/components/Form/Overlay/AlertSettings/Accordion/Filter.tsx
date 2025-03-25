import { Filter } from '@backend/database/entity/overlay';
import { DeleteTwoTone, ExpandMoreTwoTone } from '@mui/icons-material';
import { Accordion, AccordionDetails, AccordionProps, AccordionSummary, Button, Divider, FormControl, IconButton, InputLabel, MenuItem, Paper, Select, Stack, TextField, Typography } from '@mui/material';
import { cloneDeep, isEqual } from 'lodash';
import { nanoid } from 'nanoid';
import React from 'react';

import { useTranslation } from '../../../../../hooks/useTranslation';
import { FormRewardInput } from '../../../Input/Reward';

type Props = Omit<AccordionProps, 'children' | 'onChange'> & {
  model:               Filter,
  open:                string | boolean,
  label?:              string,
  onOpenChange?:        (value: string) => void;
  onChange:            (value: Filter) => void;
  onDelete?:           () => void;
  customLabelDetails?: string | React.JSX.Element | null;
  rules:               [string, string][],
  hideGroupButton?:    boolean,
};

const itemsToStringifiedPart = (items: any[], operator: string): string => {
  let output = '';
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item !== null && typeof item.items === 'undefined') {
      if (i > 0) {
        output += ` ${operator} `;
      }

      if (item.typeof === 'string') {
        if (['pr'].includes(item.comparator)) {
          output += `${item.type} ${item.comparator}`;
        } else if (['includes'].includes(item.comparator)) {
          output += `${item.type} ${item.comparator} [${item.value.split(',').map((o: string) => `'${o.trim()}'`).join(', ')}]`;
        } else {
          output += `${item.type} ${item.comparator} '${item.value}'`;
        }
      } else if (item.typeof === 'tier') {
        const value = item.value === 'Prime' ? 'Prime' : item.value;
        output += `${item.type} ${item.comparator} ${value}`;
      } else if (['is-even', 'is-odd', 'pr'].includes(item.comparator)) {
        output += `${item.type} ${item.comparator}`;
      } else {
        output += `${item.type} ${item.comparator} ${item.value}`;
      }
    } else if (item !== null && item.items.length > 0) {
      if (i > 0) {
        output += ` ${operator} `;
      }
      output += '(' + itemsToStringifiedPart(item.items, item.operator) + ')';
    }
  }
  return output;
};

export const AccordionFilter: React.FC<Props> = (props) => {
  const [ accordionId ] = React.useState(nanoid());
  const { translate } = useTranslation();
  const { open,
    onOpenChange,
    onChange,
    model,
    label,
    ...accordionProps } = props;

  const [ accordion, setAccordion ] = React.useState('');

  const [addRuleType, setRuleType ] = React.useState([props.rules[0][0]]);

  const handleClick = () => {
    if (onOpenChange) {
      onOpenChange(isOpened ? '' : accordionId);
    }
  };

  const getRuleType = (type: string) => {
    const rule = props.rules.find(o => o[0] === type);
    if (!rule) {
      return 'string';
    } else {
      return rule[1];
    }
  };

  const getRuleDefaultValue = (type: string) => {
    switch (getRuleType(type)) {
      case 'number':
        return 0;
      case 'tier':
        return 'Prime';
      case 'service':
        return 'tiltify';
      default:
        return '';
    }
  };

  const generateComparators = (type: 'number' | 'string' | 'any') => {
    const items: { value: string, text: string }[] = [];

    if (getRuleType(type) === 'service' || getRuleType(type) === 'reward') {
      items.push({
        value: 'eq', text: translate('registry.alerts.filter.equal'),
      });
      items.push({
        value: 'neq', text: translate('registry.alerts.filter.notEqual'),
      });
      return items;
    }

    if (getRuleType(type) === 'number' || getRuleType(type) === 'any') {
      items.push({
        value: 'is-even', text: translate('registry.alerts.filter.isEven'),
      });
      items.push({
        value: 'is-odd', text: translate('registry.alerts.filter.isOdd'),
      });
    }

    if (getRuleType(type) !== 'string' || getRuleType(type) === 'any') {
      items.push({
        value: 'lt', text: translate('registry.alerts.filter.lessThan'),
      });
      items.push({
        value: 'lt-eq', text: translate('registry.alerts.filter.lessThanOrEqual'),
      });
    }

    if (getRuleType(type) === 'string' || getRuleType(type) === 'any') {
      items.push({
        value: 'co', text: translate('registry.alerts.filter.contain'),
      });
    }

    items.push({
      value: 'eq', text: translate('registry.alerts.filter.equal'),
    });
    items.push({
      value: 'neq', text: translate('registry.alerts.filter.notEqual'),
    });
    items.push({
      value: 'pr', text: translate('registry.alerts.filter.present'),
    });

    if (getRuleType(type) === 'string' || getRuleType(type) === 'any') {
      items.push({
        value: 'includes', text: translate('registry.alerts.filter.includes'),
      });
    }

    if (getRuleType(type) !== 'string' || getRuleType(type) === 'any') {
      items.push({
        value: 'gt', text: translate('registry.alerts.filter.greaterThan'),
      });
      items.push({
        value: 'gt-eq', text: translate('registry.alerts.filter.greaterThanOrEqual'),
      });
    }

    return items;
  };

  const updateItem = React.useCallback((index: number, item: any) => {
    const update = cloneDeep(model ? model : {
      items: [], operator: 'and',
    });
    update.items[index] = item;
    if (!isEqual(model, update)) {
      onChange(update);
    }
  }, [ model ]);

  const deleteItem = React.useCallback((index: number) => {
    const update = cloneDeep(model ? model : {
      items: [], operator: 'and',
    });
    update.items.splice(index, 1);
    onChange(update);
  }, [ model ]);

  const stringifiedFilter = React.useMemo(() => {
    if (model) {
      const filter = itemsToStringifiedPart(model.items, model.operator);
      return filter.length > 0 ? filter : `<< ${translate('registry.alerts.filter.noFilter')} >>`;
    }
    return `<< ${translate('registry.alerts.filter.noFilter')} >>`;
  }, [ model?.items, model?.operator ]);

  const isOpened = open === accordionId || (typeof open === 'boolean' && open);

  return <Accordion {...accordionProps} expanded={isOpened && !props.disabled}>
    <AccordionSummary
      expandIcon={<ExpandMoreTwoTone />}
      onClick={() => handleClick()}
      aria-controls="panel1a-content"
      id="panel1a-header"
    >
      <Typography sx={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', width: '100%',
      }}>
        {label ? label : translate('registry.alerts.filter.name')}
        <Typography component='span' variant='caption' sx={{
          textAlign: 'right', maxWidth: '200px',
        }}>
          {props.customLabelDetails
            ? props.customLabelDetails
            : stringifiedFilter
          }
        </Typography>
      </Typography>
    </AccordionSummary>
    <AccordionDetails>
      <FormControl variant="filled" sx={{ width: '100%' }}>
        <InputLabel id="demo-simple-select-standard-label">{translate('registry.alerts.filter.operator')}</InputLabel>
        <Select
          fullWidth
          labelId="demo-simple-select-standard-label"
          id="demo-simple-select-standard"
          value={model?.operator ?? 'and'}
          label={translate('registry.alerts.filter.operator')}
          onChange={(event) => onChange({
            ...(model ? model : {
              items: [], operator: 'and',
            }),
            operator: event.target.value as 'and' | 'or',
          })}
        >
          {['and', 'or', 'and not', 'or not'].map(val => <MenuItem value={val} key={val}>
            {val}
          </MenuItem>)}
        </Select>
      </FormControl>

      <Divider variant='middle' sx={{ m: 1 }}/>

      {model?.items.map((item, index) => <React.Fragment key={index}>
        {(item === null || 'items' in item)
          ? <>
            {/* Another group */}
            <AccordionFilter
              hideGroupButton
              rules={props.rules}
              model={item}
              label={'Group'}
              open={accordion}
              onOpenChange={setAccordion}
              onDelete={() => deleteItem(index)}
              onChange={(val) => {
                updateItem(index, val);
              }}/>
          </>
          : <Paper sx={{
            p: 0.5, mb: 0.5,
          }} elevation={1} >
            <Stack direction='row' sx={{
              alignItems: 'center', justifyContent: 'space-between',
            }}>
              {item.type}
              <IconButton color='error' sx={{ height: '40px' }} onClick={() => deleteItem(index)}><DeleteTwoTone/></IconButton>
            </Stack>
            <Stack direction='row' sx={{ alignItems: 'flex-start' }}>
              <FormControl variant="filled" sx={{
                width:                  '100%',
                '& .MuiInputBase-root': { borderTopRightRadius: 0 },
              }}>
                <InputLabel id="demo-simple-select-standard-label">{translate('registry.alerts.filter.comparator')}</InputLabel>
                <Select
                  fullWidth
                  labelId="demo-simple-select-standard-label"
                  id="demo-simple-select-standard"
                  value={item.comparator}
                  label={translate('registry.alerts.filter.comparator')}
                  onChange={(event) => updateItem(index, {
                    ...item, comparator: event.target.value as any,
                  })}
                >
                  {generateComparators(item.type as any).map(val => <MenuItem value={val.value} key={val.value}>
                    {val.text}
                  </MenuItem>)}
                </Select>
              </FormControl>

              {!['is-even', 'is-odd', 'pr'].includes(item.comparator) && <>
                {getRuleType(item.type) === 'reward' && <FormRewardInput
                  value={item.value === '' ? null : String(item.value)}
                  onChange={(value) => updateItem(index, {
                    ...item, value: value.id,
                  })}
                />}

                {getRuleType(item.type) === 'tier' && <FormControl variant="filled" sx={{
                  width:                  '100%',
                  '& .MuiInputBase-root': { borderTopLeftRadius: 0 },
                }}>
                  <InputLabel id="demo-simple-select-standard-label">{translate('registry.alerts.filter.value')}</InputLabel>
                  <Select
                    fullWidth
                    labelId="demo-simple-select-standard-label"
                    id="demo-simple-select-standard"
                    value={item.value}
                    label={translate('registry.alerts.filter.value')}
                    onChange={(event) => updateItem(index, {
                      ...item, value: event.target.value as any,
                    })}
                  >
                    {['Prime', '1', '2', '3'].map(val => <MenuItem value={val} key={val}>
                      {val}
                    </MenuItem>)}
                  </Select>
                </FormControl>}

                {getRuleType(item.type) === 'number' && <TextField
                  sx={{ '& .MuiInputBase-root': { borderTopLeftRadius: 0 } }}
                  fullWidth
                  label={translate('registry.alerts.filter.value')}
                  value={item.value}
                  onChange={(event) => updateItem(index, {
                    ...item, value: Number(event.target.value),
                  })}/>
                }

                {getRuleType(item.type) === 'string' && <TextField
                  sx={{ '& .MuiInputBase-root': { borderTopLeftRadius: 0 } }}
                  fullWidth
                  label={translate('registry.alerts.filter.value')}
                  value={item.value}
                  helperText={item.comparator === 'includes' ? translate('registry.alerts.filter.valueSplitByComma') : undefined}
                  onChange={(event) => updateItem(index, {
                    ...item, value: event.target.value,
                  })}/>
                }
              </>}

            </Stack>
          </Paper>}
      </React.Fragment>)}

      {(model?.items.length ?? 0) > 0 && <Divider variant='middle' sx={{ m: 1 }}/>}

      <FormControl variant="filled" sx={{ width: '100%' }}>
        <InputLabel id="demo-simple-select-standard-label">{translate('registry.alerts.filter.rule')}</InputLabel>
        <Select
          fullWidth
          labelId="demo-simple-select-standard-label"
          id="demo-simple-select-standard"
          value={addRuleType[0]}
          label={translate('registry.alerts.filter.rule')}
          onChange={(event) => setRuleType([event.target.value, addRuleType[1]])}
        >
          {props.rules.map(val => <MenuItem value={val[0]} key={val[0]}>
            {val[0]}
          </MenuItem>)}
        </Select>
      </FormControl>

      <Button fullWidth onClick={() => {
        const update = cloneDeep(model ? model : {
          items: [], operator: 'and',
        });
        update.items.push({
          type:       addRuleType[0],
          comparator: 'eq',
          value:      getRuleDefaultValue(addRuleType[0]),
          typeof:     getRuleType(addRuleType[0]),
        });
        onChange(update);
      }} variant='contained'>{ translate('registry.alerts.filter.addRule') }</Button>

      {!props.hideGroupButton && <Button sx={{ mt: 1 }} fullWidth onClick={() => {
        const update = cloneDeep(model ? model : {
          items: [], operator: 'and',
        });
        update.items.push(null);
        onChange(update);
      }} variant='contained'>{ translate('registry.alerts.filter.addGroup') }</Button>}

      {props.onDelete && <Button
        color='error'
        sx={{ mt: 1 }}
        fullWidth
        onClick={props.onDelete}
        variant='contained'>Delete group</Button>}
    </AccordionDetails>
  </Accordion>;
};