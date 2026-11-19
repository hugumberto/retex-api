import { Entity } from '../interfaces/entity.interface';

/**
 * Veículo de recolha. A capacidade é em sacos, a mesma unidade em que o cliente
 * estima o pedido — é o que permite mostrar a ocupação da carrinha ao montar
 * uma rota.
 */
export interface Vehicle extends Entity {
  // Matrícula, guardada em maiúsculas e sem espaços à volta. Única.
  plate: string;
  // Descrição curta ("Carrinha", "Furgão grande").
  name: string;
  capacityBags: number;
  // Veículos inativos deixam de se poder escolher, mas as rotas antigas mantêm-nos.
  active: boolean;
}
