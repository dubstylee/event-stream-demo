import { useSocket } from "./hooks/useSocket";
import { useKafkaMessages, TOPICS } from "./hooks/useKafkaMessages";
import ConnectionStatus from "./components/ConnectionStatus";

function App() {
  const { connectionStatus, socket } = useSocket();
  const topicState = useKafkaMessages(socket);

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Event Stream Dashboard
          </h1>
          <ConnectionStatus connectionStatus={connectionStatus} />
        </header>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-700 mb-4">
            Socket.io connection and Kafka message hooks are active.
          </p>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Topic Message Counts
            </h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {TOPICS.map((topic) => (
                <div
                  key={topic}
                  className="rounded border border-gray-200 bg-gray-50 p-3"
                >
                  <p className="text-xs font-medium text-gray-500 uppercase">
                    {topic}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {topicState[topic].count}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default App;