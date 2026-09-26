# Equilíbrium

Jogo educativo web sobre **Árvores AVL**, para a disciplina de Estruturas de Dados II
(Ciência da Computação). Interface inteiramente em português do Brasil.

No VisuAlgo o aluno digita uma chave, clica em "Inserir" e assiste: o rebalanceamento
acontece sozinho. Aqui é o contrário — **o jogo nunca rebalanceia sozinho**. A cada
desbalanceamento o jogador precisa identificar o nó crítico e escolher a rotação correta.
Errar demais faz a estrutura degenerar em lista encadeada (busca O(n)) e a partida acaba.

## Como rodar

```sh
npm i
npm run dev      # servidor de desenvolvimento
npm run test     # testes da lógica da AVL e das regras do jogo (Vitest)
npm run build    # build de produção
npm run lint     # ESLint + Prettier
```

## Estrutura

| Caminho                            | Papel                                                                                                                                                                                                                                                                                          |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/avl.ts`                   | Toda a lógica da AVL: funções puras e imutáveis (`insertBST`, `height`, `balanceFactor`, `findCriticalNode`, `classifyCase`, `rotateLeft`, `rotateRight`, `applyCorrection`, `isValidBST`, `isValidAVL`, `computeLayout`). A interface nunca calcula FB nem decide rotações por conta própria. |
| `src/lib/avl.test.ts`              | Testes da AVL, incluindo os quatro casos canônicos, a inserção de 1 a 15 e as sequências fixas das fases 1 e 2.                                                                                                                                                                                |
| `src/hooks/useEquilibrium.ts`      | Máquina de estados da partida: fila de chaves, pontuação, combo, estabilidade, cronômetro.                                                                                                                                                                                                     |
| `src/hooks/useEquilibrium.test.ts` | Testes das regras do jogo (pontuação, erros que não alteram a árvore, derrota, "Revelar FB").                                                                                                                                                                                                  |
| `src/data/levels.ts`               | As quatro fases e o sorteio validado da sequência mista.                                                                                                                                                                                                                                       |
| `src/lib/som.ts`                   | Efeitos sonoros sintetizados com a Web Audio API, sem arquivos de áudio.                                                                                                                                                                                                                       |
| `src/components/jogo/`             | Árvore em SVG, HUD, botões de rotação, painéis e telas de resultado.                                                                                                                                                                                                                           |
| `src/routes/`                      | Menu, seleção de fase, jogo, "Como jogar" e recordes.                                                                                                                                                                                                                                          |

## Regras da AVL adotadas

- Árvore binária de busca com chaves inteiras únicas (chave repetida é rejeitada com aviso).
- Altura: nó nulo = −1, folha = 0.
- FB(n) = altura(esquerda) − altura(direita); válido em {−1, 0, +1}, |FB| = 2 é desbalanceado.
- Nó crítico: subindo do nó inserido até a raiz, o primeiro (mais profundo) com |FB| = 2.
- Casos, sendo `z` o nó crítico:
  - FB(z) = +2 e FB(z.esq) ≥ 0 → **LL** → rotação simples à direita em z
  - FB(z) = +2 e FB(z.esq) < 0 → **LR** → esquerda em z.esq, depois direita em z
  - FB(z) = −2 e FB(z.dir) ≤ 0 → **RR** → rotação simples à esquerda em z
  - FB(z) = −2 e FB(z.dir) > 0 → **RL** → direita em z.dir, depois esquerda em z
- Na inserção, uma única correção no nó crítico rebalanceia a árvore inteira.

## Fases

1. **Tutorial** — rotações simples, sequência fixa, nó crítico já destacado, 5 de estabilidade, dicas passo a passo.
2. **Rotações duplas** — sequência fixa com os casos LR e RL, o jogador acha o nó crítico, 4 de estabilidade.
3. **Misto** — 12 a 15 chaves sorteadas e validadas com `avl.ts` (mínimo de 5 correções e os 4 casos), FB oculto, "Revelar FB" custa 50 pontos, 3 de estabilidade.
4. **Contra o tempo** — igual à fase 3, com 20 segundos por desbalanceamento e bônus de tempo.

Recordes, fases desbloqueadas e a preferência de som ficam no `localStorage`. Sem backend
nesta versão.

Cada etapa da rodada tem um efeito sonoro próprio (tique da descida, alarme de
desbalanceamento, varredura da rotação, fanfarra de vitória). O botão no topo da tela de jogo
liga e desliga o som, pelo clique ou pelo atalho `M`.

## Fora do escopo desta versão

Remoção de nós, Árvore Rubro-Negra, Árvore B, login e ranking online.

---

This project was built with [Lovable](https://lovable.dev). Continue developing it in the
[Lovable editor](https://lovable.dev/projects/1a537bb1-f1ba-4db4-8c43-0c0d0461cc8c).
