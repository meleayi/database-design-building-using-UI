// src/types/index.t.ts
export interface Attribute {
  name: string;
  type:
    | "INT"
    | "BIT"
    | "VARCHAR"
    | "NVARCHAR"
    | "TEXT"
    | "DECIMAL"
    | "FLOAT"
    | "BOOLEAN"
    | "DATE"
    | "DATETIME"
    | "TIMESTAMP";
  isRequired: boolean;
  defaultValue?: string;
  length?: number;
  isPrimaryKey: boolean;
  autoIncrement?: boolean;
  foreignKey?: {
    table: string;
    column: string;
  };
}

export interface Table {
  name: string;
  attributes: Attribute[];
}

export interface Database {
  name: string;
  tables: Table[];
}
