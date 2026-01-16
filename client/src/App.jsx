import { io } from "socket.io-client";

// Verify socket.io-client is available for import
const socketAvailable = typeof io === "function";

function App() {
  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Event Stream Dashboard
        </h1>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-700">
            Vite + React + Tailwind CSS configured successfully.
          </p>
          <p className="text-gray-600 mt-2">
            socket.io-client:{" "}
            <span
              className={socketAvailable ? "text-green-600" : "text-red-600"}
            >
              {socketAvailable ? "Available" : "Not available"}
            </span>
          </p>
        </div>
      </div>
    </main>
  );
}

export default App;