import { NotebookComposer } from "./components/NotebookComposer";
import "./style.css";

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>GravityPress</h1>
        <span className="header-tagline">Design. Print. Share.</span>
      </header>
      <main className="app-main">
        <NotebookComposer />
      </main>
    </div>
  );
}

export default App;
