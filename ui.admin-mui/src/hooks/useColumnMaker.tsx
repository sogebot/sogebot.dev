import {
  Column, Filter, IntegratedFiltering, SortingState, Table,
} from '@devexpress/dx-react-grid';
import { capitalize } from 'lodash';
import { useCallback, useMemo } from 'react';

import { customPredicate } from '~/src/helpers/customPredicate';
import { useFilter } from '~/src/hooks/useFilter';
import { useTranslation } from '~/src/hooks/useTranslation';

export const useColumnMaker = <T,>(props: {
  columnName: keyof T | 'actions';
  translationKey?: string;
  translation?: string;
  table?: Omit<Table.ColumnExtension, 'columnName'>;
  column?: Omit<Column, 'name' | 'title'>
  sorting?: Omit<SortingState.ColumnExtension, 'columnName'>
  filtering?: {
    type: 'string' | 'number' | 'boolean' | 'permission' | 'list',
    valueRender?: (value: string) => string;
    options?: {
      showDisabled?: boolean,
      disabledName?: string,
      disabledValue?: string,
      listValues?: string[],
    }
  }
  hidden?: boolean;
  predicate?: (value: string, filter: Filter, row: any) => boolean;
}[]) => {
  const { translate } = useTranslation();

  const tableColumnExtensions = props.map((item: typeof props[number]) => ({
    columnName: item.columnName,
    align:      item.table?.align,
    width:      item.table?.width,
  })) as Table.ColumnExtension[];

  const sortingTableExtensions = props.map((item: typeof props[number]) => ({
    columnName:     item.columnName,
    sortingEnabled: item.sorting?.sortingEnabled ?? true,
  })) as SortingState.ColumnExtension[];

  const getTranslationOfColumnName = useCallback((columnName: string) => {
    const current = props.find(o => o.columnName === columnName)!;
    return current.translation || capitalize(translate(current.translationKey|| columnName)) ;
  }, [ props, translate ]);

  const useFilterSetup = useMemo(() => {
    return props
      .filter((item: typeof props[number]) => item.filtering)
      .map((item: typeof props[number]) => ({
        columnName:  item.columnName,
        translation: getTranslationOfColumnName(item.columnName as string),
        type:        item.filtering?.type,
        valueRender: item.filtering?.valueRender,
        options:     {
          showDisabled:  item.filtering?.options?.showDisabled,
          disabledName:  item.filtering?.options?.disabledName,
          disabledValue: item.filtering?.options?.disabledValue,
          listValues:    item.filtering?.options?.listValues,
        },
      })) as Parameters<typeof useFilter>[0];
  }, [ props, getTranslationOfColumnName ]);

  const columns = useMemo(() => props.map((item: typeof props[number]) => {
    return ({
      name:  item.columnName,
      title: getTranslationOfColumnName(item.columnName as string),
      ...item.column,
    }) as Column;
  }), [ props, getTranslationOfColumnName ]);

  const defaultHiddenColumnNames = props
    .filter((item: typeof props[number]) => item.hidden)
    .map((item: typeof props[number]) => item.columnName);

  const filteringColumnExtensions = props.map((item: typeof props[number]) => ({
    columnName: item.columnName,
    predicate:  item.predicate ?? customPredicate,
  }) as IntegratedFiltering.ColumnExtension);

  return {
    useFilterSetup, tableColumnExtensions, columns, sortingTableExtensions, defaultHiddenColumnNames, filteringColumnExtensions,
  };

};