# 02. Server Architecture: The Shadow Simulation

## 1. Filosofia: Server-Authoritative 2D
O servidor detém a verdade absoluta. O cliente é apenas um "visualizador burro" que interpola posições.
* **Backend (Lógica):** Roda uma simulação física 2D simples (Círculos e Retângulos).
* **Frontend (Visual):** Renderiza modelos 3D baseados nas coordenadas 2D enviadas pelo back.

### Benefícios desta Arquitetura
1. **Anti-Cheat:** Impossível hackear física ou status localmente.
2. **Performance:** Cálculos 2D são milhares de vezes mais leves que 3D.
3. **Consistência:** Todos os jogadores veem o mesmo estado.

## 2. O Loop do Servidor (Game Tick)
O servidor deve rodar a **20 ticks por segundo (20Hz)**.

### Pseudocódigo do Tick:
```python
def server_tick(game_state):
    # 1. Processar Inputs (Spawn de unidades)
    process_player_actions()

    # 2. Movimento & Física
    for unit in game_state.units:
        target = find_nearest_target(unit)
        move_towards(unit, target)
        resolve_circle_collisions(unit, game_state.other_units)

    # 3. Combate
    for unit in game_state.units:
        if distance(unit, unit.target) <= unit.range:
            if unit.can_attack():
                deal_damage(unit.target, unit.damage)

    # 4. Broadcast (Snapshot)
    # Envia apenas o delta comprimido para os clientes
    broadcast_state(game_state)
```

## 3. Estrutura de Entidades (In-Memory)

### 3.1 UnitEntity (Círculo 2D)
```go
type UnitEntity struct {
    ID           string
    OwnerID      string
    Position     Vector2D  // {X, Y}
    Radius       float64   // Hitbox circular
    Health       int
    MaxHealth    int
    Damage       int
    AttackSpeed  float64   // Ataques por segundo
    Range        float64   // Distância de ataque
    MoveSpeed    float64   // Unidades por segundo
    Target       *UnitEntity
    State        UnitState // IDLE, WALK, ATTACK, DEAD
    Tags         []string  // [SOLAR], [VOID], etc.
}
```

### 3.2 Vector2D
```go
type Vector2D struct {
    X float64
    Y float64
}

func (v Vector2D) Distance(other Vector2D) float64 {
    dx := v.X - other.X
    dy := v.Y - other.Y
    return math.Sqrt(dx*dx + dy*dy)
}
```

## 4. Matchmaking & Salas

### Fluxo de Estados do Jogador:
```
[DISCONNECTED] -> [LOBBY] -> [QUEUE] -> [IN_GAME] -> [LOBBY]
```

### GameRoom (Instância de Partida)
```go
type GameRoom struct {
    ID           string
    Player1      *PlayerConnection
    Player2      *PlayerConnection
    GameState    *GameState
    TickRate     int       // 20Hz
    StartTime    time.Time
    MaxDuration  time.Duration // 3 minutos
}
```

## 5. Protocolo de Rede

### 5.1 Cliente -> Servidor (Actions)
```json
{
    "type": "SPAWN_UNIT",
    "card_index": 2,
    "position": {"x": 10.5, "y": 5.0}
}
```

### 5.2 Servidor -> Cliente (Snapshot)
```json
{
    "tick": 1054,
    "mana": {"player1": 7, "player2": 5},
    "units": [
        {"id": "u1", "x": 10.5, "y": 20.0, "hp": 100, "state": "WALK"},
        {"id": "u2", "x": 15.2, "y": 20.0, "hp": 50,  "state": "ATTACK"}
    ],
    "towers": [
        {"id": "t1", "hp": 2500, "owner": "player1"},
        {"id": "t2", "hp": 3000, "owner": "player2"}
    ]
}
```

## 6. Colisão (Círculo vs Círculo)
```go
func CheckCollision(a, b *UnitEntity) bool {
    distance := a.Position.Distance(b.Position)
    return distance < (a.Radius + b.Radius)
}

func ResolveCollision(a, b *UnitEntity) {
    // Empurra as unidades para fora uma da outra
    overlap := (a.Radius + b.Radius) - a.Position.Distance(b.Position)
    if overlap > 0 {
        // Calcula direção e empurra
        pushDir := normalize(a.Position.Sub(b.Position))
        a.Position = a.Position.Add(pushDir.Scale(overlap / 2))
        b.Position = b.Position.Sub(pushDir.Scale(overlap / 2))
    }
}
```

## 7. Pathfinding Simplificado
Para performance, usamos **Steering Behavior** em vez de A* completo:
1. Cada unidade busca o alvo mais próximo (torre ou unidade inimiga).
2. Move-se em linha reta até o alvo.
3. Desvia de colisões com aliados.
