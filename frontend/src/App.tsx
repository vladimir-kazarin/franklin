import { useState } from "react";
import { VirtueGrid } from "./components/VirtueGrid";
import { AboutModal } from "./components/AboutModal";

function App() {
  const [aboutOpen, setAboutOpen] = useState(false);

  return (
    <div className="app">
      <header className="app-header">
        <h1>13 Virtues</h1>
        <p className="subtitle">A daily practice, after Benjamin Franklin</p>
      </header>
      <VirtueGrid />
      {aboutOpen && <AboutModal onClose={() => setAboutOpen(false)} />}
      <footer className="app-footer">
        <button className="about-link" onClick={() => setAboutOpen(true)}>
          About
        </button>{" "}
        | Developed by{" "}
        <a href="https://vladcodes.com" target="_blank" rel="noopener noreferrer">
          Vladimir Kazarin
        </a>
      </footer>
    </div>
  );
}

export default App;
