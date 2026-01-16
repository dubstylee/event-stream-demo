import Dashboard from "./components/Dashboard";
import { ToastProvider } from "./components/ToastContainer";

function App() {
  return (
    <ToastProvider>
      <Dashboard />
    </ToastProvider>
  );
}

export default App;