import type { SchemaIssue } from "./schema/ecosystem";
import { loadEcosystem } from "./schema/ecosystem";
import { Mapa } from "./components/Mapa";
import raw from "./data/ecosystem.json";

export function App() {
  const loaded = loadEcosystem(raw as unknown);
  if (!loaded.ok) {
    return <ErrorPantalla issues={loaded.issues} />;
  }
  return <Mapa data={loaded.data} />;
}

function ErrorPantalla({ issues }: { issues: SchemaIssue[] }) {
  return (
    <main className="error-pantalla">
      <h1>El ecosistema no se pudo cargar</h1>
      <p>
        <code>src/data/ecosystem.json</code> no cumple el esquema. Nada se dibuja hasta que
        el archivo sea válido.
      </p>
      <ul>
        {issues.map((issue) => (
          <li key={`${issue.path}:${issue.message}`}>
            <code>{issue.path}</code>
            <span>{issue.message}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}
