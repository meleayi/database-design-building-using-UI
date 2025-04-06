import { useState } from "react";
import AddDatabaseModal from "./modals/AddDatabaseModal";
import { Database } from "@/types/index.t";

interface DatabaseCardProps {
  databases: Database[];
  setDatabases: (databases: Database[]) => void;
  setSelectedDatabase: (db: string | null) => void;
}

export default function DatabaseCard({
  databases,
  setDatabases,
  setSelectedDatabase,
}: DatabaseCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="bg-white p-4 rounded min-w-80 shadow-2xl text-center items-center justify-center  w-full md:w-1/2">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Databases</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
        >
          Add
        </button>
      </div>
      <hr />
      <ul className="space-y-2">
        {databases.length === 0 ? (
          <li className="text-gray-500">No databases yet.</li>
        ) : (
          databases.map((db) => (
            <li
              key={db.name}
              className="cursor-pointer hover:bg-gray-100 p-2 rounded divide-dotted "
              onClick={() => setSelectedDatabase(db.name)}
            >
              {db.name}
            </li>
          ))
        )}
      </ul>
      <AddDatabaseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        databases={databases}
        setDatabases={setDatabases}
      />
    </div>
  );
}
