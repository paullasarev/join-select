import { intersection } from 'lodash';

import {
  ColumnsIndexes,
  DataArray,
  DataColumns,
  DataKeyType,
  DataTable,
  LeftRight,
  NameAlias,
  TableStructure,
} from 'types';

export const fromArray =
  (structure: TableStructure) =>
  (data: DataArray[]): DataTable => {
    const { columns } = structure;
    const columnsIndexes = getColumnsIndexes(columns);

    return {
      structure,
      data,
      columnsIndexes,
    };
  };

export const select =
  (name: string, columns: NameAlias[]) =>
  (table: DataTable): DataTable => {
    const indexes = columns.reduce<Array<number>>((acc, item) => {
      const index = table.columnsIndexes[item.name];
      acc.push(index);
      return acc;
    }, []);

    const resultColumns = indexes.reduce<DataColumns>((acc, item) => {
      acc.push(columns[item].alias);

      return acc;
    }, []);

    const data = table.data.reduce<DataArray[]>((targetTable, sourceRow) => {
      const row = indexes.reduce<DataArray>(
        (newRow, sourceColumnIndex, targetColumnIndex) => {
          newRow.push(sourceRow[sourceColumnIndex]);
          return newRow;
        },
        [],
      );

      targetTable.push(row);

      return targetTable;
    }, []);

    return {
      structure: {
        name,
        columns: resultColumns,
      },
      columnsIndexes: getColumnsIndexes(resultColumns),
      data,
    };
  };

export function getColumnsIndexes(columns: DataColumns) {
  return columns.reduce<ColumnsIndexes>((acc, item, index) => {
    acc[item] = index;
    return acc;
  }, {});
}

export const joinLeft =
  (name: string, joinBy: LeftRight) =>
  (left: DataTable, right: DataTable): DataTable => {
    const columns: DataColumns = getJoinColumns(left, right);
    const rightRowsByKeys = getRowsByKeys(right, joinBy.right);

    const leftColumnIndex = left.columnsIndexes[joinBy.left];
    const data: DataArray[] = left.data.reduce<DataArray[]>(
      (result, leftRow) => {
        const row: DataArray = [];
        addCells(row, left, leftRow);

        const leftKeyValue = leftRow[leftColumnIndex] as DataKeyType;
        const rightRow = rightRowsByKeys[leftKeyValue]?.[0];
        addCells(row, right, rightRow);

        result.push(row);

        return result;
      },
      [],
    );

    return {
      structure: {
        name,
        columns,
      },
      columnsIndexes: getColumnsIndexes(columns),
      data,
    };
  };

export const joinRight =
  (name: string, joinBy: LeftRight) =>
  (left: DataTable, right: DataTable): DataTable =>
    joinLeft(name, { left: joinBy.right, right: joinBy.left })(right, left);

export const join =
  (name: string, joinBy: LeftRight) =>
  (left: DataTable, right: DataTable): DataTable => {
    const columns: DataColumns = getJoinColumns(left, right);
    const leftRowsByKeys = getRowsByKeys(left, joinBy.left);
    const rightRowsByKeys = getRowsByKeys(right, joinBy.right);

    const leftKeys = Object.keys(leftRowsByKeys);
    const rightKeys = Object.keys(rightRowsByKeys);
    const commonKeys = intersection(leftKeys, rightKeys);

    const data: DataArray[] = [];

    commonKeys.forEach((keyValue) => {
      const leftRows = leftRowsByKeys[keyValue];
      const rightRows = rightRowsByKeys[keyValue];
      leftRows.forEach((leftRow) => {
        rightRows.forEach((rightRow) => {
          const newRow: DataArray = [];
          addCells(newRow, left, leftRow);
          addCells(newRow, right, rightRow);
          data.push(newRow);
        });
      });
    });

    return {
      structure: {
        name,
        columns,
      },
      columnsIndexes: getColumnsIndexes(columns),
      data,
    };
  };

function addCells(newRow: DataArray, table: DataTable, tableRow: DataArray) {
  table.structure.columns.forEach((columName, columnIndex) => {
    newRow.push(tableRow[columnIndex]);
  });
}

function getRowsByKeys(table: DataTable, columnName: string) {
  const columnIndex = table.columnsIndexes[columnName];
  const rowsByKeys = table.data.reduce<Record<DataKeyType, DataArray[]>>(
    (acc, item) => {
      const keyValue = item[columnIndex] as DataKeyType;
      const prev = acc[keyValue] ?? [];
      prev.push(item);
      acc[keyValue] = prev;
      return acc;
    },
    {},
  );
  return rowsByKeys;
}

function getJoinColumns(left: DataTable, right: DataTable) {
  const columns: DataColumns = [];

  left.structure.columns.forEach((item) => {
    columns.push(`${left.structure.name}.${item}`);
  });
  right.structure.columns.forEach((item) => {
    columns.push(`${right.structure.name}.${item}`);
  });

  return columns;
}
