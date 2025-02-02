import { DataColumns, DataTable } from 'types';
import {
  fromArray,
  group,
  join,
  joinLeft,
  joinRight,
  select,
  where,
} from './select';

describe('join-select', () => {
  const testColumns: DataColumns = ['first', 'second'];

  const data = [[1, 2]];

  const countriesColumns: DataColumns = ['id', 'name'];

  const countriesData = [
    [1, 'Germany'],
    [2, 'Russia'],
  ];

  const countriesRussiaData = [[2, 'Russia']];

  const citiesColumns: DataColumns = ['id', 'name', 'countryId'];

  const citiesData = [
    [21, 'Berlin', 1],
    [22, 'Hamburg', 1],
    [23, 'Munchen', 1],
    [11, 'Moscow', 2],
    [12, 'Izhevsk', 2],
    [13, 'Voronezh', 2],
  ];

  describe('fromTable', () => {
    it('should make table', () => {
      const table = fromArray(testColumns)(data);
      expect(table.columns).toEqual(testColumns);
      expect(table.data).toEqual(data);
      expect(table.columnsIndexes).toEqual({ first: 0, second: 1 });
    });
  });

  describe('select', () => {
    it('should select one column', () => {
      const table = fromArray(testColumns)(data);
      const table2 = select([{ name: 'first', alias: 'first2' }])(table);
      expect(table2.columns).toEqual(['first2']);
      expect(table2.data).toEqual([[1]]);
      expect(table2.columnsIndexes).toEqual({ first2: 0 });
    });
  });

  describe('joinLeft', () => {
    it('should join by one column', () => {
      const table1 = fromArray(citiesColumns)(citiesData);
      const table2 = fromArray(countriesColumns)(countriesData);

      const table3 = joinLeft(
        { left: 'countryId', right: 'id' },
        'cities',
        'countries',
      )(table1, table2);
      expect(table3.columns).toEqual([
        'cities.id',
        'cities.name',
        'cities.countryId',
        'countries.id',
        'countries.name',
      ]);
      expect(table3.data).toEqual([
        [21, 'Berlin', 1, 1, 'Germany'],
        [22, 'Hamburg', 1, 1, 'Germany'],
        [23, 'Munchen', 1, 1, 'Germany'],
        [11, 'Moscow', 2, 2, 'Russia'],
        [12, 'Izhevsk', 2, 2, 'Russia'],
        [13, 'Voronezh', 2, 2, 'Russia'],
      ]);
    });
  });

  describe('joinRight', () => {
    it('should join by one column', () => {
      const table1 = fromArray(countriesColumns)(countriesData);
      const table2 = fromArray(citiesColumns)(citiesData);

      const table3 = joinRight(
        { left: 'id', right: 'countryId' },
        'cities',
        'countries',
      )(table1, table2);
      expect(table3.columns).toEqual([
        'cities.id',
        'cities.name',
        'cities.countryId',
        'countries.id',
        'countries.name',
      ]);
      expect(table3.data).toEqual([
        [21, 'Berlin', 1, 1, 'Germany'],
        [22, 'Hamburg', 1, 1, 'Germany'],
        [23, 'Munchen', 1, 1, 'Germany'],
        [11, 'Moscow', 2, 2, 'Russia'],
        [12, 'Izhevsk', 2, 2, 'Russia'],
        [13, 'Voronezh', 2, 2, 'Russia'],
      ]);
    });
  });

  describe('join', () => {
    it('should join by one column', () => {
      const table1 = fromArray(citiesColumns)(citiesData);
      const table2 = fromArray(countriesColumns)(countriesRussiaData);

      const table3 = join(
        { left: 'countryId', right: 'id' },
        'cities',
        'countries',
      )(table1, table2);
      expect(table3.columns).toEqual([
        'cities.id',
        'cities.name',
        'cities.countryId',
        'countries.id',
        'countries.name',
      ]);
      expect(table3.data).toEqual([
        [11, 'Moscow', 2, 2, 'Russia'],
        [12, 'Izhevsk', 2, 2, 'Russia'],
        [13, 'Voronezh', 2, 2, 'Russia'],
      ]);
    });
  });

  describe('where', () => {
    it('should filter by one column', () => {
      const table = fromArray(citiesColumns)(citiesData);
      const table2 = where({ name: ['Moscow', 'Izhevsk'] })(table);
      expect(table2.data).toEqual([
        [11, 'Moscow', 2],
        [12, 'Izhevsk', 2],
      ]);
    });
  });

  describe('groupBy', () => {
    const table1 = fromArray(citiesColumns)(citiesData);
    const table2 = fromArray(countriesColumns)(countriesData);

    const table3 = joinLeft(
      { left: 'countryId', right: 'id' },
      'cities',
      'countries',
    )(table1, table2);

    it('should group by id', () => {
      const table4 = group('group', ['countries.id'])(table3);

      expect(table4.columns).toEqual(['countries.id', 'group']);
      const row0 = table4.data[0];
      const row1 = table4.data[1];
      expect(row0[0]).toEqual(1);
      expect(row1[0]).toEqual(2);

      const group0 = row0[1] as DataTable;
      expect(group0?.columns).toEqual([
        'cities.id',
        'cities.name',
        'cities.countryId',
        'countries.id',
        'countries.name',
      ]);
      expect(group0?.data).toEqual([
        [21, 'Berlin', 1, 1, 'Germany'],
        [22, 'Hamburg', 1, 1, 'Germany'],
        [23, 'Munchen', 1, 1, 'Germany'],
      ]);

      const group1 = row1[1] as DataTable;
      expect(group1?.columns).toEqual([
        'cities.id',
        'cities.name',
        'cities.countryId',
        'countries.id',
        'countries.name',
      ]);
      expect(group1?.data).toEqual([
        [11, 'Moscow', 2, 2, 'Russia'],
        [12, 'Izhevsk', 2, 2, 'Russia'],
        [13, 'Voronezh', 2, 2, 'Russia'],
      ]);
    });
  });
});
