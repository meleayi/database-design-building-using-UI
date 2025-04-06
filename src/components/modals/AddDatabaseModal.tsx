import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {Database} from "@/types/index.t"


const schema = z.object({
  name: z
    .string()
    .min(1, "Database name is required")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Only alphanumeric characters and underscores allowed"
    ),
});

type FormData = z.infer<typeof schema>;

interface AddDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  databases: Database[];
  setDatabases: (databases: Database[]) => void;
}

export default function AddDatabaseModal({
  isOpen,
  onClose,
  databases,
  setDatabases,
}: AddDatabaseModalProps) {

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: FormData) => {

    
    if (databases.some((db) => db.name === data.name)) {
      alert("Database name must be unique.");
      return;
    }
    setDatabases([...databases, { name: data.name, tables: [] }]);
    reset();
    onClose();
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
                  Add Database
                </Dialog.Title>
                <form onSubmit={handleSubmit(onSubmit)}>
                  <div className="mb-4">
                    <label className="block mb-1">Database Name</label>
                    <input
                      {...register("name")}
                      className="w-full p-2 border rounded"
                      placeholder="e.g., MyAppDB"
                    />
                    {errors.name && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.name.message}
                      </p>
                    )}
                  </div>
                  <div className="flex justify-end gap-2">
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
                      Save
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
