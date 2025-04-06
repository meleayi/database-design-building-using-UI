"use client";

import { useState } from "react";
import DatabaseCard from "../components/DatabaseCard";
import TableCard from "../components/TableCard";
import AttributesCard from "../components/AttributesCard";
import { Attribute, Database } from "@/types/index.t";

export default function Home() {
  const [databases, setDatabases] = useState<Database[]>([]);
  const [selectedDatabase, setSelectedDatabase] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);

  const [attributes, setAttributes] = useState<Attribute[]>([]);
  // const [selectedDatabase, setSelectedDatabase] = useState<string | null>(null);

  const handlePublish = async () => {
    if (databases.length === 0) {
      alert("No databases to publish.");
      return;
    }
    try {
      const response = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ databases }),
      });
      if (response.ok) {
        alert("Database structure published to SQL Server successfully!");
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      alert("Failed to publish: " + error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Database Structure Builder
      </h1>
      <div className="max-w-5xl mx-auto flex gap-4 flex-col">
        <div className="flex gap-2 flex-col md:flex-row w-full">
          <DatabaseCard
            databases={databases}
            setDatabases={setDatabases}
            setSelectedDatabase={setSelectedDatabase}
          />
          <TableCard
            databases={databases}
            setDatabases={setDatabases}
            selectedDatabase={selectedDatabase}
            setSelectedTable={setSelectedTable}
          />
        </div>
        <div>
          <AttributesCard
            databases={databases}
            setDatabases={setDatabases}
            selectedDatabase={selectedDatabase}
            setSelectedDatabase={setSelectedDatabase}
            selectedTable={selectedTable}
            setSelectedTable={setSelectedTable}
          />
        </div>
      </div>
      <div className="mt-6 max-w-5xl mx-auto flex justify-end">
        <button
          onClick={handlePublish}
          className="bg-purple-500 text-white px-6 py-2 rounded hover:bg-purple-600"
        >
          Publish to SQL Server
        </button>
      </div>
    </div>
  );
}
