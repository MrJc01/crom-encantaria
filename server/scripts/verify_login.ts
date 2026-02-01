
import WebSocket from 'ws';
import { C2SMessageType, S2CMessageType } from '../src/core/net/protocol.js';

const PORT = 3000;
const URL = `ws://localhost:${PORT}`;
const PLAYER_ID = 'hero_1';

async function runTest() {
    console.log(`[Test] Conectando a ${URL}...`);
    const ws = new WebSocket(URL);

    return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error('Timeout - Teste demorou demais'));
            ws.close();
        }, 5000);

        ws.on('open', () => {
            console.log('[Test] Conectado! Enviando LOGIN...');
            ws.send(JSON.stringify({
                type: C2SMessageType.LOGIN,
                playerId: PLAYER_ID
            }));
        });

        ws.on('message', (data) => {
            const msg = JSON.parse(data.toString());
            console.log(`[Test] Recebido: ${msg.type}`);

            if (msg.type === S2CMessageType.LOGIN_SUCCESS) {
                console.log('[Test] ✅ Login Sucesso!');
                console.log('Player:', msg.player);
                console.log('Deck:', msg.deck.name, `(${msg.deck.cards.length} cartas)`);

                // Verificar se o deck tem as cartas mapeadas corretamente (SimpleDB retorna string[])
                if (Array.isArray(msg.deck.cards) && typeof msg.deck.cards[0] === 'string') {
                    console.log('[Test] ✅ Deck possui cartas mapeadas corretamente (string[] IDs).');
                } else {
                    console.error('[Test] ❌ Deck tem formato inválido:', msg.deck.cards);
                    reject(new Error('Invalid deck format'));
                }

                console.log('[Test] Entrando na fila...');
                ws.send(JSON.stringify({
                    type: C2SMessageType.QUEUE_JOIN,
                    deckId: msg.deck.id
                }));
            }
            else if (msg.type === S2CMessageType.QUEUE_JOINED) {
                console.log(`[Test] ✅ Na fila. Posição: ${msg.position}`);
                // Precisa de outro jogador para iniciar a partida, então vamos simular um segundo cliente
                // ou apenas aceitar que chegamos até aqui se o objetivo for testar o login.
                // Mas o objetivo "Injection de Deck Real na Sala" requer ver o GameRoom inicializado.
                // Então vou abrir outro socket aqui mesmo.
                startSecondClient();
            }
            else if (msg.type === S2CMessageType.MATCH_START) {
                console.log('[Test] ✅ Partida Iniciada!');
                console.log('You:', msg.you);
                console.log('Opponent:', msg.opponent);

                if (msg.you.deckId === 'deck_h1_default') {
                    console.log('[Test] ✅ Deck ID correto na partida.');
                    clearTimeout(timeout);
                    ws.close();
                    resolve();
                    process.exit(0);
                } else {
                    reject(new Error(`Wrong deck ID in match: ${msg.you.deckId}`));
                }
            }
            else if (msg.type === S2CMessageType.ERROR) {
                console.error('[Test] ❌ Erro do servidor:', msg);
                reject(new Error(msg.message));
            }
        });

        ws.on('error', (err) => {
            reject(err);
        });
    });
}

function startSecondClient() {
    console.log('[Test] Iniciando segundo cliente para fechar match...');
    const ws2 = new WebSocket(URL);
    ws2.on('open', () => {
        ws2.send(JSON.stringify({ type: C2SMessageType.LOGIN, playerId: 'hero_2' }));
    });
    ws2.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.type === S2CMessageType.LOGIN_SUCCESS) {
            ws2.send(JSON.stringify({ type: C2SMessageType.QUEUE_JOIN, deckId: msg.deck.id }));
        }
    });
}

runTest().catch(err => {
    console.error('[Test] FALHA:', err);
    process.exit(1);
});
