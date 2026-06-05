import OpenAI from 'openai'
import type { ChatModelAdapter } from '@assistant-ui/react'

const client = new OpenAI({
  baseURL: `${window.location.origin}/api/v1/openai`,
  apiKey: 'unused', // auth injected by nginx via Authorization header
  dangerouslyAllowBrowser: true,
})

export async function submitFeedback(messageId: string, rating: 'up' | 'down', comment?: string) {
  try {
    await fetch('/api/v1/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message_id: messageId, rating, comment }),
    })
  } catch {
    // feedback is best-effort, never surface errors to the user
  }
}

export function createAdapter(onConversationId?: (id: string) => void): ChatModelAdapter {
  return {
    async *run({ messages, abortSignal }) {
      const openaiMessages = messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
          .filter((c): c is { type: 'text'; text: string } => c.type === 'text')
          .map(c => c.text)
          .join(''),
      }))

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let stream: any
      try {
        stream = await client.chat.completions.create(
          { model: import.meta.env.VITE_ANYTHINGLLM_WORKSPACE_NAME ?? 'hohe-tauern', messages: openaiMessages, stream: true },
          { signal: abortSignal },
        )
      } catch (err) {
        if (abortSignal?.aborted) return
        const detail = err instanceof Error ? err.message : String(err)
        throw new Error(`Backend nicht erreichbar: ${detail}`)
      }

      let accumulated = ''
      let idReported = false
      try {
        for await (const chunk of stream) {
          if (!idReported && chunk.id) {
            onConversationId?.(chunk.id)
            idReported = true
          }
          const delta = chunk.choices[0]?.delta?.content
          if (delta) {
            accumulated += delta
            yield { content: [{ type: 'text', text: accumulated }] }
          }
        }
      } catch (err) {
        if (abortSignal?.aborted) return
        throw err
      }
    },
  }
}
