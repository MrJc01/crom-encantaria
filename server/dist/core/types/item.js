/**
 * Magic Royale - Item/Equipment Interface
 *
 * Define a estrutura de um item equipável.
 * Itens modificam as estatísticas das unidades e têm regras de afinidade.
 *
 * @module core/types/item
 */
/**
 * Verifica se um item tem requisitos de tags permitidas.
 */
export function itemHasAllowedTagRequirement(item) {
    return item.requirements.allowedTags.length > 0;
}
/**
 * Verifica se uma tag está na lista de proibidas do item.
 */
export function isTagForbiddenByItem(item, tag) {
    return item.requirements.forbiddenTags.includes(tag);
}
//# sourceMappingURL=item.js.map