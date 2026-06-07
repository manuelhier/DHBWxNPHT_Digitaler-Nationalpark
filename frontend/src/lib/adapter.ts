import OpenAI from 'openai'
import type { ChatModelAdapter } from '@assistant-ui/react'

const client = new OpenAI({
  baseURL: `${window.location.origin}/api/v1/openai`,
  apiKey: 'unused', // auth injected by nginx via Authorization header
  dangerouslyAllowBrowser: true,
})

let slugCache: string | null = null

async function getWorkspaceSlug(): Promise<string> {
  if (slugCache) return slugCache
  const res = await fetch('/anythingllm-slug.json')
  if (!res.ok) throw new Error(`Workspace-Konfiguration nicht gefunden (${res.status})`)
  const data = await res.json()
  if (!data.workspace) throw new Error('Workspace-Konfiguration ungültig')
  slugCache = data.workspace
  return slugCache!
}

export function createAnythingLLMAdapter(onConversationId?: (id: string) => void): ChatModelAdapter {
  return {
    async *run({ messages, abortSignal }) {
      const openaiMessages = messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
          .filter((c): c is { type: 'text'; text: string } => c.type === 'text')
          .map(c => c.text)
          .join(''),
      }))

      const workspace = await getWorkspaceSlug()

      let response: Awaited<ReturnType<typeof client.chat.completions.create>>
      try {
        response = await client.chat.completions.create(
          { model: workspace, messages: openaiMessages, stream: false },
          { signal: abortSignal },
        )
      } catch (err) {
        if (abortSignal?.aborted) return
        const detail = err instanceof Error ? err.message : String(err)
        throw new Error(`Backend nicht erreichbar: ${detail}`)
      }

      onConversationId?.(response.id)
      const text = response.choices[0]?.message?.content ?? ''
      yield { content: [{ type: 'text', text }] }
    },
  }
}
