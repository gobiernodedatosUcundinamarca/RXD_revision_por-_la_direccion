import { InfoDisclosure } from "./InfoDisclosure";

/**
 * Explica las columnas «Cumplidas / Sin cerrar» de la tabla comparativa entre
 * sistemas (vista Consolidado): qué cuenta cada una y cómo se relacionan
 * (Sin cerrar es el complemento de Cumplidas dentro del total).
 */
export function ColumnasComparativoInfo() {
  return (
    <InfoDisclosure resumen="Qué significan estas columnas">
      <table className="data-table">
        <caption className="sr-only">Significado de las columnas Cumplidas y Sin cerrar</caption>
        <thead>
          <tr>
            <th scope="col">Columna</th>
            <th scope="col">Cuenta</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row" className="celda-nombre">
              Cumplidas
            </th>
            <td>OM con calificación vigente = 2 (100 % de avance).</td>
          </tr>
          <tr>
            <th scope="row" className="celda-nombre">
              Sin cerrar
            </th>
            <td>Total de OM menos las cumplidas — sin importar cuánto avance tengan.</td>
          </tr>
        </tbody>
      </table>
    </InfoDisclosure>
  );
}
