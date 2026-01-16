import { useSocket } from "../hooks/useSocket";
import { useKafkaMessages, TOPICS } from "../hooks/useKafkaMessages";
import ConnectionStatus from "./ConnectionStatus";
import TopicWidget from "./TopicWidget";
import OrderEntryForm from "./OrderEntryForm";
import ProductsNeedingReview from "./ProductsNeedingReview";
import { useToast } from "./ToastContainer";

/**
 * Dashboard provides the main application layout with real-time Kafka message display.
 * Features a two-column responsive layout with order entry form on the left
 * and four topic widgets stacked vertically on the right.
 */
function Dashboard() {
  const { connectionStatus, socket } = useSocket();
  const topicState = useKafkaMessages(socket);
  const { ToastContainer } = useToast();

  return (
    <main className="min-h-screen bg-gray-100">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white px-4 py-4 shadow-sm md:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900 md:text-2xl">
            Event Stream Dashboard
          </h1>
          <ConnectionStatus connectionStatus={connectionStatus} />
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <div className="flex flex-col gap-6 md:flex-row">
          <section
            className="w-full md:w-2/5"
            aria-labelledby="order-section-heading"
          >
            <h2 id="order-section-heading" className="sr-only">
              Order Entry
            </h2>
            <div className="flex flex-col gap-6">
              <OrderEntryForm />
              <ProductsNeedingReview socket={socket} />
            </div>
          </section>

          <section
            className="w-full md:w-3/5"
            aria-labelledby="topics-section-heading"
          >
            <h2 id="topics-section-heading" className="sr-only">
              Kafka Topics
            </h2>
            <div className="flex flex-col gap-4">
              {TOPICS.map((topic) => (
                <TopicWidget
                  key={topic}
                  topicName={topic}
                  messageCount={topicState[topic].count}
                  messages={topicState[topic].messages}
                />
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export default Dashboard;