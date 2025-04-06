// src/components/AttributesCard.tsx
"use client";

import { useState } from "react";
import { Database } from "@/types/index.t";
import AttributeModal from "./modals/AttributeModal";
import ConfirmDeleteModal from "./modals/ConfirmDeleteModal";

interface AttributesCardProps {
  databases: Database[];
  setDatabases: (databases: Database[]) => void;
  selectedDatabase: string | null;
  setSelectedDatabase: (db: string | null) => void;
  selectedTable: string | null;
  setSelectedTable: (table: string | null) => void;
}

export default function AttributesCard({
  databases,
  setDatabases,
  selectedDatabase,
  setSelectedDatabase,
  selectedTable,
  setSelectedTable,
}: AttributesCardProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editAttributeIndex, setEditAttributeIndex] = useState<number | null>(
    null
  );
  const [deleteAttributeIndex, setDeleteAttributeIndex] = useState<
    number | null
  >(null);

  const selectedDb = databases.find((db) => db.name === selectedDatabase);
  const selectedTbl = selectedDb?.tables.find(
    (tbl) => tbl.name === selectedTable
  );

  const handleDelete = () => {
    if (selectedDatabase && selectedTable && deleteAttributeIndex !== null) {
      const updatedDatabases = [...databases];
      const dbIndex = databases.findIndex((db) => db.name === selectedDatabase);
      const tblIndex = updatedDatabases[dbIndex].tables.findIndex(
        (tbl) => tbl.name === selectedTable
      );
      updatedDatabases[dbIndex].tables[tblIndex].attributes.splice(
        deleteAttributeIndex,
        1
      );
      setDatabases(updatedDatabases);
      setIsDeleteModalOpen(false);
      setDeleteAttributeIndex(null);
    }
  };

  return (
    <div className="bg-white p-4 rounded shadow flex flex-col w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Attributes</h2>
        <button
          onClick={() => setIsAddModalOpen(true)}
          disabled={!selectedTable}
          className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          Add Attribute
        </button>
      </div>

      <div className="flex gap-2 flex-col">
        <div className="flex gap-2 flex-row w-full">
          <div className="mb-4 w-1/2">
            <label className="block mb-1 font-medium">Database</label>
            <select
              value={selectedDatabase || ""}
              onChange={(e) => {
                setSelectedDatabase(e.target.value || null);
                setSelectedTable(null);
              }}
              className="w-full p-2 border rounded"
            >
              <option value="">Select Database</option>
              {databases.map((db) => (
                <option key={db.name} value={db.name}>
                  {db.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4 w-1/2">
            <label className="block mb-1 font-medium">Table</label>
            <select
              value={selectedTable || ""}
              onChange={(e) => setSelectedTable(e.target.value || null)}
              disabled={!selectedDatabase}
              className="w-full p-2 border rounded"
            >
              <option value="">Select Table</option>
              {selectedDb?.tables.map((tbl) => (
                <option key={tbl.name} value={tbl.name}>
                  {tbl.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <h3 className="text-md font-semibold mb-2">Attributes</h3>
          <ul className="space-y-2">
            {!selectedTable ? (
              <li className="text-gray-500">Select a table first.</li>
            ) : selectedTbl?.attributes.length === 0 ? (
              <li className="text-gray-500">No attributes yet.</li>
            ) : (
              selectedTbl?.attributes.map((attr, index) => (
                <li
                  key={index}
                  className="flex justify-between items-center p-2 bg-gray-50 rounded"
                >
                  <span>
                    {attr.name} ({attr.type}
                    {attr.length ? `(${attr.length})` : ""}
                    {attr.isRequired ? ", Required" : ""}
                    {attr.isPrimaryKey ? ", PK" : ""}
                    {attr.autoIncrement ? ", AutoInc" : ""}
                    {attr.foreignKey
                      ? `, FK: ${attr.foreignKey.table}.${attr.foreignKey.column}`
                      : ""}
                    {attr.defaultValue ? `, Default: ${attr.defaultValue}` : ""}
                    )
                  </span>
                  <div>
                    <button
                      onClick={() => {
                        setEditAttributeIndex(index);
                        setIsEditModalOpen(true);
                      }}
                      className="text-blue-500 hover:underline mr-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        setDeleteAttributeIndex(index);
                        setIsDeleteModalOpen(true);
                      }}
                      className="text-red-500 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      <AttributeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        databases={databases}
        setDatabases={setDatabases}
        selectedDatabase={selectedDatabase}
        selectedTable={selectedTable}
        isEdit={false}
      />
      <AttributeModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditAttributeIndex(null);
        }}
        databases={databases}
        setDatabases={setDatabases}
        selectedDatabase={selectedDatabase}
        selectedTable={selectedTable}
        isEdit={true}
        editIndex={editAttributeIndex}
      />
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
