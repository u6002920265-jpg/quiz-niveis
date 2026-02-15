# Quiz Níveis de Pensamento — Especificação Completa

## 1. Visão Geral

Aplicação web em React para telemóvel. Um quiz interativo baseado na imagem `nivel.png` do grupo de WhatsApp "A Nossa Turma". A imagem mostra 5 níveis de pensamento com 21 participantes distribuídos. O utilizador deve arrastar os nomes dos membros para os níveis corretos do círculo.

---

## 2. Stack Técnico

| Tecnologia | Escolha |
|---|---|
| Framework | React (Vite) |
| Linguagem | TypeScript |
| Estilos | TailwindCSS |
| Drag & Drop | dnd-kit |
| Deploy | Vercel |

---

## 3. Dados do Quiz

### Níveis e Membros (21 participantes)

| Nível | Nome | Membros |
|---|---|---|
| 1 | Conformista | Luís Graça, Zé Pedro, Tiago Burnay, Carlos Cunha, Miguel Pereira, Filipe Quinta, João Fleming, Nuno Vilaça, Jorge Costa, Filipe Carneira, Gustavo Sousa, Xani (12) |
| 2 | Individualista | Ricardo Pereira, Dinis Sottomayor, Nuno Brito e Faro, Pedro Norton (4) |
| 3 | Sintetista | Rui Pedro, Gonçalo Oliveira, Armando Teixeira-Pinto (3) |
| 4 | Generativo | Miguel 'Guedelhas' (1) |
| 5 | Génio Estratégico / 5D | Rodrigo Adão da Fonseca (1) |

- Dados hardcoded num ficheiro TypeScript constante.
- **Ofuscação básica** dos dados de resposta no código fonte (e.g., Base64 encoding ou similar) para desencorajar batota casual via DevTools.

---

## 4. Ecrãs da Aplicação

### 4.1 Ecrã de Boas-Vindas

- **Título**: "Níveis de Pensamento — Grupo A Nossa Turma"
- **Instruções curtas** em PT-PT explicando a mecânica (arrastar nomes para os níveis, 3 tentativas)
- **Botão "Começar"** para iniciar o quiz
- **Melhor pontuação** persistida: se existir, mostrar "Melhor pontuação: X%" no ecrã de boas-vindas

### 4.2 Ecrã do Quiz

**Layout (de cima para baixo):**

1. **Barra de cabeçalho (topo)**:
   - Título do quiz (lado esquerdo)
   - Contador de tentativas: "Tentativa X/3" (centro)
   - Ícone de altifalante (toggle som/haptic) no canto superior direito
   - Botão "Verificar" (desativado até todos os 21 nomes serem colocados)

2. **Imagem do círculo** (`nivel.png` como fundo):
   - Divs opacos a cobrir os nomes dos membros em cada fatia (cores correspondentes ao fundo de cada fatia)
   - Títulos dos níveis permanecem visíveis na imagem
   - **Badge de contagem** em cada fatia (e.g., "3/12") substituindo a área dos nomes
   - Tocar no badge abre um **bottom sheet/modal** com os nomes atribuídos

3. **Pool de nomes** (abaixo do círculo):
   - Todos os 21 nomes em pills arredondados pequenos
   - Cor neutra uniforme (gold/amber, tema da imagem)
   - Layout flex-wrap grid
   - Nomes baralhados aleatoriamente a cada início de quiz
   - Nomes longos truncados com reticências
   - Nomes desaparecem do pool ao serem arrastados para um nível

### 4.3 Ecrã de Relatório

- **Percentagem** final (e.g., "85%")
- **Contagem de tentativas** usadas (e.g., "Tentativa 3/3")
- **Melhor pontuação** de sempre
- **Imagem original** `nivel.png` (com todos os nomes visíveis) como chave de resposta
- **Botão "Partilhar"** — Web Share API com texto pré-formatado
- **Botão "Recomeçar"** — reinicia o quiz

---

## 5. Mecânica de Jogo

### 5.1 Drag and Drop

- **Verdadeiro drag-and-drop** com dnd-kit (suporte touch)
- O utilizador arrasta pills de nomes do pool para as fatias do círculo
- **Reorganização livre** antes de submeter — nomes podem ser movidos entre níveis ou de volta ao pool
- Para mover de volta ao pool: tocar no badge → bottom sheet → botão X no nome

### 5.2 Deteção de Zona de Drop

- **Deteção angular baseada no centro**: quando um nome é largado, calcular o ângulo do ponto de drop relativamente ao centro do círculo para determinar em que fatia caiu
- Ângulos estimados a partir da imagem, afinados durante testes
- Drops fora de qualquer fatia válida (fora do círculo) → **snap back ao pool** com animação

### 5.3 Limites de Capacidade

- **Limites enforçados**: cada nível aceita no máximo o número correto de nomes
- Nível 1: máx 12, Nível 2: máx 4, Nível 3: máx 3, Nível 4: máx 1, Génio: máx 1
- Se cheio, o drop é rejeitado e o nome volta ao pool

### 5.4 Contagem Esperada

- Cada fatia mostra "X/Y" (nomes colocados / total esperado)
- O utilizador sabe quantos nomes cada nível espera

---

## 6. Verificação e Pontuação

### 6.1 Botão Verificar

- **Desativado** até todos os 21 nomes estarem colocados
- **Verificação imediata** ao tocar (sem modal de confirmação)
- Consome 1 das 3 tentativas

### 6.2 Feedback Após Verificação

- Nomes **corretos trancam** na sua posição (pill fica verde, não removível)
- Nomes **errados voltam** ao pool (animação de regresso)
- Animação: **tudo de uma vez** (corretos ficam verdes simultaneamente, errados voam de volta)

### 6.3 Cálculo da Pontuação

- **Pontuação = total de nomes trancados cumulativo / 21** (após cada tentativa)
- **Melhor pontuação** = máximo do total cumulativo trancado entre todas as tentativas
- Exemplo: Tentativa 1 → 10/21 trancados. Tentativa 2 → 15/21 trancados. Melhor = 15/21 = 71.4%

### 6.4 Vitória Antecipada

- Se o utilizador acerta **100% em qualquer tentativa** → quiz termina imediatamente, vai para relatório

### 6.5 Fim das 3 Tentativas

- Após a 3ª verificação e animação → **transição imediata** para o ecrã de relatório

---

## 7. Bottom Sheet (Modal de Nomes)

- Ativado ao tocar no badge de contagem de uma fatia
- **Slide-up panel** listando os nomes atribuídos àquele nível
- Nomes trancados (corretos): **pill verde**, sem botão X
- Nomes não verificados: **pill branco/default**, com botão X para remover de volta ao pool
- Fechar tocando fora ou botão de fechar

---

## 8. Design Visual

### 8.1 Tema

- **Fundo escuro** (castanho/preto) em toda a app, correspondente à estética da imagem
- **Cores de destaque**: gold/amber para botões, texto e elementos UI
- Efeitos de brilho e gradientes inspirados na imagem

### 8.2 Pills de Nomes

- Pills arredondados pequenos e compactos
- Cor neutra uniforme (gold/amber)
- Nomes longos truncados com reticências (nome completo visível no bottom sheet)
- Pills trancados: verde com badge verde

### 8.3 Feedback Visual de Drag

- Ao arrastar sobre uma fatia: **highlight com glow/borda brilhante** na fatia alvo
- Fatia cheia: sem highlight (drop rejeitado)

### 8.4 Imagem do Círculo

- `nivel.png` usado como **imagem de fundo**
- Divs opacos sobrepostos para cobrir texto dos nomes dos membros (cor correspondente a cada fatia)
- Títulos dos níveis e "(X pessoas)" permanecem visíveis
- Badges de contagem interativos sobrepostos

---

## 9. Animações

- **Smooth animations** em toda a app:
  - Drop de nome na fatia: snap suave para posição
  - Lock-in de nome correto: glow verde / pulse
  - Nomes errados a voltar ao pool: fly-back animado
  - Transições entre ecrãs
- Resultado da verificação: **tudo revelado de uma vez** (sem stagger)

---

## 10. Som e Haptics

- **Sons + vibração háptica** ativados por defeito
- **Toggle de mute** (ícone altifalante) no canto superior direito do header
- Sons:
  - Pop suave ao drop
  - Chime ao acertar (verificação)
  - Buzz ao errar (verificação)
  - Celebração ao 100%
- Vibração curta no drop e no resultado da verificação
- Preferência de som persistida em localStorage

---

## 11. Responsividade e Orientação

- **Largura travada a ~390px** (otimizado para telemóvel moderno padrão)
- **Orientação retrato forçada**: em landscape, mostrar mensagem "Por favor rode o telemóvel"
- Drop zones posicionados em percentagem relativamente à imagem
- Não otimizado para tablet ou desktop

---

## 12. Persistência (localStorage)

### Estado do Quiz (limpo ao recomeçar)
- Atribuições atuais (nome → nível)
- Nomes trancados
- Tentativa atual (1-3)
- Ordem baralhada dos nomes

### Estado Persistente (mantido entre sessões)
- Melhor pontuação de sempre
- Preferência de som (muted/unmuted)

---

## 13. Partilha

- Botão **"Partilhar"** no ecrã de relatório
- Usa **Web Share API** (com fallback para copiar para clipboard)
- Texto pré-formatado: "Consegui X% no Quiz Níveis de Pensamento! 🎯 Tenta tu: [link]"

---

## 14. Anti-Batota

- **Ofuscação básica** dos dados de resposta (e.g., Base64 ou encoding simples)
- Não pretende parar developers determinados, apenas desencorajar inspeção casual

---

## 15. Deploy

- **Plataforma**: Vercel
- Deploy como site estático (Vite build)
- URL partilhável para o grupo de WhatsApp