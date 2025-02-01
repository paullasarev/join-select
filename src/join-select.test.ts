import { TableStructure } from 'types';
import { fromArray, joinLeft, joinRight, select } from './select';

describe('join-select', () => {
  const test: TableStructure = {
    name: 'test',
    columns: ['first', 'second'],
  };

  const data = [[1, 2]];

  const countries: TableStructure = {
    name: 'countries',
    columns: ['id', 'name'],
  };

  const countriesData = [
    [1, 'Germany'],
    [2, 'Russia'],
  ];

  const cities: TableStructure = {
    name: 'cities',
    columns: ['id', 'name', 'countryId'],
  };

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
      const table = fromArray(test)(data);
      expect(table.structure.name).toBe(test.name);
      expect(table.structure.columns).toEqual(test.columns);
      expect(table.data).toEqual(data);
      expect(table.columnsIndexes).toEqual({ first: 0, second: 1 });
    });
  });

  describe('select', () => {
    it('should select one column', () => {
      const table = fromArray(test)(data);
      const table2 = select('sel1', [{ name: 'first', alias: 'first2' }])(
        table,
      );
      expect(table2.structure.name).toBe('sel1');
      expect(table2.structure.columns).toEqual(['first2']);
      expect(table2.data).toEqual([[1]]);
      expect(table2.columnsIndexes).toEqual({ first2: 0 });
    });
  });

  describe('joinLeft', () => {
    it('should join by one column', () => {
      const table1 = fromArray(cities)(citiesData);
      const table2 = fromArray(countries)(countriesData);

      const table3 = joinLeft('joined', { left: 'countryId', right: 'id' })(
        table1,
        table2,
      );
      expect(table3.structure.name).toBe('joined');
      expect(table3.structure.columns).toEqual([
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
      const table1 = fromArray(countries)(countriesData);
      const table2 = fromArray(cities)(citiesData);

      const table3 = joinRight('joined', { left: 'id', right: 'countryId' })(
        table1,
        table2,
      );
      expect(table3.structure.name).toBe('joined');
      expect(table3.structure.columns).toEqual([
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

  describe('join', () => {});

  describe('joinFull', () => {});

  describe('joinCross', () => {});

  describe('where', () => {});

  describe('groupBy', () => {});
});
