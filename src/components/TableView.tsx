import type { Snapshot } from "../App";
import { productionToString } from "../utils";

const TableView = ({ parserHistory }: { parserHistory: Snapshot[] }) => {
  return (
    <div className="overflow-x-auto rounded-lg shadow-md w-1/2">
      <table className="min-w-full divide-y divide-gray-200 bg-white">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
            >
              Stack
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
            >
              Buffer
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
            >
              Action
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
            >
              Detail
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {parserHistory.map((snapshot, index) => (
            <tr key={index}>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                {snapshot.stack.reduce((acc, v) => acc + v.name, "")}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                {snapshot.buffer}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                {snapshot.action}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                {snapshot.production
                  ? productionToString(snapshot.production)
                  : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TableView;
