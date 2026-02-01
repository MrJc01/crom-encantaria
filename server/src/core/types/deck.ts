/**
 * Magic Royale - Deck & Card Configuration
 * 
 * Define as estruturas de dados para decks de jogadores.
 * Decks são persistidos no banco de dados e validados pelo servidor.
 * 
 * @module core/types/deck
 */

/**
 * Configuração de uma carta individual no deck.
 * 
 * Uma carta = Unidade Base + Lista de Itens Equipados
 */
export interface CardConfig {
    /** Posição da carta no deck (0-7) */
    slotIndex: number;
    /** ID da unidade base do catálogo */
    baseUnitId: string;
    /** Lista de IDs dos itens equipados */
    equippedItems: string[];
}

/**
 * Deck completo de um jogador (persistido no BD).
 * 
 * Um deck contém até 8 cartas customizadas.
 */
export interface PlayerDeck {
    /** ID único do deck */
    deckId: string;
    /** ID do jogador dono do deck */
    playerId: string;
    /** Nome do deck (ex: "Rush de Fogo") */
    deckName: string;
    /** Lista de cartas (máximo 8) */
    cards: CardConfig[];
    /** Data de criação */
    createdAt: Date;
    /** Data da última atualização */
    updatedAt: Date;
}

/**
 * Inventário do jogador (o que ele possui).
 * Usado para validar se o jogador pode usar certas unidades/itens.
 */
export interface PlayerInventory {
    /** ID do jogador */
    playerId: string;
    /** IDs das unidades desbloqueadas */
    unlockedUnits: string[];
    /** IDs dos itens possuídos */
    ownedItems: string[];
}

/**
 * Resultado de uma validação de deck.
 */
export interface ValidationResult {
    /** Se a validação passou */
    isValid: boolean;
    /** Lista de erros encontrados (se houver) */
    errors: ValidationError[];
}

/**
 * Detalhe de um erro de validação.
 */
export interface ValidationError {
    /** Código do erro para tratamento programático */
    code: ValidationErrorCode;
    /** Mensagem legível para o usuário */
    message: string;
    /** Índice da carta com problema (se aplicável) */
    cardIndex?: number;
    /** ID do item problemático (se aplicável) */
    itemId?: string;
    /** ID da unidade problemática (se aplicável) */
    unitId?: string;
}

/**
 * Códigos de erro de validação.
 */
export enum ValidationErrorCode {
    /** Unidade não existe no catálogo */
    UNIT_NOT_FOUND = 'UNIT_NOT_FOUND',
    /** Item não existe no catálogo */
    ITEM_NOT_FOUND = 'ITEM_NOT_FOUND',
    /** Jogador não possui a unidade */
    UNIT_NOT_OWNED = 'UNIT_NOT_OWNED',
    /** Jogador não possui o item */
    ITEM_NOT_OWNED = 'ITEM_NOT_OWNED',
    /** Unidade não tem o slot requerido pelo item */
    INVALID_SLOT = 'INVALID_SLOT',
    /** Item requer tag que a unidade não possui */
    MISSING_REQUIRED_TAG = 'MISSING_REQUIRED_TAG',
    /** Item é proibido para unidades com certa tag */
    FORBIDDEN_TAG_CONFLICT = 'FORBIDDEN_TAG_CONFLICT',
    /** Deck vazio ou incompleto */
    EMPTY_DECK = 'EMPTY_DECK',
    /** Slot duplicado (dois itens no mesmo slot) */
    DUPLICATE_SLOT = 'DUPLICATE_SLOT',
}
