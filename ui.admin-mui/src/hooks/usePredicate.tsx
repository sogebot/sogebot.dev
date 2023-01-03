import { Filter, IntegratedFiltering } from '@devexpress/dx-react-grid';

export const usePredicate = () => {
  const defaultStringForAttribute = (attribute: string) => {
    return (value: string, filter: Filter, row: any) => {
      const fValue = filter.value.toLowerCase();
      if (filter.operation === 'contains') {
        return row[attribute].toLowerCase().includes(fValue);
      }

      if (filter.operation === 'equal') {
        return row[attribute].toLowerCase() === fValue;
      }

      if (filter.operation === 'notEqual') {
        return row[attribute].toLowerCase() !== fValue;
      }

      return IntegratedFiltering.defaultPredicate(value, filter, row);
    };
  };

  return { defaultStringForAttribute };
};