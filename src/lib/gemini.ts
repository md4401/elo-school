const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`

export interface GeminiQuestion {
  text: string
  options?: string[]
  correct_option?: number
  correct_boolean?: boolean
  explanation?: string
}

function buildPrompt(quizType: string, count: number, title: string, subjectName: string): string {
  const ctx = `Gere questões para um simulado escolar brasileiro. Título: "${title}". Disciplina: ${subjectName}. Nível: ensino médio. Retorne SOMENTE um array JSON válido, sem markdown, sem explicação extra.`

  if (quizType === 'verdadeiro_falso') {
    return `${ctx}
Formato: [{"text":"afirmação","correct_boolean":true,"explanation":"motivo"}]
Gere ${count} afirmações verdadeiro/falso.`
  }

  if (quizType === 'dissertativa') {
    return `${ctx}
Formato: [{"text":"pergunta dissertativa","explanation":"pontos esperados na resposta"}]
Gere ${count} questões dissertativas.`
  }

  const optCount = quizType === 'enem' ? 5 : 4
  const letters = ['A', 'B', 'C', 'D', 'E'].slice(0, optCount).map((l) => `"Alternativa ${l}"`)

  return `${ctx}
Formato: [{"text":"enunciado","options":[${letters.join(',')}],"correct_option":0,"explanation":"motivo"}]
Regras: correct_option é o índice 0-${optCount - 1} da alternativa correta. Crie alternativas plausíveis e variadas.
Gere ${count} questões de múltipla escolha com ${optCount} alternativas.`
}

export async function generateQuizQuestions(
  quizType: string,
  count: number,
  title: string,
  subjectName: string,
): Promise<GeminiQuestion[]> {
  const key = GEMINI_KEY
  if (!key) throw new Error('VITE_GEMINI_API_KEY não configurado')

  const response = await fetch(`${GEMINI_URL}?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: buildPrompt(quizType, count, title, subjectName) }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err?.error?.message ?? `Gemini API error ${response.status}`)
  }

  const result = await response.json()
  const raw: string = result.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

  // Extract JSON array from the response (Gemini sometimes wraps in markdown)
  const jsonMatch = raw.match(/\[[\s\S]*\]/)
  if (!jsonMatch) throw new Error('Resposta da IA não contém JSON válido')

  return JSON.parse(jsonMatch[0]) as GeminiQuestion[]
}
