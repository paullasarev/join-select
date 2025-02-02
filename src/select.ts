import { intersection, groupBy } from 'lodash';

import {
  ColumnsIndexes,
  DataArray,
  DataColumns,
  DataKeyType,
  DataTable,
  DataValue,
  LeftRight,
  NameAlias,
} from 'types';

export const fromArray =
  (columns: DataColumns) =>
  (data: DataArray[]): DataTable => {
    const columnsIndexes = getColumnsIndexes(columns);

    return {
      columns,
      data,
      columnsIndexes,
    };
  };

export const select =
  (columns: NameAlias[]) =>
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
      columns: resultColumns,
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
  (
    joinBy: LeftRight,
    leftPrefix: string | undefined = undefined,
    rightPrefix: string | undefined = 'right',
  ) =>
  (left: DataTable, right: DataTable): DataTable => {
    const columns: DataColumns = getJoinColumns(
      left,
      right,
      leftPrefix,
      rightPrefix,
    );
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
      columns,
      columnsIndexes: getColumnsIndexes(columns),
      data,
    };
  };

export const joinRight =
  (
    joinBy: LeftRight,
    leftPrefix: string | undefined = undefined,
    rightPrefix: string | undefined = 'right',
  ) =>
  (left: DataTable, right: DataTable): DataTable =>
    joinLeft(
      { left: joinBy.right, right: joinBy.left },
      leftPrefix,
      rightPrefix,
    )(right, left);

export const join =
  (
    joinBy: LeftRight,
    leftPrefix: string | undefined = undefined,
    rightPrefix: string | undefined = 'right',
  ) =>
  (left: DataTable, right: DataTable): DataTable => {
    const columns: DataColumns = getJoinColumns(
      left,
      right,
      leftPrefix,
      rightPrefix,
    );
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
      columns,
      columnsIndexes: getColumnsIndexes(columns),
      data,
    };
  };

export const where =
  (filter: Record<string, DataValue[]>) =>
  (dataSrc: DataTable): DataTable => {
    const data: DataArray[] = [];

    dataSrc.data.forEach((row) => {
      const filters = Object.entries(filter);

      const matched = filters.every((entry) => {
        const [columnName, columnValue] = entry;
        return columnValue.some((filterValue) => {
          const columnIndex = dataSrc.columnsIndexes[columnName];
          return row[columnIndex] === filterValue;
        });
      });

      if (matched) {
        data.push(row);
      }
    });

    return {
      columns: dataSrc.columns,
      columnsIndexes: dataSrc.columnsIndexes,
      data,
    };
  };

export const group =
  (groupColumName: string, groups: string[]) =>
  (dataSrc: DataTable): DataTable => {
    const { columnsIndexes } = dataSrc;
    const getColumnIndex = (columnName: string) => columnsIndexes[columnName];
    const groupColumnsIndexes = groups.map(getColumnIndex);

    const grouped = groupBy(dataSrc.data, (row) => {
      const key = groupColumnsIndexes
        .map((columnIndex) => String(row[columnIndex]))
        .join(':');
      return key;
    });
    const groupedValues = Object.values(grouped);
    const data: DataArray[] = [];

    groupedValues.forEach((keyData) => {
      const groupedRow = keyData[0];
      const keyRow: DataArray = groups.map<DataValue>(
        (columnName) => groupedRow[getColumnIndex(columnName)],
      );
      const keyTable: DataTable = {
        columns: dataSrc.columns,
        columnsIndexes,
        data: keyData,
      };
      keyRow.push(keyTable);
      data.push(keyRow);
    });

    const columns = [...groups, groupColumName];

    return {
      columns,
      columnsIndexes: getColumnsIndexes(columns),
      data,
    };
  };

function addCells(newRow: DataArray, table: DataTable, tableRow: DataArray) {
  table.columns.forEach((columName, columnIndex) => {
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

function getPrefixedName(name: string, prefix: string | undefined) {
  return !prefix ? name : `${prefix}.${name}`;
}

function getJoinColumns(
  left: DataTable,
  right: DataTable,
  leftPrefix: string | undefined,
  rightPrefix: string | undefined,
) {
  const columns: DataColumns = [];

  left.columns.forEach((item) => {
    columns.push(getPrefixedName(item, leftPrefix));
  });
  right.columns.forEach((item) => {
    columns.push(getPrefixedName(item, rightPrefix));
  });

  return columns;
}
