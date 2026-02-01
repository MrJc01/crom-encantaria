# 04. Prompt Master para Antigravity

> **IMPORTANTE:** Copie o conteúdo abaixo (a partir da linha `---`) e cole diretamente no Antigravity para iniciar o desenvolvimento.

---

Atue como um Engenheiro de Software Sênior e Arquiteto de Sistemas especialista em jogos Multiplayer em Tempo Real. Estamos iniciando o projeto "Magic Royale" (codinome: **crom-encantaria**).

## CONTEXTO DO PROJETO

Quero criar um jogo web competitivo 1v1.

- **Estilo de Gameplay:** Clash Royale (Tower Defense/Attack em lanes).
- **Diferencial (USP):** Customização de unidades inspirada em Magic: The Gathering. O jogador escolhe uma unidade base e equipa itens (armas, armaduras) que alteram status e custo de mana. Existem regras de afinidade (ex: itens de Fogo não equipam em unidades de Água/Gelo).
- **Frontend:** Web (Three.js ou similar), usando assets 3D do itch.io, mas apenas "refletindo" o estado do servidor.
- **Backend:** Servidor autoritativo. O servidor é a VERDADE ABSOLUTA.

## ARQUITETURA TÉCNICA OBRIGATÓRIA

### 1. "Shadow 2D Simulation"
O servidor roda a lógica do jogo em **geometria 2D simples** (círculos e hitboxes) para performance e anti-cheat. O front recebe coordenadas e renderiza os modelos 3D nessas posições.

- **Servidor:** Calcula física, colisões, pathfinding, combate.
- **Cliente:** Apenas interpola posições e toca animações baseado no estado recebido.

### 2. Persistência de Deck
O deck é complexo (Unidade + N Equipamentos). O servidor deve **validar regras de "Tipos/Cores"** antes de salvar o deck.

### 3. WebSocket para Tempo Real
Conexão persistente para partidas. O servidor transmite snapshots a 20Hz.

## DOCUMENTAÇÃO TÉCNICA

Eu forneci 3 arquivos de documentação técnica na pasta `/docs` que detalham:

1. **`01_game_design_core.md`** - Regras do jogo, sistema de mana, afinidades.
2. **`02_server_architecture.md`** - Arquitetura Shadow 2D, loop de tick, estrutura de entidades.
3. **`03_data_schema.md`** - Schema de dados, validações, estrutura do banco.

**Leia esses arquivos antes de começar.**

## TAREFA ATUAL (FASE 1 - FUNDAÇÃO)

Com base na documentação, quero que você inicie o desenvolvimento focando na **fundação do servidor**.

### Checklist de Implementação:

1. **Estrutura do Projeto**
   - Configure a estrutura básica (Go ou Node.js - escolha o melhor para WebSocket + performance).
   - Crie as pastas: `/server`, `/shared`, `/client`.

2. **Catálogo de Dados**
   - Implemente o carregamento do catálogo de Unidades e Itens (JSON estático).
   - Crie structs/types para `UnitBase`, `Item`, `Deck`.

3. **Sistema de Validação de Decks**
   - Implemente o código que valida equipamentos (conforme `03_data_schema.md`).
   - Quero ver o código que **impede** um jogador de equipar um item proibido em uma unidade.

4. **GameRoom Básica**
   - Crie a classe/struct `GameRoom` que aceita dois jogadores.
   - Implemente o esqueleto do loop de tick (20Hz).

5. **Testes**
   - Crie testes unitários para a validação de equipamentos.
   - Teste casos: item permitido, item proibido, item sem slot.

## REGRAS DE DESENVOLVIMENTO

1. **Server-Authoritative:** Nunca confie em dados do cliente. Valide TUDO no servidor.
2. **Performance First:** Use estruturas de dados eficientes. Evite alocações no hot path.
3. **Comentários em Português:** Documente o código em PT-BR.
4. **Código Limpo:** Siga princípios SOLID. Funções pequenas e testáveis.

## PERGUNTAS PARA DECISÃO (RESPONDA ANTES DE CODAR)

1. **Linguagem:** Go ou Node.js (TypeScript)? Justifique.
2. **Banco de Dados:** PostgreSQL (JSONB) ou SQLite para desenvolvimento?
3. **WebSocket Library:** Qual biblioteca você recomenda?

Após responder, pode começar a codar a estrutura base.
