/**
 * Magic Royale - Deck & Card Configuration
 *
 * Define as estruturas de dados para decks de jogadores.
 * Decks são persistidos no banco de dados e validados pelo servidor.
 *
 * @module core/types/deck
 */
/**
 * Códigos de erro de validação.
 */
export var ValidationErrorCode;
(function (ValidationErrorCode) {
    /** Unidade não existe no catálogo */
    ValidationErrorCode["UNIT_NOT_FOUND"] = "UNIT_NOT_FOUND";
    /** Item não existe no catálogo */
    ValidationErrorCode["ITEM_NOT_FOUND"] = "ITEM_NOT_FOUND";
    /** Jogador não possui a unidade */
    ValidationErrorCode["UNIT_NOT_OWNED"] = "UNIT_NOT_OWNED";
    /** Jogador não possui o item */
    ValidationErrorCode["ITEM_NOT_OWNED"] = "ITEM_NOT_OWNED";
    /** Unidade não tem o slot requerido pelo item */
    ValidationErrorCode["INVALID_SLOT"] = "INVALID_SLOT";
    /** Item requer tag que a unidade não possui */
    ValidationErrorCode["MISSING_REQUIRED_TAG"] = "MISSING_REQUIRED_TAG";
    /** Item é proibido para unidades com certa tag */
    ValidationErrorCode["FORBIDDEN_TAG_CONFLICT"] = "FORBIDDEN_TAG_CONFLICT";
    /** Deck vazio ou incompleto */
    ValidationErrorCode["EMPTY_DECK"] = "EMPTY_DECK";
    /** Slot duplicado (dois itens no mesmo slot) */
    ValidationErrorCode["DUPLICATE_SLOT"] = "DUPLICATE_SLOT";
})(ValidationErrorCode || (ValidationErrorCode = {}));
//# sourceMappingURL=deck.js.map