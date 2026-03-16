import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

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
  return `Você é CARE, um assistente de apoio emocional empático, humano e direto.
Você conversa em português brasileiro informal, com calor humano e sem jargão clínico excessivo.

PERFIL DO USUÁRIO:
- Nome: ${ctx.name ?? 'não informado'}
- Score emocional atual: ${ctx.score}/100
- Humor registrado: ${ctx.mood || 'não informado'}
- Padrões detectados: ${patternText}
- Tendência recente: ${trendMap[ctx.trend]}
- Streak de check-ins: ${ctx.streak} dias consecutivos

DIRETRIZES:
- Responda com no máximo 3 parágrafos curtos
- Seja empático mas prático — ofereça uma reflexão ou micro-ação concreta quando possível
- Use o perfil para personalizar, mas nunca "diagnóstique"
- Quando relevante, sugira práticas disponíveis no app (respiração 4-7-8, box breathing, etc.)
- Se o usuário demonstrar interesse em terapia, valide e encoraje buscar um profissional
- Nunca minimize o sofrimento nem use frases feitas como "tudo vai ficar bem"

IMPORTANTE: Em caso de crise (menção de suicídio, automutilação, desespero extremo), responda com cuidado e direcione imediatamente ao CVV: 188 (24h, gratuito, sigiloso).`
}

export async function POST(req: NextRequest) {
  try {
    const body: RequestBody = await req.json()
    const { messages, context } = body

    if (!messages || !context) {
      return new Response('Missing messages or context', { status: 400 })
    }

    const systemPrompt = buildSystemPrompt(context)

    const stream = anthropic.messages.stream({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: systemPrompt,
      messages,
    })

    const readable = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(chunk.delta.text))
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
