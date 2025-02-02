export type DataKeyType = number | string;
export type DataValue =
  | number
  | string
  | null
  | Date
  | DataArray
  | DataRecord
  | DataTable;
export type DataArray = Array<DataValue>;
export interface DataRecord {
  [key: number | string]: DataValue;
}

export type DataColumns = string[];

export type ColumnsIndexes = Record<string, number>;

export type DataTable = {
  columns: DataColumns;
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
