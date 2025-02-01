export type DataKeyType = number | string;
export type DataValue = number | string | null | Date | DataArray | DataRecord;
export type DataArray = Array<DataValue>;
export interface DataRecord {
  [key: number | string]: DataValue;
}

export type DataColumns = string[];

export type ColumnsIndexes = Record<string, number>;

export type TableStructure = {
  name: string;
  columns: DataColumns;
};

export type DataTable = {
  structure: TableStructure;
  columnsIndexes: ColumnsIndexes;
  data: DataArray[];
};

export type NameAlias = {
  name: string;
  alias: string;
};

export type LeftRight = {
  left: string;
  right: string;
};
