# 🏰 Crom Encantaria (Magic Royale)

Bem-vindo ao repositório oficial do **Crom Encantaria**, um jogo RTS Multiplayer em Tempo Real inspirado em Clash Royale, rodando inteiramente na web com **Vue 3, TypeScript e WebSocket**.

## 🚀 Como Iniciar

Este projeto é um *monorepo* contendo Cliente e Servidor.

### Pré-requisitos
- Node.js (v20+)
- npm

### Instalação Rápida
Execute o script de inicialização na raiz:

```bash
./start.sh
```

Ou manualmente:

```bash
# Instalar dependências de todos os pacotes
npm install

# Iniciar ambiente de desenvolvimento (Client + Server)
npm run dev
```

## 📂 Estrutura do Projeto

- **client/**: Aplicação Web (Vue 3 + Vite + Three.js + Pinia).
    - `src/net`: Protocolo de Rede e Cliente WebSocket.
    - `src/three`: Motor de Renderização 3D.
- **server/**: Servidor Autoritativo (Node.js + ws).
    - `src/game`: Lógica de Jogo, Simulação e Física.

## 🛠️ Tecnologias

- **Frontend**: Vue 3, Three.js, Sass, Vite.
- **Backend**: Node.js, WebSockets (ws), TypeScript.
- **Protocolo**: Mensagens JSON otimizadas para Game Loop (`GAME_TICK`, `ENTITY_SPAWNED`).

## 🎮 Controles

- **Mouse**: Interagir com UI.
- **Drag & Drop**: Arrastar cartas para a arena (Em desenvolvimento na Fase 8).

---
*Desenvolvido pela Equipe CROM*
