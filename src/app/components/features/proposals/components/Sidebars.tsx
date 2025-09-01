import type { FilialGroup, GlossaryLink } from "../lib/storage";

export function FilialesSidebar({
  isAdmin,
  filiales,
  addFilial,
  editFilialTitle,
  removeFilial,
  addCountry,
  editCountry,
  removeCountry,
}: {
  isAdmin: boolean;
  filiales: FilialGroup[];
  addFilial: () => void;
  editFilialTitle: (id: string) => void;
  removeFilial: (id: string) => void;
  addCountry: (id: string) => void;
  editCountry: (id: string, idx: number) => void;
  removeCountry: (id: string, idx: number) => void;
}) {
  return (
    <div className="card border">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[15px] font-semibold">Filiales y países</h3>
        {isAdmin && (
          <button className="btn-ghost text-xs" onClick={addFilial}>
            + Filial
          </button>
        )}
      </div>

      <div className="space-y-3">
        {filiales.map((f) => (
          <div key={f.id} className="rounded-sm border bg-white">
            <div className="px-3 py-2 flex items-center justify-between border-b bg-primary text-white font-medium text-[14px]">
              <div>{f.title}</div>
              {isAdmin && (
                <div className="flex gap-2">
                  <button className="btn-ghost text-xs text-white" title="Editar" onClick={() => editFilialTitle(f.id)}>✎</button>
                  <button className="btn-ghost text-xs text-white" title="Eliminar" onClick={() => removeFilial(f.id)}>🗑</button>
                </div>
              )}
            </div>
            <ul className="px-3 py-2 text-[13px]">
              {f.countries.map((c, i) => (
                <li key={`${f.id}-${i}`} className="flex items-center justify-between py-1 border-b last:border-b-0">
                  <span>{c}</span>
                  {isAdmin && (
                    <span className="flex gap-2">
                      <button className="btn-ghost text-xs" title="Editar" onClick={() => editCountry(f.id, i)}>✎</button>
                      <button className="btn-ghost text-xs" title="Eliminar" onClick={() => removeCountry(f.id, i)}>🗑</button>
                    </span>
                  )}
                </li>
              ))}
              {f.countries.length === 0 && <li className="py-1 text-gray-500">Sin países</li>}
            </ul>
            {isAdmin && (
              <div className="px-3 pb-2">
                <button className="btn-ghost text-xs" onClick={() => addCountry(f.id)}>+ País</button>
              </div>
            )}
          </div>
        ))}
        {filiales.length === 0 && <div className="text-gray-500 text-sm">Sin datos.</div>}
      </div>
    </div>
  );
}

export function GlossarySidebar({
  isAdmin,
  glossary,
  addLink,
  editLink,
  removeLink,
}: {
  isAdmin: boolean;
  glossary: GlossaryLink[];
  addLink: () => void;
  editLink: (id: string) => void;
  removeLink: (id: string) => void;
}) {
  return (
    <div className="card border">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[15px] font-semibold">Glosario</h3>
        {isAdmin && (
          <button className="btn-ghost text-xs" onClick={addLink}>
            + Enlace
          </button>
        )}
      </div>

      <div className="rounded-sm border overflow-hidden">
        <table className="min-w-full bg-white">
          <thead>
            <tr className="bg-primary text-white">
              <th className="table-th">Título</th>
              <th className="table-th">URL</th>
              {isAdmin && <th className="table-th w-20 text-center">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {glossary.map((g) => (
              <tr key={g.id}>
                <td className="table-td">{g.label}</td>
                <td className="table-td">
                  <a className="link" href={g.url} target="_blank" rel="noreferrer">
                    {g.url}
                  </a>
                </td>
                {isAdmin && (
                  <td className="table-td text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button className="btn-ghost text-xs" title="Editar" onClick={() => editLink(g.id)}>✎</button>
                      <button className="btn-ghost text-xs" title="Eliminar" onClick={() => removeLink(g.id)}>🗑</button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {glossary.length === 0 && (
              <tr>
                <td className="table-td text-center text-gray-500" colSpan={isAdmin ? 3 : 2}>
                  Sin enlaces.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
