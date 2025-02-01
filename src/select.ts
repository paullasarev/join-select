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
    const columns: DataColumns = [];

    left.structure.columns.forEach((item) => {
      columns.push(`${left.structure.name}.${item}`);
    });
    right.structure.columns.forEach((item) => {
      columns.push(`${right.structure.name}.${item}`);
    });

    const rightColumnIndex = right.columnsIndexes[joinBy.right];
    const rightRowsByKeys = right.data.reduce<Record<DataKeyType, DataArray>>(
      (acc, item) => {
        const rightKeyValue = item[rightColumnIndex] as DataKeyType;
        acc[rightKeyValue] = item;
        return acc;
      },
      {},
    );

    const leftColumnIndex = left.columnsIndexes[joinBy.left];
    const data: DataArray[] = left.data.reduce<DataArray[]>(
      (result, leftRow) => {
        const row: DataArray = [];
        left.structure.columns.forEach((leftColumn, leftIndex) => {
          row.push(leftRow[leftIndex]);
        });

        const leftKeyValue = leftRow[leftColumnIndex] as DataKeyType;
        const rightRow = rightRowsByKeys[leftKeyValue];
        right.structure.columns.forEach((rightColumn, rightIndex) => {
          const rightValue = rightRow ? rightRow[rightIndex] : null;
          row.push(rightValue);
        });

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
