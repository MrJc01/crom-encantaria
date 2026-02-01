# 01. Game Design: "Magic Royale" Core Mechanics

## 1. Visão Geral
Jogo de estratégia 1v1 em tempo real (RTS) onde o jogador invoca unidades em duas rotas (lanes) para destruir a base inimiga. A inovação central é a **Customização de Deck via Equipamentos** com regras de afinidade (Sistema de Cores).

## 2. O Sistema de "Container Card"
Diferente de Clash Royale, uma carta não é estática. Ela é um container composto por:
* **Base Unit:** O personagem (ex: Esqueleto, Cavaleiro). Define HP base e velocidade.
* **Equipment Slots:** Espaços para modificar a unidade (Mão Direita, Corpo, Relíquia).

### 2.1 Custo de Mana Dinâmico
O custo para jogar a carta na partida é calculado no servidor:
`Custo Total = Custo Base da Unidade + Soma(Peso dos Equipamentos)`

* *Exemplo:*
    * Paladino (Base): 3 Mana.
    * Espada Longa (+1 Mana).
    * Armadura de Placas (+1 Mana).
    * **Custo Final:** 5 Mana.

## 3. Regras de Afinidade (Magic System)
Para evitar combos "quebrados" e forçar escolhas estratégicas, usamos o **Sistema de Afinidade**.
* **Tags de Unidade:** `[SOLAR]`, `[VOID]`, `[NATURE]`, `[STEEL]`.
* **Tags de Equipamento:** Possuem requisitos.

### Tabela de Restrição
1.  **Hard Lock:** Um item `[VOID]` não pode ser equipado em uma unidade `[SOLAR]` (conflito de essência).
2.  **Class Lock:** Um "Arco Pesado" não pode ser equipado em uma unidade com a tag `[MELEE_ONLY]`.

## 4. Loop de Partida
1.  **Setup:** Jogadores carregam seus decks customizados.
2.  **Deploy:** Jogador arrasta carta para a arena.
3.  **Simulation:** Servidor calcula movimento e combate em lógica 2D.
4.  **Win Condition:** Destruir o "Core" inimigo ou ter mais HP ao fim do tempo.

## 5. Estrutura da Arena
```
+-----------------------------------------------+
|                ZONA DO INIMIGO                |
|                                               |
|   [TORRE]          [CORE]          [TORRE]    |
|                                               |
|==============================================|
|                 LINHA DO RIO                  |
|==============================================|
|                                               |
|   [TORRE]          [CORE]          [TORRE]    |
|                                               |
|               ZONA DO JOGADOR                 |
+-----------------------------------------------+
```

## 6. Recursos do Jogo
- **Mana:** Regenera automaticamente (1 por segundo). Cap: 10.
- **Tempo de Partida:** 3 minutos (+ overtime se empate).
- **Deck Size:** 8 cartas customizáveis.
