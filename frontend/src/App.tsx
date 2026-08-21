import { Chat } from "./components/Chat";
import { VirtueGrid } from "./components/VirtueGrid";

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>13 Virtues</h1>
        <p className="subtitle">A daily practice, after Benjamin Franklin</p>
      </header>
      <VirtueGrid />
      <Chat />
    </div>
  );
}

export default App;
