/**
 * Oracle Evaluator - Vercel Edge Function
 * 
 * Evaluates MRE compression quality using GPT-4o-mini.
 * 
 * Security: API key authentication required.
 * Privacy: No MRE algorithm or ChromaDB data exposed.
 */

export const config = {
  runtime: 'edge',
};

interface OracleRequest {
  prompt: string;
  baseline_answer: string;
  mre_answer: string;
}

interface OracleScores {
  semantic_similarity: number;
  instruction_fidelity: number;
  factual_consistency: number;
  style_preservation: number;
  hallucination_risk: number;
  oracle_score: number;
  raw_model_explanation: string;
}

/**
 * Calculate weighted Oracle score from component scores
 */
function calculateOracleScore(
  semantic_similarity: number,
  instruction_fidelity: number,
  factual_consistency: number,
  style_preservation: number,
  hallucination_risk: number
): number {
  const score = (
    0.4 * semantic_similarity +
    0.25 * instruction_fidelity +
    0.2 * factual_consistency +
    0.15 * style_preservation -
    0.3 * hallucination_risk
  );
  
  // Clamp to [0, 1]
  return Math.max(0.0, Math.min(1.0, score));
}

/**
 * Extract JSON from GPT response (handles markdown code blocks)
 */
function extractJSON(text: string): any {
  try {
    // Try direct parse first
    return JSON.parse(text);
  } catch {
    // Try extracting from markdown code block
    if (text.includes('```json')) {
      const start = text.indexOf('```json') + 7;
      const end = text.indexOf('```', start);
      return JSON.parse(text.substring(start, end).trim());
    } else if (text.includes('```')) {
      const start = text.indexOf('```') + 3;
      const end = text.indexOf('```', start);
      return JSON.parse(text.substring(start, end).trim());
    } else if (text.includes('{') && text.includes('}')) {
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}') + 1;
      return JSON.parse(text.substring(start, end));
    }
    throw new Error('No JSON found in response');
  }
}

export default async function handler(req: Request): Promise<Response> {
  // CORS headers for local development
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    // 1. Authenticate with API key
    const authHeader = req.headers.get('authorization');
    const apiKey = authHeader?.replace('Bearer ', '');
    
    if (!apiKey || apiKey !== process.env.MRE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid API key' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // 2. Parse request body
    const body: OracleRequest = await req.json();
    const { prompt, baseline_answer, mre_answer } = body;

    if (!prompt || !baseline_answer || !mre_answer) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: prompt, baseline_answer, mre_answer' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // 3. Construct evaluation prompt for GPT
    const systemPrompt = `You are an evaluation model. Your task is to compare two answers to the same user prompt.

You must output strict JSON, no prose, with numeric scores between 0 and 1.

Definitions:
- semantic_similarity: how close the two answers are in meaning (0 = completely different, 1 = identical meaning).
- instruction_fidelity: how well the MRE answer follows the original user instructions compared to baseline (0 = ignores instructions, 1 = perfectly follows).
- factual_consistency: does the MRE answer preserve the same factual claims as the baseline (0 = totally different/wrong facts, 1 = same correct facts).
- style_preservation: how similar the style, tone, and structure are (0 = totally different style, 1 = very similar style).
- hallucination_risk: if the MRE answer introduces unsupported claims or fabrications relative to the baseline and prompt (0 = no hallucinations, 1 = severe hallucinations).

Return strict JSON with this exact structure (no additional text):
{
  "semantic_similarity": <0-1>,
  "instruction_fidelity": <0-1>,
  "factual_consistency": <0-1>,
  "style_preservation": <0-1>,
  "hallucination_risk": <0-1>,
  "explanation": "<short justification>"
}`;

    const userPrompt = `Original User Prompt:
${prompt}

Baseline Answer:
${baseline_answer}

MRE Answer:
${mre_answer}

Evaluate the MRE answer compared to the baseline answer. Output strict JSON only.`;

    // 4. Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.0,
        max_tokens: 500,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('OpenAI API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'OpenAI API error', details: errorText }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const openaiResult = await openaiResponse.json();
    const rawResponse = openaiResult.choices[0].message.content;

    // 5. Parse GPT response
    const scores = extractJSON(rawResponse);

    // 6. Validate and extract scores
    const semantic_similarity = parseFloat(scores.semantic_similarity || 0);
    const instruction_fidelity = parseFloat(scores.instruction_fidelity || 0);
    const factual_consistency = parseFloat(scores.factual_consistency || 0);
    const style_preservation = parseFloat(scores.style_preservation || 0);
    const hallucination_risk = parseFloat(scores.hallucination_risk || 0);
    const explanation = scores.explanation || 'No explanation provided';

    // Validate ranges
    if (semantic_similarity < 0 || semantic_similarity > 1 ||
        instruction_fidelity < 0 || instruction_fidelity > 1 ||
        factual_consistency < 0 || factual_consistency > 1 ||
        style_preservation < 0 || style_preservation > 1 ||
        hallucination_risk < 0 || hallucination_risk > 1) {
      return new Response(
        JSON.stringify({ error: 'Invalid scores from GPT (out of range 0-1)' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // 7. Calculate Oracle score
    const oracle_score = calculateOracleScore(
      semantic_similarity,
      instruction_fidelity,
      factual_consistency,
      style_preservation,
      hallucination_risk
    );

    // 8. Return results
    const result: OracleScores = {
      semantic_similarity,
      instruction_fidelity,
      factual_consistency,
      style_preservation,
      hallucination_risk,
      oracle_score,
      raw_model_explanation: explanation,
    };

    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Oracle evaluation error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}
