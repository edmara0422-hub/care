'use client'
import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCareStore } from '@/lib/store'
import BottomNav from '@/components/BottomNav'

type Category = 'todas' | 'testes' | 'ansiedade' | 'tdah' | 'depressao' | 'burnout' | 'estresse' | 'sono' | 'identidade' | 'sabedoria'

interface Practice {
  id: string
  title: string
  subtitle: string
  duration: string
  category: Category[]
  color: string
  icon: string
  tag?: string
  type?: 'test' | 'practice'
  steps: { title: string; body: string }[]
}

interface BookQuote {
  quote: string
  author: string
  book: string
  insight: string
  color: string
}

// ─── TESTES DE AUTOAVALIAÇÃO ─────────────────────────────────────────────────

const TESTS: Practice[] = [
  {
    id: 'test-gad7',
    title: 'Escala de Ansiedade (GAD-7)',
    subtitle: 'Avaliação clínica de ansiedade generalizada',
    duration: '3 min',
    category: ['testes', 'ansiedade'],
    color: '#7B8FF8',
    icon: '📋',
    type: 'test',
    tag: 'Teste validado · Ansiedade',
    steps: [
      { title: 'Sobre este teste', body: 'O GAD-7 é usado mundialmente por psicólogos para medir ansiedade. Responda pensando nas últimas 2 semanas. Não existe resposta certa ou errada.' },
      { title: 'Sentir-se nervoso, ansioso ou no limite', body: 'Nas últimas 2 semanas, com que frequência?\n\n0 = Nenhuma vez\n1 = Vários dias\n2 = Mais da metade dos dias\n3 = Quase todos os dias\n\nAnote seu número.' },
      { title: 'Não conseguir parar ou controlar preocupações', body: 'Com que frequência você não conseguiu parar de se preocupar?\n\n0 = Nenhuma vez\n1 = Vários dias\n2 = Mais da metade dos dias\n3 = Quase todos os dias' },
      { title: 'Preocupar-se demais com diversas coisas', body: 'Com que frequência se preocupou excessivamente com várias coisas diferentes?\n\n0 = Nenhuma\n1 = Vários dias\n2 = Mais da metade\n3 = Quase todos os dias' },
      { title: 'Dificuldade para relaxar', body: 'Com que frequência teve dificuldade para relaxar?\n\n0 = Nenhuma\n1 = Vários dias\n2 = Mais da metade\n3 = Quase todos os dias' },
      { title: 'Ficar tão agitado que é difícil ficar parado', body: 'Com que frequência ficou tão inquieto que era difícil ficar parado?\n\n0 = Nenhuma\n1 = Vários dias\n2 = Mais da metade\n3 = Quase todos os dias' },
      { title: 'Ficar facilmente irritado ou aborrecido', body: 'Com que frequência ficou facilmente irritável?\n\n0 = Nenhuma\n1 = Vários dias\n2 = Mais da metade\n3 = Quase todos os dias' },
      { title: 'Sentir medo como se algo terrível fosse acontecer', body: 'Com que frequência sentiu medo como se algo horrível fosse acontecer?\n\n0 = Nenhuma\n1 = Vários dias\n2 = Mais da metade\n3 = Quase todos os dias' },
      { title: 'Resultado', body: 'Some seus 7 números:\n\n0-4 = Ansiedade mínima ✅\n5-9 = Ansiedade leve 🟡\n10-14 = Ansiedade moderada 🟠\n15-21 = Ansiedade severa 🔴\n\nSe ≥10, considere buscar acompanhamento profissional. Esse teste não substitui diagnóstico.' },
    ],
  },
  {
    id: 'test-phq9',
    title: 'Escala de Depressão (PHQ-9)',
    subtitle: 'Rastreamento de sintomas depressivos',
    duration: '3 min',
    category: ['testes', 'depressao'],
    color: '#FF4466',
    icon: '📋',
    type: 'test',
    tag: 'Teste validado · Depressão',
    steps: [
      { title: 'Sobre este teste', body: 'O PHQ-9 é o padrão-ouro para rastreamento de depressão no mundo. Responda pensando nas últimas 2 semanas.' },
      { title: 'Pouco interesse ou prazer em fazer as coisas', body: 'Nas últimas 2 semanas:\n\n0 = Nenhuma vez\n1 = Vários dias\n2 = Mais da metade dos dias\n3 = Quase todos os dias' },
      { title: 'Sentir-se para baixo, deprimido ou sem esperança', body: '0 = Nenhuma vez\n1 = Vários dias\n2 = Mais da metade dos dias\n3 = Quase todos os dias' },
      { title: 'Dificuldade para pegar no sono, manter o sono ou dormir demais', body: '0 = Nenhuma\n1 = Vários dias\n2 = Mais da metade\n3 = Quase todos os dias' },
      { title: 'Sentir-se cansado ou com pouca energia', body: '0 = Nenhuma\n1 = Vários dias\n2 = Mais da metade\n3 = Quase todos os dias' },
      { title: 'Apetite reduzido ou comer demais', body: '0 = Nenhuma\n1 = Vários dias\n2 = Mais da metade\n3 = Quase todos os dias' },
      { title: 'Sentir-se mal consigo mesmo — fracasso, decepção', body: '0 = Nenhuma\n1 = Vários dias\n2 = Mais da metade\n3 = Quase todos os dias' },
      { title: 'Dificuldade para se concentrar em coisas', body: '0 = Nenhuma\n1 = Vários dias\n2 = Mais da metade\n3 = Quase todos os dias' },
      { title: 'Mover-se ou falar devagar / ficar agitado demais', body: '0 = Nenhuma\n1 = Vários dias\n2 = Mais da metade\n3 = Quase todos os dias' },
      { title: 'Pensamentos de que seria melhor estar morto ou de se machucar', body: '0 = Nenhuma\n1 = Vários dias\n2 = Mais da metade\n3 = Quase todos os dias\n\n⚠️ Se você marcou 1 ou mais nesta pergunta, por favor ligue para o CVV: 188 (24h, gratuito, sigiloso).' },
      { title: 'Resultado', body: 'Some seus 9 números:\n\n0-4 = Mínimo ✅\n5-9 = Leve 🟡\n10-14 = Moderado 🟠\n15-19 = Moderadamente severo 🔴\n20-27 = Severo 🔴🔴\n\nSe ≥10, busque avaliação profissional. Este teste é um rastreamento, não diagnóstico.' },
    ],
  },
  {
    id: 'test-asrs',
    title: 'Rastreio de TDAH (ASRS-5)',
    subtitle: 'Autoavaliação de sintomas de TDAH em adultos',
    duration: '2 min',
    category: ['testes', 'tdah'],
    color: '#00D4A0',
    icon: '📋',
    type: 'test',
    tag: 'Teste validado · TDAH',
    steps: [
      { title: 'Sobre este teste', body: 'O ASRS é desenvolvido pela OMS para rastreamento de TDAH em adultos. Não é diagnóstico — ajuda a identificar se vale buscar avaliação profissional.' },
      { title: 'Dificuldade em manter a atenção em tarefas longas ou repetitivas', body: 'Nos últimos 6 meses:\n\n0 = Nunca\n1 = Raramente\n2 = Às vezes\n3 = Frequentemente\n4 = Muito frequentemente' },
      { title: 'Dificuldade em organizar tarefas e atividades', body: '0 = Nunca\n1 = Raramente\n2 = Às vezes\n3 = Frequentemente\n4 = Muito frequentemente' },
      { title: 'Adiar ou evitar tarefas que exigem esforço mental prolongado', body: '0 = Nunca\n1 = Raramente\n2 = Às vezes\n3 = Frequentemente\n4 = Muito frequentemente' },
      { title: 'Inquietação ou dificuldade em ficar parado', body: '0 = Nunca\n1 = Raramente\n2 = Às vezes\n3 = Frequentemente\n4 = Muito frequentemente' },
      { title: 'Interromper os outros ou falar demais em conversas', body: '0 = Nunca\n1 = Raramente\n2 = Às vezes\n3 = Frequentemente\n4 = Muito frequentemente' },
      { title: 'Resultado', body: 'Some seus 5 números:\n\n0-7 = Baixa probabilidade ✅\n8-13 = Probabilidade moderada 🟡\n14-20 = Alta probabilidade 🟠\n\nSe ≥14, é fortemente recomendado buscar avaliação com neurologista ou psiquiatra especializado em TDAH.' },
    ],
  },
  {
    id: 'test-burnout',
    title: 'Escala de Burnout (MBI)',
    subtitle: 'Avaliação de esgotamento profissional',
    duration: '4 min',
    category: ['testes', 'burnout', 'estresse'],
    color: '#FF8C00',
    icon: '📋',
    type: 'test',
    tag: 'Teste validado · Burnout',
    steps: [
      { title: 'Sobre este teste', body: 'Baseado no Maslach Burnout Inventory, o padrão-ouro para burnout. Responda pensando na sua relação com trabalho/estudos.' },
      { title: 'Sinto-me emocionalmente esgotado pelo meu trabalho', body: '0 = Nunca\n1 = Algumas vezes ao ano\n2 = Uma vez por mês\n3 = Algumas vezes por mês\n4 = Uma vez por semana\n5 = Algumas vezes por semana\n6 = Todo dia' },
      { title: 'Sinto-me usado no final do dia de trabalho', body: '0 = Nunca ... 6 = Todo dia' },
      { title: 'Sinto-me fatigado quando acordo e tenho que enfrentar outro dia', body: '0 = Nunca ... 6 = Todo dia' },
      { title: 'Trabalhar com pessoas o dia todo é realmente estressante', body: '0 = Nunca ... 6 = Todo dia' },
      { title: 'Sinto que estou no meu limite', body: '0 = Nunca ... 6 = Todo dia' },
      { title: 'Sinto que trato algumas pessoas como se fossem objetos', body: '0 = Nunca ... 6 = Todo dia\n\nEssa pergunta mede despersonalização — quando o esgotamento faz você se desconectar emocionalmente dos outros.' },
      { title: 'Sinto que me tornei mais insensível com as pessoas desde que comecei este trabalho', body: '0 = Nunca ... 6 = Todo dia' },
      { title: 'Resultado', body: 'Exaustão (perguntas 1-5): some e divida por 5\nDespersonalização (perguntas 6-7): some e divida por 2\n\nExaustão:\n0-2 = Baixa ✅\n3-4 = Moderada 🟠\n5-6 = Alta 🔴\n\nDespersonalização:\n0-1 = Baixa ✅\n2-3 = Moderada 🟠\n4-6 = Alta 🔴\n\nSe ambos altos → burnout estabelecido. Busque ajuda profissional e considere mudanças na rotina.' },
    ],
  },
  {
    id: 'test-stress',
    title: 'Escala de Estresse (PSS-4)',
    subtitle: 'Percepção de estresse no último mês',
    duration: '2 min',
    category: ['testes', 'estresse'],
    color: '#FFB800',
    icon: '📋',
    type: 'test',
    tag: 'Teste validado · Estresse',
    steps: [
      { title: 'Sobre este teste', body: 'A PSS mede o quanto você percebe sua vida como estressante. Responda pensando no último mês.' },
      { title: 'Com que frequência você ficou chateado por causa de algo inesperado?', body: '0 = Nunca\n1 = Quase nunca\n2 = Às vezes\n3 = Frequentemente\n4 = Muito frequentemente' },
      { title: 'Com que frequência sentiu que era incapaz de controlar coisas importantes?', body: '0 = Nunca\n1 = Quase nunca\n2 = Às vezes\n3 = Frequentemente\n4 = Muito frequentemente' },
      { title: 'Com que frequência se sentiu confiante na capacidade de lidar com problemas?', body: '0 = Muito frequentemente (inverta: 4)\n1 = Frequentemente (inverta: 3)\n2 = Às vezes (inverta: 2)\n3 = Quase nunca (inverta: 1)\n4 = Nunca (inverta: 0)\n\n⚠️ Nesta pergunta, inverta o número!' },
      { title: 'Com que frequência sentiu que as coisas estavam indo do seu jeito?', body: '0 = Muito frequentemente (inverta: 4)\n1 = Frequentemente (inverta: 3)\n2 = Às vezes (inverta: 2)\n3 = Quase nunca (inverta: 1)\n4 = Nunca (inverta: 0)\n\n⚠️ Inverta o número também!' },
      { title: 'Resultado', body: 'Some os 4 números (com as inversões):\n\n0-4 = Estresse baixo ✅\n5-8 = Estresse moderado 🟡\n9-12 = Estresse alto 🟠\n13-16 = Estresse muito alto 🔴\n\nEstresse crônico afeta sistema imunológico, sono e cognição. Se alto, priorize recuperação.' },
    ],
  },
]

// ─── PRÁTICAS ────────────────────────────────────────────────────────────────

const PRACTICES: Practice[] = [
  // ANSIEDADE
  {
    id: 'thought-record',
    title: 'Registro de Pensamentos (TCC)',
    subtitle: 'A técnica mais poderosa da terapia cognitiva',
    duration: '10 min',
    category: ['ansiedade', 'depressao'],
    color: '#7B8FF8',
    icon: '📝',
    tag: 'TCC · Reestruturação cognitiva',
    steps: [
      { title: 'O que é isso', body: 'O Registro de Pensamentos é a ferramenta central da Terapia Cognitivo-Comportamental. Ele te ensina a questionar seus próprios pensamentos — porque a maioria do sofrimento vem de interpretações, não de fatos.' },
      { title: 'Situação', body: 'Descreva a situação que gerou desconforto. Seja específico: onde, quando, com quem, o que aconteceu. Fatos, não interpretações.\n\nEx: "Meu chefe não respondeu meu e-mail desde ontem."' },
      { title: 'Emoção + intensidade', body: 'O que você sentiu? Dê uma nota de 0 a 100.\n\nEx: Ansiedade (80), Frustração (60)\n\nNomear a emoção com precisão já reduz a intensidade — isso é comprovado por neuroimagem.' },
      { title: 'Pensamento automático', body: 'Qual foi o primeiro pensamento que passou pela sua cabeça?\n\nEx: "Ele não gostou do meu trabalho" ou "Vou ser demitido"\n\nEsse pensamento surgiu automaticamente — você não escolheu pensar isso.' },
      { title: 'Evidências a favor', body: 'Quais fatos reais apoiam esse pensamento?\n\nEx: "Ele geralmente responde rápido" — isso é evidência real.\n"Eu sinto que ele não gostou" — isso NÃO é evidência, é sensação.' },
      { title: 'Evidências contra', body: 'Quais fatos reais contradizem esse pensamento?\n\nEx: "Ele estava em reuniões o dia todo", "Semana passada ele elogiou meu trabalho", "Ele pode simplesmente estar ocupado"' },
      { title: 'Pensamento equilibrado', body: 'Reescreva o pensamento original de forma mais justa:\n\n"Ele pode estar ocupado. Não tenho evidência de que não gostou do meu trabalho. Vou esperar até amanhã e, se não responder, pergunto diretamente."\n\nReavalie a emoção agora: Ansiedade (__/100)' },
    ],
  },
  {
    id: 'defusion-act',
    title: 'Defusão Cognitiva (ACT)',
    subtitle: 'Desgrudar dos pensamentos — não lutar contra eles',
    duration: '5 min',
    category: ['ansiedade', 'depressao'],
    color: '#E040FB',
    icon: '🫧',
    tag: 'ACT · Aceitação',
    steps: [
      { title: 'O problema', body: 'Sua mente produz pensamentos o tempo todo. Alguns são úteis. Muitos são lixo. O problema não é tê-los — é acreditar que todos são verdade e agir com base neles.' },
      { title: 'Identifique o pensamento', body: 'Qual pensamento está te incomodando agora? Escreva na sua mente exatamente como ele aparece.\n\nEx: "Eu sou incapaz" ou "Nada vai dar certo"' },
      { title: 'Técnica: "Estou tendo o pensamento de que..."', body: 'Repita o pensamento assim: "Estou tendo o pensamento de que eu sou incapaz."\n\nDepois: "Estou percebendo que estou tendo o pensamento de que eu sou incapaz."\n\nSinta a diferença. Você não É o pensamento — você está OBSERVANDO ele.' },
      { title: 'Técnica: Voz ridícula', body: 'Repita o mesmo pensamento com a voz do Pato Donald. Ou cantando como ópera.\n\nParece bobo? É proposital. Isso quebra o poder emocional que o pensamento tem sobre você sem tentar eliminá-lo.' },
      { title: 'Técnica: Folhas no rio', body: 'Imagine um rio. Cada pensamento é uma folha na água. Você está sentado na margem observando as folhas passarem. Não pule no rio. Não tente parar as folhas. Só observe cada uma ir embora.' },
      { title: 'O ponto', body: 'Defusão não é pensar positivo. É mudar sua RELAÇÃO com os pensamentos. Eles podem existir — e você pode escolher não obedecê-los.' },
    ],
  },
  {
    id: 'worry-time',
    title: 'Hora da Preocupação',
    subtitle: 'Agende suas preocupações — sim, literalmente',
    duration: '15 min/dia',
    category: ['ansiedade'],
    color: '#FFB800',
    icon: '⏰',
    tag: 'Ansiedade · Controle · TCC',
    steps: [
      { title: 'A ciência', body: 'Pesquisas mostram que tentar NÃO se preocupar aumenta a preocupação (efeito rebote). Em vez disso, a TCC propõe: dê um horário fixo para suas preocupações. Fora desse horário, adie-as.' },
      { title: 'Escolha um horário', body: 'Defina 15 minutos por dia para se preocupar. Ex: 18h30. Sempre o mesmo horário. Nunca antes de dormir.' },
      { title: 'Durante o dia', body: 'Quando uma preocupação aparecer, anote numa lista (celular, papel). Diga para si mesmo: "Vou pensar nisso às 18h30." E continue o que estava fazendo.\n\nIsso funciona porque o cérebro relaxa quando sabe que não vai esquecer.' },
      { title: 'Na hora marcada', body: 'Sente-se com a lista. Para cada item:\n1. Ainda me preocupa? (muitos não vão mais)\n2. Posso fazer algo sobre isso? Se sim, defina 1 ação. Se não, pratique aceitar.' },
      { title: 'Resultado após 1 semana', body: 'A maioria das pessoas reporta redução de 40-60% na ansiedade. O cérebro aprende que preocupação tem hora e lugar — e para de sequestrar seu dia.' },
    ],
  },
  // TDAH
  {
    id: 'focus-blocks',
    title: 'Foco em Blocos (Pomodoro TDAH)',
    subtitle: 'Para cérebros que funcionam diferente',
    duration: '25 + 5 min',
    category: ['tdah'],
    color: '#00D4A0',
    icon: '🎯',
    tag: 'TDAH · Foco · Dopamina',
    steps: [
      { title: 'Por que funciona no TDAH', body: 'TDAH não é falta de atenção — é desregulação de dopamina. O cérebro TDAH precisa de NOVIDADE e URGÊNCIA para ativar. O timer cria urgência artificial. A tarefa única elimina a paralisia de decisão.' },
      { title: '1 tarefa. Escrita.', body: 'Escreva em papel: "Agora vou fazer _____". Não uma lista. UM alvo.\n\nPor quê papel? Porque o TDAH esquece a intenção em 30 segundos se não externalizar.' },
      { title: '25 minutos com timer visível', body: 'Use cronômetro ou timer regressivo VISÍVEL. A pressão do tempo ativa dopamina. Saber que tem FIM torna a tarefa suportável.\n\nQuando a mente fugir — e vai fugir — anote o pensamento intruso num papel ao lado e volte. Sem culpa.' },
      { title: 'Pausa ATIVA de 5 min', body: 'Levante. Beba água. Sacuda os braços. Pule no lugar.\n\n❌ NÃO fique no celular (o scroll infinito sequestra a dopamina e mata o próximo bloco)\n✅ Movimento físico repõe dopamina naturalmente' },
      { title: 'Hack: recompensa imediata', body: 'Após cada bloco, dê a si mesmo uma micro-recompensa: um café, 1 música, 2 min de meme. O TDAH funciona por recompensa IMEDIATA, não futura.' },
      { title: 'Depois de 3-4 blocos', body: 'Pausa maior: 20-30 min. O cérebro TDAH esgota mais rápido. Respeite isso. Forçar além gera aversão que sabota o dia seguinte.' },
    ],
  },
  {
    id: 'external-brain',
    title: 'Cérebro Externo',
    subtitle: 'Pare de confiar na memória — externalize tudo',
    duration: '10 min setup',
    category: ['tdah'],
    color: '#3A86FF',
    icon: '🧠',
    tag: 'TDAH · Organização · Sistema',
    steps: [
      { title: 'O problema real', body: 'O TDAH prejudica a memória de trabalho — a capacidade de manter informações "na cabeça". Não é preguiça, é neurologia. A solução: pare de confiar na memória. Externalize TUDO.' },
      { title: 'Capture tudo em 1 lugar', body: 'Escolha UM lugar para anotar tudo: app de notas, caderno, post-its num quadro. Não importa qual. Importa que seja SÓ UM.\n\nRegra: se pensou, anotou. Não "vou lembrar depois". Não vai.' },
      { title: 'A regra dos 2 minutos', body: 'Se algo leva menos de 2 minutos, faça AGORA. Não anote, não adie. O esforço de organizar é maior que o de fazer.\n\nEx: responder mensagem curta, guardar algo, enviar um arquivo.' },
      { title: 'Visual > texto', body: 'O cérebro TDAH processa melhor informação visual. Use:\n- Post-its coloridos\n- Quadro kanban (A fazer / Fazendo / Feito)\n- Alarmes com nome descritivo\n- Objetos no caminho como lembrete físico' },
      { title: 'Revisão diária (5 min)', body: 'Todo dia, mesmo horário: olhe sua lista. Escolha as 3 coisas mais importantes para amanhã. Só 3. O TDAH paralisa com listas longas.\n\nIsso não é produtividade — é sobrevivência funcional.' },
    ],
  },
  // DEPRESSÃO
  {
    id: 'behavioral-activation',
    title: 'Ativação Comportamental',
    subtitle: 'Não espere a motivação — ela vem depois da ação',
    duration: '5 min + ação',
    category: ['depressao'],
    color: '#FF4466',
    icon: '🚀',
    tag: 'Depressão · TCC · Ação',
    steps: [
      { title: 'O ciclo da depressão', body: 'Depressão → "não tenho energia" → evita atividades → menos prazer → mais depressão.\n\nA ativação comportamental QUEBRA esse ciclo: você age ANTES de sentir vontade. A motivação vem DEPOIS, não antes.' },
      { title: 'Lista de atividades prazerosas', body: 'Escreva 10 coisas que já te deram prazer ou sensação de realização, por menor que sejam:\n\nBanho quente, caminhar, cozinhar, ouvir música, arrumar 1 gaveta, ligar para alguém, tomar sol 5 min...' },
      { title: 'Escolha a MENOR', body: 'Qual exige menos energia? Comece por essa. Não pela "melhor". Pela mais fácil.\n\nO objetivo não é sentir prazer — é FAZER. O prazer é consequência, não pré-requisito.' },
      { title: 'Regra dos 5 minutos', body: 'Comprometa-se com apenas 5 minutos. "Vou caminhar 5 minutos." Depois de 5 minutos, decida se continua.\n\n80% das vezes, você continua. A parte difícil é começar.' },
      { title: 'Registre', body: 'Depois de fazer, anote: O que fiz? Como me senti de 0-10 ANTES e DEPOIS?\n\nEm poucos dias, os dados vão mostrar que a ação SEMPRE melhora o humor, mesmo quando "não dava vontade".' },
    ],
  },
  {
    id: 'gratitude-reframe',
    title: 'Reestruturação por Gratidão',
    subtitle: 'Não é "pense positivo" — é balancear a perspectiva',
    duration: '5 min',
    category: ['depressao'],
    color: '#FFB800',
    icon: '✨',
    tag: 'Perspectiva · Neuroplasticidade',
    steps: [
      { title: 'Por que não é autoajuda barata', body: 'Depressão tem um viés de negatividade comprovado: o cérebro filtra informação e destaca o negativo. Isso não é "frescura" — é neurologia.\n\nGratidão intencional treina o cérebro a perceber dados que ele está ignorando.' },
      { title: '3 coisas específicas', body: 'Não genéricas ("sou grato pela saúde"). Específicas:\n\n"A água quente do banho hoje de manhã foi boa."\n"Meu colega me ajudou sem eu pedir."\n"Consegui dormir 7 horas."\n\nEspecificidade ativa mais circuitos neurais.' },
      { title: 'O "apesar de"', body: 'Agora adicione: "Apesar de [dificuldade], [coisa boa] aconteceu."\n\nEx: "Apesar de estar exausto, consegui cozinhar para mim."\n\nIsso não nega o difícil — reconhece os dois lados.' },
      { title: 'Faça isso por 21 dias', body: 'Pesquisa de Shawn Achor (Harvard): após 21 dias consecutivos, o cérebro começa a escanear o ambiente buscando positivo antes do negativo. É literalmente recabeamento neural.' },
    ],
  },
  // BURNOUT
  {
    id: 'energy-audit',
    title: 'Auditoria de Energia',
    subtitle: 'Descubra o que drena e o que recarrega',
    duration: '15 min',
    category: ['burnout', 'estresse'],
    color: '#FF8C00',
    icon: '🔋',
    tag: 'Burnout · Limites · Autocuidado',
    steps: [
      { title: 'O conceito', body: 'Burnout não é "trabalhar demais" — é gastar mais energia do que recarrega por tempo prolongado. Essa auditoria mapeia seus drenos e fontes de energia.' },
      { title: 'Liste suas atividades da semana', body: 'Tudo que você fez nos últimos 7 dias: trabalho, tarefas, reuniões, interações, hobbies, obrigações. Seja honesto — inclua o scroll no celular, o procrastinar, tudo.' },
      { title: 'Classifique cada uma', body: 'Para cada atividade:\n🔴 Drena energia (-3 a -1)\n🟡 Neutra (0)\n🟢 Recarrega energia (+1 a +3)\n\nSeja honesto. Algumas coisas que "deveriam" recarregar na verdade drenam.' },
      { title: 'O balanço', body: 'Some os números. O total é positivo ou negativo?\n\nSe negativo: você está em déficit energético. Não é "falta de força de vontade" — é um sistema insustentável.' },
      { title: 'Ação: a regra do 1-1-1', body: 'Esta semana:\n1. ELIMINE 1 dreno (ou reduza)\n2. ADICIONE 1 fonte de energia\n3. PROTEJA 1 coisa que já funciona\n\nNão mude tudo. Mude 1-1-1 e observe o impacto.' },
    ],
  },
  {
    id: 'boundary-setting',
    title: 'Estabelecer Limites',
    subtitle: 'Dizer não é proteger a sua saúde mental',
    duration: '10 min reflexão',
    category: ['burnout', 'estresse'],
    color: '#C8C8C8',
    icon: '🛡️',
    tag: 'Limites · Burnout · Assertividade',
    steps: [
      { title: 'Por que é tão difícil', body: 'Limites geram culpa porque fomos condicionados a agradar. Mas a falta de limites gera resentimento, exaustão e burnout. Limite não é egoísmo — é sustentabilidade.' },
      { title: 'Identifique onde faltam limites', body: 'Onde você diz "sim" quando quer dizer "não"?\n\nTrabalho: aceitar tarefas extras?\nRelações: estar disponível 24h?\nFamília: ser o responsável por tudo?\nVocê mesmo: pular refeições, sono, lazer?' },
      { title: 'Fórmula do limite gentil', body: '"Entendo que [validação], mas [limite] porque [razão]."\n\nEx: "Entendo que é urgente, mas não consigo assumir isso hoje porque já estou no limite da minha capacidade."\n\nVocê não precisa se justificar em excesso.' },
      { title: 'O desconforto é normal', body: 'Dizer não vai gerar desconforto. Isso é ESPERADO. Não significa que você fez errado.\n\nA pergunta não é "vou me sentir culpado?" — é "consigo sustentar o sim?"' },
      { title: 'Comece pequeno', body: 'Esta semana: diga NÃO para 1 coisa. Só 1. Observe o que acontece.\n\nSpoiler: o mundo não acaba. E você descobre que tinha mais poder do que imaginava.' },
    ],
  },
  // ESTRESSE
  {
    id: 'physiological-sigh',
    title: 'Suspiro Fisiológico',
    subtitle: 'A forma mais rápida de reduzir estresse — 1 respiração',
    duration: '30 segundos',
    category: ['estresse', 'ansiedade'],
    color: '#00D4A0',
    icon: '💨',
    tag: 'Estresse · Imediato · Neurociência',
    steps: [
      { title: 'A ciência (Stanford)', body: 'Andrew Huberman (Stanford) identificou que o suspiro fisiológico é a forma mais rápida de ativar o sistema nervoso parassimpático. Mais rápido que meditação, mais rápido que qualquer técnica de respiração prolongada.' },
      { title: 'Como fazer', body: '1. Inspire pelo nariz normalmente\n2. SEM expirar, inspire MAIS UMA VEZ (dupla inspiração)\n3. Expire LENTAMENTE pela boca, o mais longo possível\n\nUma única repetição já reduz cortisol mensurável.' },
      { title: 'Por que funciona', body: 'A dupla inspiração expande os alvéolos pulmonares que ficam colapsados pelo estresse. Isso aumenta a superfície de troca de CO2, que é o principal sinalizador para o nervo vago desacelerar o coração.' },
      { title: 'Quando usar', body: 'Antes de uma reunião difícil. No meio de uma discussão. Quando sentir o peito apertar. No trânsito.\n\n1-3 repetições. Leva 30 segundos. Ninguém percebe que você está fazendo.' },
    ],
  },
  {
    id: 'cognitive-reappraisal',
    title: 'Reavaliação Cognitiva',
    subtitle: 'Mude a interpretação, mude a emoção',
    duration: '5 min',
    category: ['estresse', 'ansiedade'],
    color: '#7B8FF8',
    icon: '🔄',
    tag: 'TCC · Perspectiva · Regulação',
    steps: [
      { title: 'O princípio', body: 'Não é o evento que causa estresse — é sua INTERPRETAÇÃO do evento. A reavaliação cognitiva é a técnica mais estudada de regulação emocional: funciona e é mensurável por ressonância magnética.' },
      { title: 'A situação estressante', body: 'Descreva o que está te estressando agora. Em 1-2 frases. Fatos.' },
      { title: 'Sua interpretação atual', body: 'O que você está dizendo a si mesmo sobre isso?\n\nEx: "Isso é uma catástrofe", "Eu não vou dar conta", "Tudo está desmoronando"' },
      { title: '3 reinterpretações possíveis', body: 'Force 3 formas alternativas de ver a mesma situação:\n\n1. E se for temporário? (Vai durar para sempre?)\n2. E se houver aprendizado? (O que isso está me ensinando?)\n3. E se não for pessoal? (Isso está acontecendo POR CAUSA de mim ou APESAR de mim?)' },
      { title: 'Escolha a mais útil', body: 'Não a mais "positiva". A mais ÚTIL. A que te permite agir em vez de paralisar.\n\nReavalie o nível de estresse de 0-10. Geralmente cai 2-4 pontos com uma única reavaliação.' },
    ],
  },
  // SONO
  {
    id: 'sleep-protocol',
    title: 'Protocolo de Sono',
    subtitle: 'Baseado em neurociência do sono',
    duration: '15 min antes de dormir',
    category: ['sono'],
    color: '#3A86FF',
    icon: '🌙',
    tag: 'Insônia · Sono · Higiene do sono',
    steps: [
      { title: 'Por que você não dorme', body: 'O sono requer 3 coisas: temperatura corporal baixa, melatonina e ausência de cortisol. A maioria das pessoas sabota as 3 sem saber.' },
      { title: 'Temperatura', body: 'O cérebro precisa que a temperatura CORPORAL caia 1-2°C para iniciar o sono. Quarto fresco (18-20°C). Descubra os pés. Banho quente 90 min ANTES (causa vasodilatação que depois resfria).' },
      { title: 'Luz', body: 'Luz azul suprime melatonina por até 3 horas. Ideal: zero telas 1h antes. Mínimo: modo noturno + brilho mínimo 30 min antes.\n\nDica: luz âmbar/vermelha no quarto sinaliza "fim do dia" para o cérebro.' },
      { title: 'Descarga mental', body: 'Escreva em papel 3 coisas "abertas" na cabeça. Não para resolver — para tirar da memória de trabalho.\n\nO cérebro relaxa quando sabe que registrou. Ele não precisa mais ficar "lembrando".' },
      { title: 'Se não dormir em 20 min', body: 'NÃO fique na cama. Levante, vá para outro cômodo, faça algo monótono com luz baixa. Volte quando sentir sono.\n\nPor quê? Ficar na cama acordado cria associação cama=frustração. Você quer cama=sono.' },
    ],
  },
  // IDENTIDADE / AUTOCONHECIMENTO
  {
    id: 'values-map',
    title: 'Mapa de Valores',
    subtitle: 'O que realmente importa para você',
    duration: '10-15 min',
    category: ['identidade'],
    color: '#FFB800',
    icon: '🧭',
    tag: 'Propósito · ACT · Autoconhecimento',
    steps: [
      { title: 'Por que valores importam', body: 'Ansiedade e burnout frequentemente sinalizam que estamos vivendo segundo os valores de OUTROS. Esse exercício mapeia o seu núcleo real — o que importa quando ninguém está olhando.' },
      { title: 'Liste 10 coisas que importam', body: 'Não o que "deveria" importar. O que DE FATO importa. Inclua coisas pequenas: silêncio, criatividade, aventura, lealdade, beleza, humor, liberdade, segurança, honestidade...' },
      { title: 'Filtre para 5', body: 'Se precisasse cortar pela metade, quais permaneceriam? Quais causam dor imaginar perdê-los?' },
      { title: 'Filtre para 3', body: 'Dos 5, quais são os 3 mais nucleares? Esses são seus valores primários. Eles não mudam com frequência.' },
      { title: 'Teste de coerência', body: 'Sua rotina atual reflete esses 3 valores? Onde há divergência?\n\nEssa divergência é frequentemente a FONTE do mal-estar que você sente mas não consegue nomear.' },
      { title: '1 ação mínima', body: 'Escolha 1 valor. Qual é o menor ato concreto que você pode fazer AMANHÃ que honre esse valor?\n\nNão precisa mudar de vida. Precisa de 1 ato alinhado.' },
    ],
  },
  {
    id: 'emotional-vocabulary',
    title: 'Vocabulário Emocional',
    subtitle: 'Nomear com precisão é regular — comprovado por neuroimagem',
    duration: '5 min',
    category: ['identidade'],
    color: '#E040FB',
    icon: '🔤',
    tag: 'Inteligência Emocional · Regulação',
    steps: [
      { title: 'A ciência', body: 'UCLA: nomear uma emoção com PRECISÃO reduz atividade na amígdala em segundos. Quanto mais rico seu vocabulário emocional, mais regulado você é. "Estou mal" ativa pouco. "Estou frustrado e decepcionado" ativa muito.' },
      { title: 'Além de "bem" e "mal"', body: 'A maioria usa 3 palavras. Tente: irritado, frustrado, decepcionado, ansioso, apreensivo, melancólico, esgotado, entediado, desconectado, sobrecarregado, vulnerável, esperançoso, grato, satisfeito, animado...' },
      { title: 'A camada abaixo', body: 'Toda emoção superficial tem uma embaixo:\n\nRaiva → frequentemente cobre medo ou dor\nIndiferença → pode cobrir esgotamento\nIrritação → pode ser necessidade não atendida\n\nQual é a emoção DEBAIXO do que você sente agora?' },
      { title: 'Prática diária', body: 'Antes de dormir: 3 emoções que você sentiu hoje — com precisão. Não "tive um dia ruim". Sim: "senti frustração quando... e alívio quando... e ansiedade sobre..."' },
    ],
  },
]

// ─── Book Wisdom ────────────────────────────────────────────────────────────

const BOOK_QUOTES: BookQuote[] = [
  { quote: '"O momento presente é o único lugar onde a vida existe."', author: 'Eckhart Tolle', book: 'O Poder do Agora', insight: 'Ansiedade vive no futuro. Depressão vive no passado. Você só existe agora.', color: '#00D4A0' },
  { quote: '"O sofrimento não vem da dor em si, mas da sua luta contra ela."', author: 'Russ Harris', book: 'A Armadilha da Felicidade', insight: 'Aceitar a emoção difícil é mais eficaz do que fugir dela. Isso é a base da ACT.', color: '#7B8FF8' },
  { quote: '"O corpo guarda o placar."', author: 'Bessel van der Kolk', book: 'O Corpo Guarda o Placar', insight: 'Trauma e estresse crônico não ficam só na mente — se instalam fisicamente no corpo.', color: '#FF8C6B' },
  { quote: '"Não é o que acontece com você, mas como você responde."', author: 'Epicteto', book: 'Enquiridion', insight: 'Estoicismo: você não controla eventos, controla sua interpretação deles.', color: '#C8C8C8' },
  { quote: '"Vulnerabilidade não é fraqueza. É a medida mais precisa de coragem."', author: 'Brené Brown', book: 'A Coragem de Ser Imperfeito', insight: 'Esconder o que sentimos custa mais energia do que expressar.', color: '#FF4466' },
  { quote: '"Pessoas com mentalidade de crescimento acreditam que habilidades podem ser desenvolvidas."', author: 'Carol Dweck', book: 'Mindset', insight: 'TDAH não define seu teto. A neuroplasticidade é real.', color: '#00D4A0' },
  { quote: '"Em busca de sentido, o ser humano encontra força para suportar qualquer coisa."', author: 'Viktor Frankl', book: 'Em Busca de Sentido', insight: 'Mesmo em sofrimento extremo, o propósito é a âncora mais poderosa da saúde mental.', color: '#FFB800' },
  { quote: '"Seu sistema nervoso não distingue entre uma ameaça real e imaginada."', author: 'Peter Levine', book: 'O Despertar do Tigre', insight: 'Por isso técnicas corporais funcionam: falam diretamente ao sistema nervoso.', color: '#7B8FF8' },
]

// ─── Category config ────────────────────────────────────────────────────────

const CATEGORIES: { key: Category; label: string; icon: string }[] = [
  { key: 'todas',       label: 'Todas',       icon: '📚' },
  { key: 'testes',      label: 'Testes',      icon: '📋' },
  { key: 'ansiedade',   label: 'Ansiedade',   icon: '🌊' },
  { key: 'tdah',        label: 'TDAH',        icon: '🎯' },
  { key: 'depressao',   label: 'Depressão',   icon: '🌑' },
  { key: 'burnout',     label: 'Burnout',     icon: '🔥' },
  { key: 'estresse',    label: 'Estresse',    icon: '⚡' },
  { key: 'sono',        label: 'Sono',        icon: '🌙' },
  { key: 'identidade',  label: 'Identidade',  icon: '🧭' },
  { key: 'sabedoria',   label: 'Sabedoria',   icon: '📖' },
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
              <p className="text-white font-bold text-xl mb-1">{p.type === 'test' ? 'Teste concluído' : 'Prática concluída'}</p>
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
            <button onClick={onClose} className="text-[11px]" style={{ color: '#404040' }}>Pular</button>
          </motion.div>
        ) : (
          <motion.div key="steps" className="relative z-10 flex flex-col flex-1">
            <div className="flex items-center justify-between px-5 pt-14 pb-4">
              <div>
                <p className="text-[11px] tracking-[2px] uppercase mb-1" style={{ color: p.color, opacity: 0.7 }}>
                  {p.type === 'test' ? 'Pergunta' : 'Passo'} {step + 1} / {total}
                </p>
                <h2 className="font-bold text-white text-xl">{p.title}</h2>
              </div>
              <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center text-lg"
                style={{ background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.1)', color: '#707070' }}>x</button>
            </div>
            <div className="mx-5 h-0.5 rounded-full overflow-hidden mb-8" style={{ background: 'rgba(255,255,255,0.07)' }}>
              <motion.div className="h-full rounded-full"
                animate={{ width: `${((step + 1) / total) * 100}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                style={{ background: p.color }} />
            </div>
            <div className="flex-1 overflow-y-auto px-5">
              <AnimatePresence mode="wait">
                <motion.div key={step}
                  initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.3 }}>
                  <div className="mb-4"><span className="text-4xl">{p.icon}</span></div>
                  <h3 className="font-bold text-white mb-4" style={{ fontSize: 22, letterSpacing: -0.5, lineHeight: 1.2 }}>
                    {p.steps[step].title}
                  </h3>
                  <div className="text-base font-light leading-relaxed whitespace-pre-line" style={{ color: '#909090', lineHeight: 1.7 }}>
                    {p.steps[step].body}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="px-5 pb-12 pt-4 flex gap-3">
              {step > 0 && (
                <button onClick={() => setStep(s => s - 1)}
                  className="flex-1 py-4 rounded-full font-medium text-sm"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.1)', color: '#707070' }}>
                  Anterior
                </button>
              )}
              {step < total - 1 ? (
                <button onClick={() => setStep(s => s + 1)} className="flex-1 py-4 rounded-full font-semibold text-base"
                  style={{ background: p.color, color: '#080808' }}>Proximo</button>
              ) : (
                <button onClick={handleComplete} className="flex-1 py-4 rounded-full font-semibold text-base"
                  style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #CCCCCC 100%)', color: '#0A0A0A' }}>
                  Concluir
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
    <motion.div layout onClick={() => setOpen(o => !o)}
      className="px-5 py-4 rounded-2xl cursor-pointer transition-all"
      style={{ background: `${q.color}08`, border: `0.5px solid ${q.color}25` }}>
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
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="mt-3 pt-3" style={{ borderTop: `0.5px solid ${q.color}20` }}>
              <p className="text-xs font-light leading-relaxed" style={{ color: '#707070' }}>{q.insight}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Main page ───────────────────────────────────────────────────────────────

const ALL_ITEMS = [...TESTS, ...PRACTICES]

export default function PracticesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [cat, setCat] = useState<Category>('todas')
  const [active, setActive] = useState<Practice | null>(null)

  useEffect(() => {
    const tab = searchParams.get('tab') as Category | null
    if (tab && CATEGORIES.some(c => c.key === tab)) setCat(tab)
  }, [searchParams])
  const { completedPractices, completePractice } = useCareStore()

  const filtered = useMemo(() => {
    if (cat === 'todas') return ALL_ITEMS
    if (cat === 'sabedoria') return []
    if (cat === 'testes') return TESTS
    return ALL_ITEMS.filter(p => p.category.includes(cat))
  }, [cat])

  const completedCount = useMemo(() =>
    ALL_ITEMS.filter(p => completedPractices.includes(p.id)).length
  , [completedPractices])

  return (
    <div className="min-h-screen pb-28">
      <div className="pointer-events-none fixed inset-0 z-0"
        style={{ background: 'radial-gradient(ellipse 60% 30% at 50% 0%, rgba(123,143,248,0.07) 0%, transparent 65%)' }} />

      <div className="relative z-10 px-5 pt-14">

        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <p className="text-[11px] tracking-[3px] uppercase mb-1" style={{ color: '#505050' }}>Ferramentas</p>
          <h1 className="font-bold text-white mb-1" style={{ fontSize: 28, letterSpacing: -0.5 }}>Praticas e Testes</h1>
          <div className="flex items-center gap-2 mb-5">
            <p className="text-sm font-light" style={{ color: '#505050' }}>
              {TESTS.length} testes + {PRACTICES.length} praticas
            </p>
            {completedCount > 0 && (
              <span className="text-[11px] px-2.5 py-0.5 rounded-full font-medium"
                style={{ background: 'rgba(0,212,160,0.1)', color: '#00D4A0', border: '0.5px solid rgba(0,212,160,0.2)' }}>
                {completedCount}/{ALL_ITEMS.length} feitas
              </span>
            )}
          </div>
        </motion.div>

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

        {/* Practice/Test list */}
        {cat !== 'sabedoria' && (
          <div className="flex flex-col gap-3 mb-4">
            {filtered.map((p, i) => (
              <motion.button key={p.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
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
                    {p.type === 'test' && (
                      <span className="text-[9px] px-2 py-0.5 rounded-full font-bold"
                        style={{ background: `${p.color}20`, color: p.color }}>
                        TESTE
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
                    {p.tag && <span className="text-[10px]" style={{ color: '#404040' }}>{p.tag}</span>}
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
            {BOOK_QUOTES.map((q, i) => (
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
            <p className="font-semibold text-white text-sm mb-0.5">Respiracao guiada</p>
            <p className="text-xs font-light" style={{ color: '#606060' }}>5 tecnicas com timer visual</p>
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
