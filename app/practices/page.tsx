'use client'
import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCareStore } from '@/lib/store'
import BottomNav from '@/components/BottomNav'

type Category = 'para-voce' | 'ansiedade' | 'foco' | 'sono' | 'corpo' | 'identidade' | 'sabedoria'

interface Practice {
  id: string
  title: string
  subtitle: string
  duration: string
  category: Category[]
  color: string
  icon: string
  tag?: string
  forProfiles?: string[]           // show as "recommended for you" if profile matches
  steps: { title: string; body: string }[]
}

interface BookQuote {
  quote: string
  author: string
  book: string
  insight: string
  color: string
  forProfiles?: string[]
}

// ─── Book Wisdom ────────────────────────────────────────────────────────────

const BOOK_QUOTES: BookQuote[] = [
  {
    quote: '"O momento presente é o único lugar onde a vida existe."',
    author: 'Eckhart Tolle',
    book: 'O Poder do Agora',
    insight: 'Ansiedade vive no futuro. Depressão vive no passado. Você só existe agora.',
    color: '#00D4A0',
    forProfiles: ['ansiedade', 'depressao'],
  },
  {
    quote: '"O sofrimento não vem da dor em si, mas da sua luta contra ela."',
    author: 'Russ Harris',
    book: 'A Armadilha da Felicidade',
    insight: 'Aceitar a emoção difícil é mais eficaz do que fugir dela. Isso é a base da ACT.',
    color: '#7B8FF8',
    forProfiles: ['ansiedade', 'burnout'],
  },
  {
    quote: '"O corpo guarda o placar."',
    author: 'Bessel van der Kolk',
    book: 'O Corpo Guarda o Placar',
    insight: 'Trauma e estresse crônico não ficam só na mente — eles se instalam fisicamente no corpo.',
    color: '#FF8C6B',
    forProfiles: ['burnout', 'depressao'],
  },
  {
    quote: '"Não é o que acontece com você, mas como você responde ao que acontece."',
    author: 'Epicteto',
    book: 'Enquiridion',
    insight: 'Estoicismo: você não controla eventos, controla sua interpretação deles.',
    color: '#C8C8C8',
    forProfiles: ['estresse', 'ansiedade'],
  },
  {
    quote: '"Vulnerabilidade não é fraqueza. É a medida mais precisa de coragem."',
    author: 'Brené Brown',
    book: 'A Coragem de Ser Imperfeito',
    insight: 'Esconder o que sentimos custa mais energia do que expressar. Vergonha se alimenta do silêncio.',
    color: '#FF4466',
    forProfiles: ['depressao', 'burnout'],
  },
  {
    quote: '"Pessoas com mentalidade de crescimento acreditam que habilidades podem ser desenvolvidas."',
    author: 'Carol Dweck',
    book: 'Mindset: A Nova Psicologia do Sucesso',
    insight: 'TDAH não define seu teto. A neuroplasticidade é real — o cérebro muda com prática intencional.',
    color: '#00D4A0',
    forProfiles: ['tdah'],
  },
  {
    quote: '"Em busca de sentido, o ser humano encontra força para suportar qualquer coisa."',
    author: 'Viktor Frankl',
    book: 'Em Busca de Sentido',
    insight: 'Mesmo em sofrimento extremo, o propósito é a âncora mais poderosa da saúde mental.',
    color: '#FFB800',
    forProfiles: ['depressao', 'burnout'],
  },
  {
    quote: '"Seu sistema nervoso não distingue entre uma ameaça real e imaginada."',
    author: 'Peter Levine',
    book: 'O Despertar do Tigre',
    insight: 'Por isso respiração e ancoragem corporal funcionam: elas falam diretamente ao sistema nervoso.',
    color: '#7B8FF8',
    forProfiles: ['ansiedade'],
  },
]

// ─── Practices ──────────────────────────────────────────────────────────────

const PRACTICES: Practice[] = [
  // ANSIEDADE
  {
    id: 'grounding-54321',
    title: 'Ancoragem 5-4-3-2-1',
    subtitle: 'Para quando a mente acelera',
    duration: '3–5 min',
    category: ['ansiedade'],
    color: '#00D4A0',
    icon: '🌍',
    tag: 'Ansiedade · Pânico',
    forProfiles: ['ansiedade'],
    steps: [
      { title: 'Respira primeiro', body: 'Inspire por 4 segundos, expire por 6. Repita 3 vezes antes de começar.' },
      { title: '5 coisas que você VÊ', body: 'Olhe ao redor devagar. Nomeie 5 objetos ou cores. Não precisa ser elaborado.' },
      { title: '4 coisas que você TOCA', body: 'Sinta a textura da cadeira, da roupa, da pele. 4 sensações físicas reais.' },
      { title: '3 sons que você OUVE', body: 'Feche os olhos. O que existe no ambiente sonoro agora? 3 sons.' },
      { title: '2 cheiros', body: 'Respire pelo nariz. Perceba qualquer aroma, sutil ou forte.' },
      { title: '1 sabor', body: 'O que você sente na boca agora? Apenas 1.' },
      { title: 'Você está aqui', body: 'O sistema nervoso desacelerou. A ansiedade não sumiu, mas você não está mais sendo arrastado.' },
    ],
  },
  {
    id: 'cognitive-stop',
    title: 'Parada Cognitiva',
    subtitle: 'Interromper espirais de pensamento',
    duration: '5 min',
    category: ['ansiedade', 'foco'],
    color: '#FF8C6B',
    icon: '🛑',
    tag: 'Pensamentos · TDAH · Ansiedade',
    forProfiles: ['ansiedade', 'tdah'],
    steps: [
      { title: 'Reconheça a espiral', body: 'Você está em loop? Mesmo pensamento voltando? Só reconheça: "estou em espiral agora".' },
      { title: 'STOP — diga em voz alta', body: 'Diga "STOP" ou bata levemente na mesa. Esse comando rompe o fluxo automático.' },
      { title: 'Ancora no corpo', body: 'Ambos os pés no chão. Palmas pressionando uma superfície. Do mental para o físico.' },
      { title: 'Fato ou suposição?', body: 'Pergunte: "Isso é um fato ou estou supondo?" A maioria das espirais são suposições apresentadas como certezas.' },
      { title: 'Reescreva', body: '"Vou fracassar" → "Não sei o resultado ainda." Não positivo forçado — só mais justo.' },
    ],
  },
  // FOCO/TDAH
  {
    id: 'focus-tdah',
    title: 'Foco em Blocos',
    subtitle: 'Para cérebros que funcionam diferente',
    duration: '25 + 5 min',
    category: ['foco'],
    color: '#00D4A0',
    icon: '🎯',
    tag: 'TDAH · Foco · Produtividade',
    forProfiles: ['tdah'],
    steps: [
      { title: 'O que o TDAH realmente é', body: 'TDAH não é falta de atenção — é regulação de atenção. O cérebro vai para o que é estimulante agora. A técnica cria estimulação artificial.' },
      { title: 'Defina 1 tarefa. Só 1.', body: 'Escreva em papel: "Agora vou fazer _____". Não uma lista. Um alvo único.' },
      { title: 'Cronômetro: 25 minutos', body: 'A pressão do tempo é estimulante para o TDAH. Saber que tem fim torna a tarefa possível.' },
      { title: 'Durante os 25 min', body: 'Quando a mente sair — e vai sair — apenas volte sem se julgar. Anote outros pensamentos num papel ao lado.' },
      { title: 'Pausa ativa: 5 min', body: 'Levante. Beba água. Sacuda as mãos. NÃO fique na tela. Movimento repõe dopamina.' },
      { title: 'Repita com consciência', body: 'Depois de 4 blocos, pausa maior (15–30 min). O cérebro TDAH também esgota.' },
    ],
  },
  // CORPO
  {
    id: 'body-scan',
    title: 'Escaneamento Corporal',
    subtitle: 'Soltar tensão sem perceber que tinha',
    duration: '8–10 min',
    category: ['corpo', 'sono'],
    color: '#7B8FF8',
    icon: '🧘',
    tag: 'Tensão · Sono · Burnout',
    forProfiles: ['burnout', 'estresse'],
    steps: [
      { title: 'Posição', body: 'Deite ou sente com a coluna apoiada. Feche os olhos. Mãos ao lado do corpo.' },
      { title: 'Pés e tornozelos', body: 'Contraia os dedos dos pés por 3 segundos. Solte. Sinta a diferença entre tenso e relaxado.' },
      { title: 'Pernas', body: 'Suba a atenção pelas pernas. Onde há tensão? Respire nesse ponto. Na expiração, deixe derreter.' },
      { title: 'Abdômen', body: 'Solte o umbigo. Deixe a barriga expandir livremente. Respire com o diafragma.' },
      { title: 'Peito e costas', body: 'Sinta o peito expandir e contrair. Perceba os pontos de contato com a superfície.' },
      { title: 'Ombros', body: 'Levante até as orelhas, segure 3s, solte. Onde mais vai a tensão no seu corpo?' },
      { title: 'Rosto', body: 'Franza o rosto inteiro, solte. Testa relaxada, sobrancelhas soltas, mandíbula aberta levemente.' },
      { title: 'Corpo inteiro', body: 'Pesado, quente, presente. Fique aqui por alguns respirações antes de abrir os olhos.' },
    ],
  },
  {
    id: 'movement-anxiety',
    title: 'Descarga Física',
    subtitle: 'O corpo precisa mover o que a mente acumula',
    duration: '5–7 min',
    category: ['corpo', 'ansiedade'],
    color: '#E040FB',
    icon: '⚡',
    tag: 'Movimento · Energia nervosa · Cortisol',
    forProfiles: ['ansiedade', 'estresse', 'tdah'],
    steps: [
      { title: 'Por que funciona', body: 'Ansiedade gera cortisol e adrenalina. Esses hormônios precisam de saída física. Sentar quieto os mantém circulando.' },
      { title: '60s: Pulos no lugar', body: 'Pule no lugar, joelhos altos, por 60 segundos. Uma das formas mais eficazes de resetar o sistema nervoso simpático.' },
      { title: 'Sacudir as mãos', body: 'Como se fosse tirar água dos dedos. 30 segundos. Libera tensão das extremidades.' },
      { title: 'Rotação de ombros', body: 'Para frente 5x, para trás 5x. Devagar. Onde está a resistência?' },
      { title: 'Recuperação', body: 'Tronco inclinado, mãos nos joelhos. Expire completamente. 10 segundos. Volte devagar.' },
      { title: 'Como está agora?', body: 'Perceba a diferença. Isso foi seu sistema nervoso sendo respeitado.' },
    ],
  },
  // SONO
  {
    id: 'sleep-protocol',
    title: 'Protocolo de Sono',
    subtitle: 'Desligar o cérebro que não para',
    duration: '15 min antes de dormir',
    category: ['sono'],
    color: '#3A86FF',
    icon: '🌙',
    tag: 'Insônia · Sono · Ansiedade noturna',
    forProfiles: ['ansiedade', 'burnout'],
    steps: [
      { title: 'Telas fora', body: 'Luz azul bloqueia melatonina. Ideal: nenhuma tela 20 min antes. Se não conseguir, modo quente + brilho mínimo.' },
      { title: 'Temperatura', body: 'O cérebro precisa que a temperatura corporal caia para dormir. Quarto fresco (18–20°C). Descubra os pés.' },
      { title: 'Descarga mental', body: 'Escreva 3 coisas "abertas" na cabeça — não para resolver, só para tirar da memória ativa. O cérebro relaxa quando sabe que não vai esquecer.' },
      { title: 'Respiração 4-7-8', body: 'Inspire 4s, segure 7s, expire 8s. Repita 4 vezes. Ativa o nervo vago. Sinaliza que o perigo passou.' },
      { title: 'Body scan rápido', body: 'Da cabeça aos pés, relaxando conscientemente. Ocupa o córtex prefrontal e bloqueia pensamentos ansiosos.' },
      { title: 'Se voltar a pensar', body: 'Normal. Não lute. "Lá vem um pensamento" — como nuvem passando. Não embarque. Volte à respiração.' },
    ],
  },
  // IDENTIDADE
  {
    id: 'values-map',
    title: 'Mapa de Valores',
    subtitle: 'O que realmente importa para você',
    duration: '10–15 min',
    category: ['identidade'],
    color: '#FFB800',
    icon: '🧭',
    tag: 'Identidade · Propósito · Autoconhecimento',
    steps: [
      { title: 'Por que valores importam', body: 'Ansiedade e burnout frequentemente sinalizam que estamos vivendo segundo os valores de outros, não os nossos. Esse exercício mapeia o seu núcleo real.' },
      { title: 'Lista inicial', body: 'Escreva 10 coisas que importam na sua vida. Não o que "deveria" importar. Inclui coisas pequenas: silêncio, criatividade, aventura, lealdade, beleza.' },
      { title: 'Filtragem: escolha 5', body: 'Olhe para os 10. Se precisasse cortar pela metade, quais permaneceriam? Quais causam dor imaginar perdê-los?' },
      { title: 'Filtragem: escolha 3', body: 'Dos 5, quais são os 3 mais nucleares? Esses são seus valores primários.' },
      { title: 'Teste de coerência', body: 'Pergunta difícil: sua rotina atual reflete esses 3 valores? Onde há divergência? Essa divergência costuma ser fonte de sofrimento.' },
      { title: 'Compromisso mínimo', body: 'Escolha 1 valor. Qual é o menor ato concreto que você pode fazer amanhã que honre esse valor?' },
    ],
  },
  {
    id: 'emotional-vocabulary',
    title: 'Vocabulário Emocional',
    subtitle: 'Nomear é regular',
    duration: '5–8 min',
    category: ['identidade'],
    color: '#E040FB',
    icon: '🔤',
    tag: 'Inteligência Emocional · Autorregulação',
    steps: [
      { title: 'O que a ciência diz', body: 'Pesquisa da UCLA mostrou que nomear uma emoção com precisão reduz sua intensidade em segundos. Quanto mais rico seu vocabulário emocional, mais regulado você é.' },
      { title: 'Além de "bem" e "mal"', body: 'A maioria das pessoas usa 3 palavras para emoções. O roda de emoções de Plutchik tem 40+. Hoje: sinto-me ___. Substitua por algo mais específico.' },
      { title: 'Identificação por zona', body: 'Corpo acelerado + pensamentos rápidos = ansiedade? Ou excitação? Corpo pesado + isolamento = tristeza? Ou esgotamento? O corpo dá pistas.' },
      { title: 'A camada abaixo', body: 'Toda emoção superficial tem uma abaixo. Raiva frequentemente cobre medo ou dor. Indiferença pode cobrir esgotamento. Qual é a camada abaixo do que você sente?' },
      { title: 'Prática diária', body: 'Antes de dormir: 3 emoções que você sentiu hoje — com precisão. Não "tive um dia ruim". "Senti frustração quando... e medo quando..."' },
    ],
  },
  {
    id: 'self-compassion',
    title: 'Autocompaixão',
    subtitle: 'Parar de se tratar como inimigo',
    duration: '5 min',
    category: ['identidade'],
    color: '#FF4466',
    icon: '🤍',
    tag: 'Autoestima · Depressão · Burnout',
    forProfiles: ['depressao', 'burnout'],
    steps: [
      { title: 'O que autocompaixão não é', body: 'Não é vitimismo. Não é se dar desculpas. É tratar você mesmo com a gentileza que você teria com um amigo em sofrimento.' },
      { title: 'Reconheça o sofrimento', body: 'Mão no peito. "Estou passando por algo difícil agora." Não minimize. Não exagere. Só reconheça.' },
      { title: 'Humanize', body: 'Sofrimento é humano. Você não está sozinho. Outras pessoas sentem isso também. Isso não te torna fraco.' },
      { title: 'O amigo imaginário', body: 'Se seu melhor amigo estivesse passando pelo que você está, o que você diria? Com qual tom? Diga isso para você.' },
      { title: 'Frase de cuidado', body: 'Repita 3 vezes: "Que eu me sinta em paz" — ou — "Estou fazendo o que posso" — ou — "Mereço cuidado."' },
    ],
  },
  {
    id: 'neuro-emotional-intelligence',
    title: 'Inteligência Neuroemocional',
    subtitle: 'Treinar o circuito emocional do cérebro',
    duration: '10 min',
    category: ['identidade'],
    color: '#00D4A0',
    icon: '🧠',
    tag: 'Neurociência · Regulação · Desenvolvimento',
    steps: [
      { title: 'O que é o circuito emocional', body: 'A amígdala detecta ameaças e dispara respostas emocionais. O córtex pré-frontal regula essas respostas. Inteligência neuroemocional é fortalecer esse circuito de regulação.' },
      { title: 'Exercício: Pausa de 6 segundos', body: 'Quando uma emoção intensa aparecer, pause 6 segundos antes de reagir. Por quê 6? É o tempo que leva o cortisol para começar a ser reabsorvido. Isso é literalmente fisiológico.' },
      { title: 'Exercício: Rotulagem', body: 'Diga "estou sentindo raiva" em vez de "estou com raiva." A diferença é sutil mas neurológica: a primeira ativa o córtex pré-frontal, a segunda alimenta a amígdala.' },
      { title: 'Exercício: Perspectiva temporal', body: 'Isso vai importar em 5 minutos? Em 5 dias? Em 5 anos? Esse exercício ativa o córtex órbito-frontal, que é o centro da ponderação.' },
      { title: 'Exercício: Co-regulação', body: 'Sistemas nervosos regulam uns aos outros. Estar perto de uma pessoa calma fisicamente regula o seu sistema. Procure isso conscientemente.' },
      { title: 'Treino contínuo', body: 'Inteligência emocional não é um traço fixo — é uma habilidade treinável. Cada vez que você pausa antes de reagir, você está literalmente recabeando circuitos neurais.' },
    ],
  },
  // MENTE
  {
    id: 'journaling-daily',
    title: 'Diário de 3 Perguntas',
    subtitle: 'Clareza em menos de 5 minutos',
    duration: '5 min',
    category: ['identidade'],
    color: '#FFB800',
    icon: '✍️',
    tag: 'Autoconhecimento · Diário',
    steps: [
      { title: 'Regra do diário', body: 'Não analise. Só descreva. O julgamento bloqueia o autoconhecimento. Escreva como se ninguém fosse ler.' },
      { title: 'O que está pesando?', body: 'Uma situação, uma pessoa, um pensamento que volta. Escreva sem filtro. Não precisa fazer sentido.' },
      { title: 'O que esse peso quer me dizer?', body: 'Estresse = "preciso de ajuda". Ansiedade = "algo importa aqui". O que essa emoção está tentando comunicar?' },
      { title: 'Menor passo possível?', body: 'Não resolver tudo. Qual é a ação mínima que alivia esse peso? Uma conversa, um limite, um descanso.' },
      { title: 'Feche com 1 coisa que funcionou', body: 'A gratidão não nega o difícil — ela equilibra a perspectiva. O que funcionou hoje, por menor que seja?' },
    ],
  },
]

// ─── Category config ────────────────────────────────────────────────────────

const CATEGORIES: { key: Category; label: string; icon: string }[] = [
  { key: 'para-voce',   label: 'Para você',    icon: '✦' },
  { key: 'identidade',  label: 'Identidade',   icon: '🧠' },
  { key: 'ansiedade',   label: 'Ansiedade',    icon: '🌊' },
  { key: 'foco',        label: 'Foco',         icon: '🎯' },
  { key: 'sono',        label: 'Sono',         icon: '🌙' },
  { key: 'corpo',       label: 'Corpo',        icon: '⚡' },
  { key: 'sabedoria',   label: 'Sabedoria',    icon: '📚' },
]

// ─── Practice modal ─────────────────────────────────────────────────────────

const POST_MOODS = [
  { key: 'melhor',  label: 'Melhor',      emoji: '😌', color: '#00D4A0' },
  { key: 'igual',   label: 'Igual',       emoji: '😐', color: '#7B8FF8' },
  { key: 'pesado',  label: 'Mais pesado', emoji: '😔', color: '#FF4466' },
]

function PracticeModal({ p, onClose, onComplete }: { p: Practice; onClose: () => void; onComplete: () => void }) {
  const [step, setStep] = useState(0)
  const [postDone, setPostDone] = useState(false)
  const total = p.steps.length

  const handleComplete = () => {
    onComplete()
    setPostDone(true)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: 'rgba(8,8,8,0.97)' }}
    >
      <div
        className="pointer-events-none fixed inset-0"
        style={{ background: `radial-gradient(ellipse 70% 50% at 50% 30%, ${p.color}12 0%, transparent 70%)` }}
      />

      <AnimatePresence mode="wait">
        {postDone ? (
          /* ── Micro check-in pós-prática ── */
          <motion.div key="post"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 gap-6 text-center"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
              className="text-5xl"
            >{p.icon}</motion.div>
            <div>
              <p className="text-white font-bold text-xl mb-1">Prática concluída</p>
              <p className="text-sm font-light" style={{ color: '#606060' }}>Como você está agora?</p>
            </div>
            <div className="flex gap-3 w-full">
              {POST_MOODS.map(m => (
                <button key={m.key} onClick={onClose}
                  className="flex-1 flex flex-col items-center gap-2 py-4 rounded-2xl transition-all active:scale-95"
                  style={{ background: `${m.color}10`, border: `0.5px solid ${m.color}30` }}>
                  <span className="text-2xl">{m.emoji}</span>
                  <span className="text-[11px] font-medium" style={{ color: m.color }}>{m.label}</span>
                </button>
              ))}
            </div>
            <button onClick={onClose} className="text-[11px]" style={{ color: '#404040' }}>
              Pular
            </button>
          </motion.div>
        ) : (
          /* ── Practice steps ── */
          <motion.div key="steps" className="relative z-10 flex flex-col flex-1">
            <div className="flex items-center justify-between px-5 pt-14 pb-4">
              <div>
                <p className="text-[11px] tracking-[2px] uppercase mb-1" style={{ color: p.color, opacity: 0.7 }}>
                  Passo {step + 1} / {total}
                </p>
                <h2 className="font-bold text-white text-xl">{p.title}</h2>
              </div>
              <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center text-lg"
                style={{ background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.1)', color: '#707070' }}>×</button>
            </div>
            <div className="mx-5 h-0.5 rounded-full overflow-hidden mb-8" style={{ background: 'rgba(255,255,255,0.07)' }}>
              <motion.div className="h-full rounded-full"
                animate={{ width: `${((step + 1) / total) * 100}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                style={{ background: p.color }} />
            </div>
            <div className="flex-1 flex flex-col justify-center px-5">
              <AnimatePresence mode="wait">
                <motion.div key={step}
                  initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.3 }}>
                  <div className="mb-4"><span className="text-4xl">{p.icon}</span></div>
                  <h3 className="font-bold text-white mb-4" style={{ fontSize: 24, letterSpacing: -0.5, lineHeight: 1.2 }}>
                    {p.steps[step].title}
                  </h3>
                  <p className="text-lg font-light leading-relaxed" style={{ color: '#909090', lineHeight: 1.7 }}>
                    {p.steps[step].body}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="px-5 pb-12 flex gap-3">
              {step > 0 && (
                <button onClick={() => setStep(s => s - 1)}
                  className="flex-1 py-4 rounded-full font-medium text-sm"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.1)', color: '#707070' }}>
                  ← Anterior
                </button>
              )}
              {step < total - 1 ? (
                <button onClick={() => setStep(s => s + 1)} className="flex-1 py-4 rounded-full font-semibold text-base"
                  style={{ background: p.color, color: '#080808' }}>Próximo</button>
              ) : (
                <button onClick={handleComplete} className="flex-1 py-4 rounded-full font-semibold text-base"
                  style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #CCCCCC 100%)', color: '#0A0A0A' }}>
                  Concluir ✓
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Book quote card ─────────────────────────────────────────────────────────

function BookCard({ q }: { q: BookQuote }) {
  const [open, setOpen] = useState(false)
  return (
    <motion.div
      layout
      onClick={() => setOpen(o => !o)}
      className="px-5 py-4 rounded-2xl cursor-pointer transition-all"
      style={{ background: `${q.color}08`, border: `0.5px solid ${q.color}25` }}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">📖</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white leading-snug mb-1">{q.quote}</p>
          <p className="text-[11px]" style={{ color: q.color, opacity: 0.8 }}>— {q.author}</p>
          <p className="text-[10px] mt-0.5" style={{ color: '#404040' }}>{q.book}</p>
        </div>
        <span className="text-[#404040] text-sm flex-shrink-0 mt-0.5">{open ? '↑' : '↓'}</span>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3" style={{ borderTop: `0.5px solid ${q.color}20` }}>
              <p className="text-xs font-light leading-relaxed" style={{ color: '#707070' }}>
                💡 {q.insight}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Main page ───────────────────────────────────────────────────────────────

const PROFILE_COLOR: Record<string, string> = {
  ansiedade: '#7B8FF8', tdah: '#00D4A0', depressao: '#FF4466',
  burnout: '#FF8C00', estresse: '#FFB800',
}

type ProfileKey = 'ansiedade' | 'estresse' | 'burnout' | 'depressao' | 'tdah'

export default function PracticesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [cat, setCat] = useState<Category>('para-voce')
  const [active, setActive] = useState<Practice | null>(null)

  useEffect(() => {
    const tab = searchParams.get('tab') as Category | null
    if (tab && CATEGORIES.some(c => c.key === tab)) setCat(tab)
  }, [searchParams])
  const { psychProfile, completedPractices, completePractice } = useCareStore()

  const detectedKeys = useMemo<ProfileKey[]>(() => (
    psychProfile?.detectedPatterns
      .map((p): ProfileKey | null => {
        if (p.includes('Ansied') || p.includes('ansied')) return 'ansiedade'
        if (p.includes('TDAH') || p.includes('tdah')) return 'tdah'
        if (p.includes('Depres') || p.includes('depres')) return 'depressao'
        if (p.includes('Burnout') || p.includes('burnout')) return 'burnout'
        if (p.includes('Estresse') || p.includes('estresse')) return 'estresse'
        return null
      }).filter((x): x is ProfileKey => x !== null) ?? []
  ), [psychProfile])

  const personalizedPractices = useMemo(() =>
    PRACTICES.filter(p => p.forProfiles?.some(fp => detectedKeys.includes(fp as ProfileKey)))
  , [detectedKeys])

  const personalizedBooks = useMemo(() =>
    BOOK_QUOTES.filter(q => q.forProfiles?.some(fp => detectedKeys.includes(fp as ProfileKey)))
  , [detectedKeys])

  const filtered = useMemo(() =>
    cat === 'para-voce' ? personalizedPractices
    : cat === 'sabedoria' ? []
    : PRACTICES.filter(p => p.category.includes(cat))
  , [cat, personalizedPractices])

  const completedCount = useMemo(() =>
    PRACTICES.filter(p => completedPractices.includes(p.id)).length
  , [completedPractices])

  return (
    <div className="min-h-screen pb-28">
      <div className="pointer-events-none fixed inset-0 z-0"
        style={{ background: 'radial-gradient(ellipse 60% 30% at 50% 0%, rgba(123,143,248,0.07) 0%, transparent 65%)' }} />

      <div className="relative z-10 px-5 pt-14">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <p className="text-[11px] tracking-[3px] uppercase mb-1" style={{ color: '#505050' }}>Biblioteca</p>
          <h1 className="font-bold text-white mb-1" style={{ fontSize: 28, letterSpacing: -0.5 }}>Práticas</h1>
          <div className="flex items-center gap-2 mb-2">
            <p className="text-sm font-light" style={{ color: '#505050' }}>
              {PRACTICES.length} técnicas baseadas em evidência
            </p>
            {completedCount > 0 && (
              <span className="text-[11px] px-2.5 py-0.5 rounded-full font-medium"
                style={{ background: 'rgba(0,212,160,0.1)', color: '#00D4A0', border: '0.5px solid rgba(0,212,160,0.2)' }}>
                {completedCount}/{PRACTICES.length} concluídas
              </span>
            )}
          </div>
        </motion.div>

        {/* Profile chips */}
        {detectedKeys.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="flex flex-wrap gap-2 mb-5"
          >
            {detectedKeys.map(k => k && (
              <span key={k} className="text-[11px] px-3 py-1.5 rounded-full font-medium"
                style={{ background: `${PROFILE_COLOR[k]}12`, color: PROFILE_COLOR[k], border: `0.5px solid ${PROFILE_COLOR[k]}35` }}>
                Perfil: {k.charAt(0).toUpperCase() + k.slice(1)}
              </span>
            ))}
            <span className="text-[11px] px-3 py-1.5 rounded-full" style={{ color: '#404040' }}>
              ↑ práticas selecionadas para você
            </span>
          </motion.div>
        )}

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5 -mx-5 px-5" style={{ scrollbarWidth: 'none' }}>
          {CATEGORIES.map(c => (
            <button key={c.key} onClick={() => setCat(c.key)}
              className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium transition-all"
              style={{
                background: cat === c.key ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)',
                border: cat === c.key ? '0.5px solid rgba(255,255,255,0.25)' : '0.5px solid rgba(255,255,255,0.07)',
                color: cat === c.key ? '#fff' : '#505050',
              }}>
              <span>{c.icon}</span><span>{c.label}</span>
            </button>
          ))}
        </div>

        {/* "Para você" — fallback para todas as práticas quando perfil ainda não foi gerado */}
        {cat === 'para-voce' && personalizedPractices.length === 0 && (
          <div className="mb-2">
            <div className="flex items-center gap-2 mb-4 px-1">
              <span className="text-[10px] uppercase tracking-widest" style={{ color: '#404040' }}>
                Faça check-ins para personalizar · mostrando todas
              </span>
            </div>
          </div>
        )}

        {/* Practice list */}
        {cat !== 'sabedoria' && (
          <div className="flex flex-col gap-3 mb-4">
            {(cat === 'para-voce'
              ? (personalizedPractices.length > 0 ? personalizedPractices : PRACTICES)
              : filtered
            ).map((p, i) => (
              <motion.button key={p.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setActive(p)}
                className="flex items-start gap-4 px-4 py-4 rounded-2xl text-left transition-all active:scale-[0.98]"
                style={{
                  background: completedPractices.includes(p.id) ? `${p.color}08` : 'rgba(255,255,255,0.03)',
                  border: completedPractices.includes(p.id) ? `0.5px solid ${p.color}30` : '0.5px solid rgba(255,255,255,0.07)',
                }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl relative"
                  style={{ background: `${p.color}12` }}>
                  {p.icon}
                  {completedPractices.includes(p.id) && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px]"
                      style={{ background: p.color, color: '#080808' }}>✓</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-white text-sm">{p.title}</p>
                    {cat === 'para-voce' && !completedPractices.includes(p.id) && (
                      <span className="text-[9px] px-2 py-0.5 rounded-full font-bold"
                        style={{ background: 'rgba(0,212,160,0.15)', color: '#00D4A0' }}>
                        PARA VOCÊ
                      </span>
                    )}
                    {completedPractices.includes(p.id) && (
                      <span className="text-[9px] px-2 py-0.5 rounded-full font-bold"
                        style={{ background: `${p.color}20`, color: p.color }}>
                        FEITA
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-light mb-1.5" style={{ color: '#606060' }}>{p.subtitle}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full"
                      style={{ background: `${p.color}15`, color: p.color }}>
                      {p.duration}
                    </span>
                    <span className="text-[10px]" style={{ color: '#404040' }}>{p.steps.length} passos</span>
                  </div>
                </div>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#404040" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-1">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </motion.button>
            ))}
          </div>
        )}

        {/* Sabedoria — book quotes */}
        {cat === 'sabedoria' && (
          <div className="flex flex-col gap-3 mb-4">
            <p className="text-[11px] tracking-[2px] uppercase mb-1" style={{ color: '#404040' }}>
              {personalizedBooks.length > 0 ? 'Selecionados para o seu perfil' : 'Todos os aprendizados'}
            </p>
            {(personalizedBooks.length > 0 ? personalizedBooks : BOOK_QUOTES).map((q, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <BookCard q={q} />
              </motion.div>
            ))}
          </div>
        )}

        {/* Breathing redirect */}
        <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          onClick={() => router.push('/breathe')}
          className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-left mt-1 mb-4"
          style={{ background: 'rgba(0,212,160,0.04)', border: '0.5px solid rgba(0,212,160,0.2)' }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: 'rgba(0,212,160,0.08)' }}>🌬️</div>
          <div className="flex-1">
            <p className="font-semibold text-white text-sm mb-0.5">Respiração guiada</p>
            <p className="text-xs font-light" style={{ color: '#606060' }}>5 técnicas com timer visual</p>
          </div>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#404040" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </motion.button>
      </div>

      <AnimatePresence>
        {active && <PracticeModal p={active} onClose={() => setActive(null)} onComplete={() => completePractice(active.id)} />}
      </AnimatePresence>

      <BottomNav />
    </div>
  )
}
