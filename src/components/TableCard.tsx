import { Database } from "@/types/index.t";
import { useState } from "react";
import AddTableModal from "./modals/AddTableModal";

interface TableCardProps {
  databases: Database[];
  setDatabases: (databases: Database[]) => void;
  selectedDatabase: string | null;
  setSelectedTable: (table: string | null) => void;
}

export default function TableCard({
  databases,
  setDatabases,
  selectedDatabase,
  setSelectedTable,
}: TableCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const selectedDb = databases.find((db) => db.name === selectedDatabase);

  return (
    <div className="bg-white p-4 rounded min-w-80 shadow-2xl w-full md:w-1/2">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Tables</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          disabled={!selectedDatabase}
          className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          Add
        </button>
      </div>
      <hr />
      <ul className="space-y-2">
        {!selectedDatabase ? (
          <li className="text-gray-500">Select a database first.</li>
        ) : selectedDb?.tables.length === 0 ? (
          <li className="text-gray-500">No tables yet.</li>
        ) : (
          selectedDb?.tables.map((table) => (
            <li
              key={table.name}
              className="cursor-pointer hover:bg-gray-100 p-2 rounded"
              onClick={() => setSelectedTable(table.name)}
            >
              {table.name}
            </li>
          ))
        )}
      </ul>
      <AddTableModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        databases={databases}
        setDatabases={setDatabases}
        selectedDatabase={selectedDatabase}
      />
    </div>
  );
}
