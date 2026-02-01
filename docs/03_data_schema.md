# 03. Data Schema & Persistence

## 1. Definição de Unidade Base (Catálogo - ReadOnly)
Unidades base residem num catálogo estático no servidor.

```json
{
  "unit_id": "knight_base",
  "name": "Cavaleiro",
  "description": "Guerreiro corpo-a-corpo equilibrado.",
  "base_stats": {
    "health": 200,
    "damage": 25,
    "attack_speed": 1.0,
    "range": 1.5,
    "move_speed": 2.0
  },
  "mana_cost": 3,
  "tags": ["HUMAN", "STEEL", "MELEE"],
  "slots": {
    "weapon": true,
    "armor": true,
    "artifact": true
  },
  "sprite_3d": "models/knight.glb"
}
```

## 2. Definição de Item/Equipamento (Catálogo - ReadOnly)
Itens também são estáticos e apenas referenciados.

```json
{
  "item_id": "sword_flame_t1",
  "name": "Espada de Fogo",
  "description": "Uma lâmina forjada em chamas eternas.",
  "type": "WEAPON",
  "mana_weight": 1,
  "stats_modifier": {
    "damage": 50,
    "attack_speed": -0.1
  },
  "requirements": {
    "allowed_tags": ["HUMAN", "DEMON"],
    "forbidden_tags": ["WATER_ELEMENTAL", "NATURE"]
  },
  "slot": "weapon",
  "sprite_3d": "models/items/sword_flame.glb"
}
```

### 2.1 Tipos de Slots
| Slot     | Descrição                          |
|----------|-----------------------------------|
| weapon   | Armas (espadas, arcos, cajados)   |
| armor    | Armaduras e escudos               |
| artifact | Relíquias e acessórios mágicos    |

## 3. Definição de Deck do Jogador (Persistido no BD)
Isso é o que o jogador salva no banco de dados.

```json
{
  "deck_id": "deck_001",
  "player_id": "juan_candido",
  "deck_name": "Rush de Fogo",
  "created_at": "2026-02-01T18:00:00Z",
  "updated_at": "2026-02-01T18:30:00Z",
  "cards": [
    {
      "slot_index": 0,
      "base_unit_id": "knight_base",
      "equipped_items": ["sword_flame_t1", "steel_plate_t2"]
    },
    {
      "slot_index": 1,
      "base_unit_id": "archer_base",
      "equipped_items": ["longbow_t2"]
    },
    {
      "slot_index": 2,
      "base_unit_id": "mage_base",
      "equipped_items": ["staff_ice_t1", "robe_mystic"]
    }
  ]
}
```

## 4. Inventário do Jogador (Persistido)
```json
{
  "player_id": "juan_candido",
  "unlocked_units": [
    "knight_base",
    "archer_base",
    "mage_base",
    "skeleton_base"
  ],
  "owned_items": [
    "sword_flame_t1",
    "steel_plate_t2",
    "longbow_t2",
    "staff_ice_t1",
    "robe_mystic",
    "boots_haste"
  ]
}
```

## 5. Regras de Validação (Server-Side)

### 5.1 Fluxo de Validação ao Salvar Deck
```
1. Jogador envia: SaveDeck(deck_data)
2. Servidor valida:
   a) Jogador possui todas as unidades? (Inventário)
   b) Jogador possui todos os itens? (Inventário)
   c) Itens são compatíveis com as unidades? (Tags)
   d) Slots estão corretos? (Item de arma no slot de arma)
3. Se válido: Salva no banco
4. Se inválido: Retorna erro específico
```

### 5.2 Algoritmo de Validação de Compatibilidade
```go
func ValidateEquipment(unit UnitBase, item Item) error {
    // 1. Verificar se a unidade tem o slot
    if !unit.HasSlot(item.Slot) {
        return errors.New("unit does not have this slot type")
    }
    
    // 2. Verificar tags permitidas
    if len(item.Requirements.AllowedTags) > 0 {
        hasAllowedTag := false
        for _, unitTag := range unit.Tags {
            if contains(item.Requirements.AllowedTags, unitTag) {
                hasAllowedTag = true
                break
            }
        }
        if !hasAllowedTag {
            return errors.New("unit does not have required affinity")
        }
    }
    
    // 3. Verificar tags proibidas
    for _, unitTag := range unit.Tags {
        if contains(item.Requirements.ForbiddenTags, unitTag) {
            return errors.New("item is incompatible with unit type")
        }
    }
    
    return nil // Equipamento válido
}
```

### 5.3 Cálculo de Custo Final
```go
func CalculateCardCost(unit UnitBase, items []Item) int {
    totalCost := unit.ManaCost
    for _, item := range items {
        totalCost += item.ManaWeight
    }
    return totalCost
}
```

## 6. Estrutura do Banco de Dados

### Tabelas Principais (SQL)
```sql
-- Jogadores
CREATE TABLE players (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    mmr INT DEFAULT 1000,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Inventário de Unidades
CREATE TABLE player_units (
    player_id VARCHAR(36) REFERENCES players(id),
    unit_id VARCHAR(50) NOT NULL,
    unlocked_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (player_id, unit_id)
);

-- Inventário de Itens
CREATE TABLE player_items (
    player_id VARCHAR(36) REFERENCES players(id),
    item_id VARCHAR(50) NOT NULL,
    quantity INT DEFAULT 1,
    obtained_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (player_id, item_id)
);

-- Decks (JSONB para flexibilidade)
CREATE TABLE decks (
    id VARCHAR(36) PRIMARY KEY,
    player_id VARCHAR(36) REFERENCES players(id),
    name VARCHAR(100) NOT NULL,
    cards JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

## 7. Snapshot da Partida (Para Replay/Debug)
```json
{
  "match_id": "match_abc123",
  "players": ["player_1", "player_2"],
  "winner": "player_1",
  "duration_seconds": 145,
  "final_state": {
    "player_1_towers_destroyed": 2,
    "player_2_towers_destroyed": 1
  },
  "events": [
    {"tick": 50, "type": "SPAWN", "player": "player_1", "unit": "knight_custom"},
    {"tick": 120, "type": "KILL", "attacker": "u1", "victim": "u2"},
    {"tick": 200, "type": "TOWER_DESTROYED", "tower": "t2"}
  ]
}
```
