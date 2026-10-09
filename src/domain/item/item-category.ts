import { Type } from "./item.entity"

/**
 * Categoria da peça registada na triagem.
 *
 * Conjuntos de duas partes (fatos, pijamas, roupa desportiva, biquínis, roupa
 * interior) são separados: cada parte é registada como uma peça, para cair no
 * lote certo (Superior / Inferior).
 */
export enum Category {
  // Superior
  TOP = "TOP", // T-shirts, polos, camisas, tops, blusas
  SWEATER = "SWEATER", // Camisolas (sweatshirts, malhas)
  COAT = "COAT", // Casacos (blusões, parkas)
  DRESS = "DRESS", // Vestidos
  SUIT_JACKET = "SUIT_JACKET", // Fato: casaco / blazer
  PAJAMA_TOP = "PAJAMA_TOP",
  SPORTSWEAR_TOP = "SPORTSWEAR_TOP",
  BRA = "BRA", // Roupa interior: sutiã
  UNDERSHIRT = "UNDERSHIRT", // Roupa interior: camisola interior
  SWIM_TOP = "SWIM_TOP", // Parte de cima do biquíni
  SWIMSUIT = "SWIMSUIT", // Fato de banho inteiro

  // Inferior
  TROUSERS = "TROUSERS", // Calças (jeans, chino, leggings)
  SHORTS = "SHORTS", // Calções
  SKIRT = "SKIRT", // Saias
  JUMPSUIT = "JUMPSUIT", // Macacões
  SUIT_TROUSERS = "SUIT_TROUSERS", // Fato: calça
  PAJAMA_BOTTOM = "PAJAMA_BOTTOM",
  SPORTSWEAR_BOTTOM = "SPORTSWEAR_BOTTOM",
  UNDERPANTS = "UNDERPANTS", // Roupa interior: cuecas, boxers
  SWIM_BOTTOM = "SWIM_BOTTOM", // Parte de baixo do biquíni, calções de banho
}

// Lote (Superior / Inferior) de cada categoria.
export const CATEGORY_PART: Record<Category, Type> = {
  [Category.TOP]: Type.UPPER_PART,
  [Category.SWEATER]: Type.UPPER_PART,
  [Category.COAT]: Type.UPPER_PART,
  [Category.DRESS]: Type.UPPER_PART,
  [Category.SUIT_JACKET]: Type.UPPER_PART,
  [Category.PAJAMA_TOP]: Type.UPPER_PART,
  [Category.SPORTSWEAR_TOP]: Type.UPPER_PART,
  [Category.BRA]: Type.UPPER_PART,
  [Category.UNDERSHIRT]: Type.UPPER_PART,
  [Category.SWIM_TOP]: Type.UPPER_PART,
  [Category.SWIMSUIT]: Type.UPPER_PART,

  [Category.TROUSERS]: Type.UNDER_PART,
  [Category.SHORTS]: Type.UNDER_PART,
  [Category.SKIRT]: Type.UNDER_PART,
  [Category.JUMPSUIT]: Type.UNDER_PART,
  [Category.SUIT_TROUSERS]: Type.UNDER_PART,
  [Category.PAJAMA_BOTTOM]: Type.UNDER_PART,
  [Category.SPORTSWEAR_BOTTOM]: Type.UNDER_PART,
  [Category.UNDERPANTS]: Type.UNDER_PART,
  [Category.SWIM_BOTTOM]: Type.UNDER_PART,
}
