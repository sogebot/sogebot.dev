import { Filter, IntegratedFiltering } from '@devexpress/dx-react-grid';

const includesPredicate = (value: string | string[], filter: Filter) => {
  try {
    if (typeof value === 'string') {
      return filter.value.map((o: string) => o.toLowerCase()).includes(value.toLowerCase());
    } else if (Array.isArray(value)) {
      const values = value.map((o: string) => o.toLowerCase());
      const filterValues = filter.value.map((o: string) => o.toLowerCase());

      for (const val of values) {
        if (filterValues.includes(val)) {
          return true;
        }
      }
      return false;
    } else {
      return value === filter.value;
    }
  } catch (e) {
    console.error({
      value, filter, 
    });
    console.error(e);
    return false;
  }
};

export const customPredicate = (value: string, filter: Filter, row: any) => {
  return filter.operation === 'includes'
    ? includesPredicate(value, filter)
    : IntegratedFiltering.defaultPredicate(value, filter, row);
};