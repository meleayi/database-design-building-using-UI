// src/components/modals/AttributeModal.tsx
import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useEffect, useMemo } from "react";
import { useForm, SubmitHandler } from "react-hook-form"; // Import SubmitHandler
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Attribute, Database } from "@/types/index.t";

// Supported SQL data types (matches index.t.ts)
const DATA_TYPES = [
  "INT",
  "BIT",
  "VARCHAR",
  "NVARCHAR",
  "TEXT",
  "DECIMAL",
  "FLOAT",
  "BOOLEAN",
  "DATE",
  "DATETIME",
  "TIMESTAMP",
] as const;

// Zod schema for Attribute validation
const schema = z
  .object({
    name: z
      .string()
      .min(1, "Attribute name is required")
      .regex(
        /^[a-zA-Z_][a-zA-Z0-9_]*$/,
        "Must start with letter or underscore, only alphanumeric characters allowed"
      ),
    type: z.enum(DATA_TYPES, { message: "Invalid data type" }),
    length: z.number().int().min(1).max(4000).optional(),
    isRequired: z.boolean().default(false),
    isPrimaryKey: z.boolean().default(false),
    autoIncrement: z.boolean().default(false),
    defaultValue: z.string().optional(),
    isForeignKey: z.boolean().default(false),
    foreignKeyTable: z.string().optional(),
    foreignKeyColumn: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if ((data.type === "VARCHAR" || data.type === "NVARCHAR") && !data.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Length is required for VARCHAR/NVARCHAR",
        path: ["length"],
      });
    }
    if (data.autoIncrement && data.type !== "INT") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Auto-increment is only available for INT type",
        path: ["autoIncrement"],
      });
    }
    if (data.defaultValue) {
      switch (data.type) {
        case "INT":
        case "DECIMAL":
        case "FLOAT":
          if (isNaN(Number(data.defaultValue))) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Default value must be a number for ${data.type}`,
              path: ["defaultValue"],
            });
          }
          break;
        case "VARCHAR":
        case "NVARCHAR":
        case "TEXT":
          if (typeof data.defaultValue !== "string") {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Default value must be a string for ${data.type}`,
              path: ["defaultValue"],
            });
          }
          break;
        case "DATE":
        case "DATETIME":
        case "TIMESTAMP":
          if (
            data.defaultValue.toUpperCase() !== "GETDATE()" &&
            isNaN(Date.parse(data.defaultValue))
          ) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Default value must be a valid date or GETDATE() for ${data.type}`,
              path: ["defaultValue"],
            });
          }
          break;
        case "BIT":
        case "BOOLEAN":
          if (
            !["0", "1", "true", "false", ""].includes(
              data.defaultValue.toLowerCase()
            )
          ) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Default value must be 0, 1, true, or false for ${data.type}`,
              path: ["defaultValue"],
            });
          }
          break;
      }
    }
    if (data.isForeignKey) {
      if (!data.foreignKeyTable) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Reference table is required for foreign key",
          path: ["foreignKeyTable"],
        });
      }
      if (!data.foreignKeyColumn) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Reference column is required for foreign key",
          path: ["foreignKeyColumn"],
        });
      }
    }
  });

type FormData = z.infer<typeof schema>;

interface AttributeModalProps {
  isOpen: boolean;
  onClose: () => void;
  databases: Database[];
  setDatabases: (databases: Database[]) => void;
  selectedDatabase: string | null;
  selectedTable: string | null;
  isEdit: boolean;
  editIndex?: number | null;
}

export default function AttributeModal({
  isOpen,
  onClose,
  databases,
  setDatabases,
  selectedDatabase,
  selectedTable,
  isEdit,
  editIndex,
}: AttributeModalProps) {
  const selectedDb = databases.find((db) => db.name === selectedDatabase);
  const selectedTbl = selectedDb?.tables.find(
    (tbl) => tbl.name === selectedTable
  );

  const defaultValues = useMemo((): FormData => {
    if (
      isEdit &&
      editIndex !== undefined &&
      editIndex !== null &&
      selectedTbl?.attributes[editIndex]
    ) {
      const attr = selectedTbl.attributes[editIndex];
      return {
        name: attr.name,
        type: attr.type,
        length: attr.length,
        isRequired: attr.isRequired ?? false,
        isPrimaryKey: attr.isPrimaryKey ?? false,
        autoIncrement: attr.autoIncrement ?? false,
        defaultValue: attr.defaultValue ?? "",
        isForeignKey: !!attr.foreignKey,
        foreignKeyTable: attr.foreignKey?.table ?? "",
        foreignKeyColumn: attr.foreignKey?.column ?? "",
      };
    }
    return {
      name: "",
      type: "INT" as const,
      length: undefined,
      isRequired: false,
      isPrimaryKey: false,
      autoIncrement: false,
      defaultValue: "",
      isForeignKey: false,
      foreignKeyTable: "",
      foreignKeyColumn: "",
    };
  }, [isEdit, editIndex, selectedTbl]);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  useEffect(() => {
    if (isOpen) {
      reset(defaultValues);
    }
  }, [isOpen, defaultValues, reset]);

  const selectedType = watch("type");
  const isPrimaryKey = watch("isPrimaryKey");
  const isForeignKey = watch("isForeignKey");
  const foreignKeyTable = watch("foreignKeyTable"); // For type guarding

  const onSubmit: SubmitHandler<FormData> = (data) => {
    const attribute: Attribute = {
      name: data.name,
      type: data.type,
      isRequired: data.isRequired,
      defaultValue: data.defaultValue || "",
      length:
        data.type === "VARCHAR" || data.type === "NVARCHAR"
          ? data.length
          : undefined,
      isPrimaryKey: data.isPrimaryKey,
      autoIncrement: data.autoIncrement,
      foreignKey:
        data.isForeignKey && data.foreignKeyTable && data.foreignKeyColumn
          ? { table: data.foreignKeyTable, column: data.foreignKeyColumn }
          : undefined,
    };

    const updatedDatabases = [...databases];
    const dbIndex = databases.findIndex((db) => db.name === selectedDatabase);
    const tblIndex = updatedDatabases[dbIndex].tables.findIndex(
      (tbl) => tbl.name === selectedTable
    );

    if (isEdit && editIndex !== null && editIndex !== undefined) {
      updatedDatabases[dbIndex].tables[tblIndex].attributes[editIndex] =
        attribute;
    } else {
      updatedDatabases[dbIndex].tables[tblIndex].attributes.push(attribute);
    }

    setDatabases(updatedDatabases);
    reset();
    onClose();
  };

  const getForeignKeyTables = () =>
    selectedDb?.tables.filter((table) => table.name !== selectedTable) || [];

  const getForeignKeyColumns = (tableName: string) => {
    const table = selectedDb?.tables.find((t) => t.name === tableName);
    return table?.attributes || [];
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md bg-white p-6 rounded shadow">
                <Dialog.Title className="text-lg font-semibold mb-4">
                  {isEdit ? "Edit Attribute" : "Add Attribute"} for{" "}
                  {selectedTable}
                </Dialog.Title>
                <form onSubmit={handleSubmit(onSubmit)}>
                  <div className="space-y-4">
                    <div>
                      <label className="block mb-1">Attribute Name</label>
                      <input
                        {...register("name")}
                        className="w-full p-2 border rounded"
                        placeholder="e.g., user_id"
                      />
                      {errors.name && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.name.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block mb-1">Data Type</label>
                      <select
                        {...register("type")}
                        className="w-full p-2 border rounded"
                      >
                        {DATA_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                      {errors.type && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.type.message}
                        </p>
                      )}
                    </div>

                    {(selectedType === "VARCHAR" ||
                      selectedType === "NVARCHAR") && (
                      <div>
                        <label className="block mb-1">Length (1-4000)</label>
                        <input
                          type="number"
                          {...register("length", { valueAsNumber: true })}
                          className="w-full p-2 border rounded"
                          min="1"
                          max="4000"
                          defaultValue={255}
                        />
                        {errors.length && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.length.message}
                          </p>
                        )}
                      </div>
                    )}

                    <div>
                      <label className="block mb-1">Default Value</label>
                      <input
                        {...register("defaultValue")}
                        className="w-full p-2 border rounded"
                        placeholder={
                          ["DATE", "DATETIME", "TIMESTAMP"].includes(
                            selectedType
                          )
                            ? "e.g., GETDATE()"
                            : selectedType === "BIT" ||
                              selectedType === "BOOLEAN"
                            ? "0, 1, true, or false"
                            : "Enter default value"
                        }
                      />
                      {errors.defaultValue && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.defaultValue.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="block mb-1">Constraints</label>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="isRequired"
                          {...register("isRequired")}
                          className="mr-2"
                        />
                        <label htmlFor="isRequired">Required (NOT NULL)</label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="isPrimaryKey"
                          {...register("isPrimaryKey")}
                          className="mr-2"
                        />
                        <label htmlFor="isPrimaryKey">Primary Key</label>
                      </div>
                      {isPrimaryKey && selectedType === "INT" && (
                        <div className="flex items-center ml-4">
                          <input
                            type="checkbox"
                            id="autoIncrement"
                            {...register("autoIncrement")}
                            className="mr-2"
                          />
                          <label htmlFor="autoIncrement">Auto Increment</label>
                        </div>
                      )}
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="isForeignKey"
                          {...register("isForeignKey")}
                          className="mr-2"
                        />
                        <label htmlFor="isForeignKey">Foreign Key</label>
                      </div>
                      {isForeignKey && (
                        <div className="ml-4 space-y-2">
                          <div>
                            <label className="block mb-1">
                              Reference Table
                            </label>
                            <select
                              {...register("foreignKeyTable")}
                              className="w-full p-2 border rounded"
                            >
                              <option value="">Select table</option>
                              {getForeignKeyTables().map((table) => (
                                <option key={table.name} value={table.name}>
                                  {table.name}
                                </option>
                              ))}
                            </select>
                            {errors.foreignKeyTable && (
                              <p className="text-red-500 text-sm mt-1">
                                {errors.foreignKeyTable.message}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="block mb-1">
                              Reference Column
                            </label>
                            <select
                              {...register("foreignKeyColumn")}
                              className="w-full p-2 border rounded"
                              disabled={!foreignKeyTable} // Updated to use variable
                            >
                              <option value="">Select column</option>
                              {foreignKeyTable && // Type guard
                                getForeignKeyColumns(foreignKeyTable).map(
                                  (attr) => (
                                    <option key={attr.name} value={attr.name}>
                                      {attr.name} ({attr.type})
                                    </option>
                                  )
                                )}
                            </select>
                            {errors.foreignKeyColumn && (
                              <p className="text-red-500 text-sm mt-1">
                                {errors.foreignKeyColumn.message}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 mt-6">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      {isEdit ? "Update Attribute" : "Add Attribute"}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
