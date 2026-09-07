import type { Campana } from "../schema/ecosystem";
import type { ResultadoRuteo } from "../engine/router";

type Intencion = "VENTAS" | "SAC";
type Dominio = "sac" | "onboarding";

export type RespuestasSim = {
  esperaRespuesta: boolean;
  permanenciaDias: number;
  esPartner: boolean;
  descripcion: string;
};

type Props = {
  intro: string;
  campanas: Campana[];
  campaignId: string | null;
  respuestas: RespuestasSim;
  intencion: Intencion;
  dominio: Dominio;
  resultado: ResultadoRuteo | null;
  onCampaign: (id: string | null) => void;
  onEspera: (value: boolean) => void;
  onPermanencia: (value: number) => void;
  onPartner: (value: boolean) => void;
  onDescripcion: (value: string) => void;
  onIntencion: (value: Intencion) => void;
  onDominio: (value: Dominio) => void;
  onExecute: () => void;
  onReset: () => void;
};

export function PanelSimulacion({
  intro,
  campanas,
  campaignId,
  respuestas,
  intencion,
  dominio,
  resultado,
  onCampaign,
  onEspera,
  onPermanencia,
  onPartner,
  onDescripcion,
  onIntencion,
  onDominio,
  onExecute,
  onReset,
}: Props) {
  const campana = campaignId
    ? campanas.find((item) => item.id === campaignId)
    : undefined;
  if (campaignId && !campana) {
    throw new Error(`No existe la campaña ${campaignId} en ecosystem.json`);
  }
  const showRegistro = respuestas.esperaRespuesta;
  const showTipificado = intencion === "SAC" && showRegistro;

  return (
    <aside className="panel-sim" aria-label="Simulación del embudo">
      <p className="kicker">Embudo</p>
      <p className="intro">{intro}</p>

      <fieldset>
        <legend>Campaña</legend>
        <label>
          <input
            type="radio"
            name="campana"
            checked={campaignId === null}
            onChange={() => onCampaign(null)}
          />
          Sin campaña
        </label>
        {campanas.map((item) => (
          <label key={item.id}>
            <input
              type="radio"
              name="campana"
              checked={campaignId === item.id}
              onChange={() => onCampaign(item.id)}
            />
            {item.nombre}
          </label>
        ))}
      </fieldset>

      <fieldset>
        <legend>¿Esperas respuesta del cliente?</legend>
        <label>
          <input
            type="radio"
            name="espera"
            checked={respuestas.esperaRespuesta}
            onChange={() => onEspera(true)}
          />
          Sí
        </label>
        <label>
          <input
            type="radio"
            name="espera"
            checked={!respuestas.esperaRespuesta}
            onChange={() => onEspera(false)}
          />
          No
        </label>
      </fieldset>

      {showRegistro ? (
        <>
          <fieldset>
            <legend>Tiempo de permanencia (en días)</legend>
            <label className="campo">
              <input
                type="number"
                min={0}
                step={1}
                value={respuestas.permanenciaDias}
                onChange={(event) => {
                  const next = Number(event.target.value);
                  onPermanencia(Number.isFinite(next) ? next : 0);
                }}
              />
            </label>
          </fieldset>
          <fieldset>
            <legend>Descripción campaña</legend>
            <label className="campo">
              <textarea
                rows={3}
                value={respuestas.descripcion}
                onChange={(event) => onDescripcion(event.target.value)}
              />
            </label>
          </fieldset>
          <fieldset>
            <legend>¿Es Partner?</legend>
            <label>
              <input
                type="radio"
                name="partner"
                checked={respuestas.esPartner}
                onChange={() => onPartner(true)}
              />
              Sí
            </label>
            <label>
              <input
                type="radio"
                name="partner"
                checked={!respuestas.esPartner}
                onChange={() => onPartner(false)}
              />
              No
            </label>
          </fieldset>
        </>
      ) : (
        <p className="nota">No se registra el teléfono. No pasa nada.</p>
      )}

      <fieldset>
        <legend>Intención</legend>
        <label>
          <input
            type="radio"
            name="intencion"
            checked={intencion === "VENTAS"}
            onChange={() => onIntencion("VENTAS")}
          />
          Ventas
        </label>
        <label>
          <input
            type="radio"
            name="intencion"
            checked={intencion === "SAC"}
            onChange={() => onIntencion("SAC")}
          />
          Servicio al cliente
        </label>
      </fieldset>

      {showTipificado ? (
        <fieldset>
          <legend>Tipificado</legend>
          <label>
            <input
              type="radio"
              name="tipificado"
              checked={dominio === "sac"}
              onChange={() => onDominio("sac")}
            />
            SAC
          </label>
          <label>
            <input
              type="radio"
              name="tipificado"
              checked={dominio === "onboarding"}
              onChange={() => onDominio("onboarding")}
            />
            ONB
          </label>
        </fieldset>
      ) : null}

      <div className="acciones">
        <button type="button" onClick={onExecute}>
          Ejecutar
        </button>
        <button type="button" onClick={onReset}>
          Reiniciar
        </button>
      </div>

      {resultado ? (
        <div className="resultado">
          <p className="kicker">Ruta</p>
          <p>{resultado.explicacion}</p>
          <p className="mono">{resultado.motivo}</p>
        </div>
      ) : null}
    </aside>
  );
}

export type { Intencion, Dominio };
