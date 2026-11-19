import { Entity } from "../interfaces/entity.interface"

export interface SystemParameter extends Entity {
  // Dias antes da coleta em que o cliente ainda pode confirmar.
  collectionConfirmationDeadlineDays: number
  // Percentual extra (threshold) de QR codes gerados sobre os volumes informados.
  qrCodeThresholdPercentage: number
  // Etiqueta de saco, em milímetros. O rolo de etiquetas muda com a compra, e
  // até agora a medida estava fixa no CSS de impressão do portal.
  labelWidthMm: number
  labelHeightMm: number
  // Lado do QR impresso. É o que decide se a câmara o consegue ler, por isso
  // fica separado do tamanho da etiqueta em vez de ser deduzido dele.
  labelQrSizeMm: number
  /**
   * Rotação do conteúdo dentro da etiqueta, em graus (0, 90, 180, 270).
   *
   * A cabeça térmica imprime na direção em que o rolo avança, e essa direção
   * depende do modelo e de como o rolo é carregado. Não há forma de a deduzir
   * a partir do browser, por isso é configurável em vez de assumida.
   */
  labelRotationDeg: number
  /**
   * Armazém: ponto de partida e de chegada das rotas. As coordenadas vêm da
   * morada (geocodificada no portal) e servem para calcular km e horas no
   * painel "Nova rota". Nulos enquanto ninguém os definir.
   */
  warehouseAddress?: string | null
  warehouseLat?: number | null
  warehouseLong?: number | null
  /**
   * Tempo de cada recolha, além da condução: uma parte fixa e uma parte por
   * saco estimado. Usado só para prever a hora de cada paragem.
   */
  stopBaseMinutes: number
  stopMinutesPerBag: number
  /** Capacidade de cada zona do armazém, em kg (A por triar, B reutilização, C upcycling, D reciclagem). */
  zoneSortingCapacityKg: number
  zoneReuseCapacityKg: number
  zoneUpcyclingCapacityKg: number
  zoneRecyclingCapacityKg: number
}
