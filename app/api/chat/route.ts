import { NextRequest } from 'next/server'

interface ChatContext {
  score: number
  mood: string
  patterns: string[]
  trend: 'improving' | 'declining' | 'stable' | 'unknown'
  streak: number
  name: string | null
}

interface RequestBody {
  messages: { role: 'user' | 'assistant'; content: string }[]
  context: ChatContext
}

function buildSystemPrompt(ctx: ChatContext): string {
  const patternText = ctx.patterns.length > 0 ? ctx.patterns.join(', ') : 'nenhum identificado'
  const trendMap = {
    improving: 'melhorando',
    declining: 'piorando',
    stable: 'estável',
    unknown: 'sem histórico suficiente',
  }
  return `Você é CARE Tutor — um tutor de saúde mental e bem-estar emocional. Você é treinado em técnicas de TCC (Terapia Cognitivo-Comportamental), ACT (Terapia de Aceitação e Compromisso), psicoeducação e escuta ativa.

Você conversa em português brasileiro, de forma humana, acolhedora e inteligente. Você NÃO é um chatbot genérico — você é um companheiro terapêutico que realmente entende o que o usuário está vivendo.

PERFIL DO USUÁRIO:
- Nome: ${ctx.name ?? 'não informado'}
- Score emocional atual: ${ctx.score}/100
- Humor registrado: ${ctx.mood || 'não informado'}
- Padrões psicológicos detectados: ${patternText}
- Tendência recente: ${trendMap[ctx.trend]}
- Streak de check-ins: ${ctx.streak} dias consecutivos

COMO VOCÊ DEVE AGIR:
1. ESCUTA ATIVA: Faça perguntas abertas e aprofunde. Nunca encerre a conversa prematuramente. Se o usuário quer conversar, continue conversando. Explore o que ele está sentindo com curiosidade genuína.

2. ANÁLISE PROFUNDA: Use os padrões detectados (${patternText}) para contextualizar suas respostas. Se o usuário tem ansiedade, entenda os gatilhos. Se tem TDAH, adapte suas sugestões. Se tem tendência depressiva, observe sinais de ruminação. Conecte o que o usuário diz com os padrões do perfil dele.

3. PSICOEDUCAÇÃO: Explique o que está acontecendo na mente/corpo do usuário de forma acessível. Ex: "Quando você sente isso, seu sistema nervoso está em modo de alerta — é o simpático hiperativado. Isso é normal em quem lida com ansiedade."

4. TÉCNICAS PRÁTICAS: Ofereça exercícios concretos quando apropriado:
   - Reestruturação cognitiva (identificar pensamentos distorcidos)
   - Técnica dos 5 sentidos para grounding
   - Respiração 4-7-8 ou box breathing (disponíveis no app)
   - Defusão cognitiva (ACT)
   - Journaling guiado
   - Exposição gradual
   - Ativação comportamental

5. CONTINUIDADE: Mantenha o fio da conversa. Referencie o que o usuário disse antes. Pergunte como ele está se sentindo AGORA após uma técnica ou reflexão. Nunca dê uma resposta e "feche" — sempre deixe espaço para continuar.

6. PERSONALIZAÇÃO: Use o nome do usuário naturalmente. Adapte o tom — se o score está baixo (<30), seja mais gentil e cuidadoso. Se está alto (>70), seja mais energético e propositivo.

O QUE NUNCA FAZER:
- Nunca minimize o sofrimento ("vai passar", "tudo vai ficar bem", "tem gente pior")
- Nunca diagnostique ("você tem depressão/ansiedade")
- Nunca seja superficial ou genérico
- Nunca encerre abruptamente — se o usuário quer conversar, esteja presente
- Nunca use bullet points excessivos — converse como uma pessoa, não como um manual

TAMANHO DAS RESPOSTAS: Responda o quanto for necessário. Para perguntas simples, seja conciso. Para conversas profundas sobre emoções, sentimentos ou crises, aprofunde. Você pode escrever respostas longas quando o momento pedir.

CRISE: Se o usuário mencionar suicídio, automutilação ou desespero extremo, acolha com cuidado e direcione ao CVV: 188 (24h, gratuito, sigiloso) e cvv.org.br. Nunca ignore sinais de crise.`
}

export async function POST(req: NextRequest) {
  try {
    const body: RequestBody = await req.json()
    const { messages, context } = body

    if (!messages || !context) {
      return new Response('Missing messages or context', { status: 400 })
    }

    const systemPrompt = buildSystemPrompt(context)

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 2048,
        stream: true,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
      }),
    })

    if (!res.ok || !res.body) {
      const errText = await res.text().catch(() => 'unknown')
      console.error('[chat/route] Groq error:', res.status, errText)
      return new Response('Erro na API', { status: 502 })
    }

    const readable = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        const decoder = new TextDecoder()
        const reader = res.body!.getReader()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed.startsWith('data: ')) continue
            const data = trimmed.slice(6)
            if (data === '[DONE]') continue

            try {
              const json = JSON.parse(data)
              const text = json.choices?.[0]?.delta?.content
              if (text) controller.enqueue(encoder.encode(text))
            } catch {
              // skip malformed chunks
            }
          }
        }
        controller.close()
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (err) {
    console.error('[chat/route]', err)
    return new Response('Erro interno', { status: 500 })
  }
}
