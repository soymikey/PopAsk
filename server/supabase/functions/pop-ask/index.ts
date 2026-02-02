import "@supabase/functions-js/edge-runtime.d.ts"
import OpenAI from "openai"

const client = new OpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY"),
})

type Message = { role: "user" | "assistant" | "system"; content: string }

const openAIRequest = async (messages: Message[], model = "gpt-3.5-turbo") => {
  const chatCompletion = await client.chat.completions.create({
    model,
    messages,
    stream: false,
  })
  return chatCompletion.choices[0].message.content ?? ""
}

// 规范响应体: { code, data, message }
const ok = (data: string) =>
  new Response(JSON.stringify({ code: 200, data, message: "ok" }), {
    headers: { "Content-Type": "application/json" },
  })
const err = (code: number, message: string) =>
  new Response(JSON.stringify({ code, data: null, message }), {
    status: code,
    headers: { "Content-Type": "application/json" },
  })

Deno.serve(async (req) => {
  try {
    const body = await req.json() as {
      message?: string
      messages?: Message[]
      model?: string
      stream?: boolean
    }
    let messages: Message[]
    let model = body.model ?? "gpt-3.5-turbo"
    if (Array.isArray(body.messages) && body.messages.length > 0) {
      messages = body.messages
    } else if (typeof body.message === "string") {
      messages = [{ role: "user", content: body.message }]
    } else {
      return err(400, "Missing or invalid message(s): send { message } or { messages }")
    }
    const content = await openAIRequest(messages, model)
    return ok(content)
  } catch (e) {
    console.error(e)
    return err(500, e instanceof Error ? e.message : "OpenAI request failed")
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/pop-ask' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
