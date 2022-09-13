import { Filter, IntegratedFiltering } from '@devexpress/dx-react-grid';

const includesPredicate = (value: string, filter: Filter) => {
  if (value) {
    return filter.value.map((o: string) => o.toLowerCase()).includes(value.toLowerCase());
  } else {
    return value === filter.value;
  }
};

export const customPredicate = (value: string, filter: Filter, row: any) => {
  return filter.operation === 'includes'
    ? includesPredicate(value, filter)
    : IntegratedFiltering.defaultPredicate(value, filter, row);
};