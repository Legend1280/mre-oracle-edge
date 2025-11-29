# MRE Oracle - Vercel Edge Deployment

Oracle evaluator for Memory Resonance Engine (MRE) compression quality scoring.

## Security

- **API Key Authentication:** Required for all requests
- **Tech Protection:** No MRE algorithm or ChromaDB data exposed
- **Privacy:** Only generic text comparison logic deployed

## Deployment Steps

### 1. Generate API Key

```bash
# Generate a secure random API key
openssl rand -hex 32
# Example output: a1b2c3d4e5f6...
```

Save this key - you'll need it for both Vercel and your local frontend.

### 2. Deploy to Vercel

```bash
cd vercel-oracle

# Login to Vercel (if not already)
npx vercel login

# Deploy to production
npx vercel --prod
```

### 3. Configure Environment Variables

After deployment, add secrets via Vercel CLI:

```bash
# Add OpenAI API key
npx vercel env add OPENAI_API_KEY production
# Paste your existing OpenAI key: sk-proj-...

# Add MRE API key (the one you generated in step 1)
npx vercel env add MRE_API_KEY production
# Paste the key from step 1: a1b2c3d4e5f6...
```

Or via Vercel Dashboard:
1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add:
   - `OPENAI_API_KEY` = `sk-proj-...` (your existing key)
   - `MRE_API_KEY` = `a1b2c3d4e5f6...` (generated in step 1)

### 4. Redeploy to Apply Environment Variables

```bash
npx vercel --prod
```

### 5. Test the Deployment

```bash
# Get your deployment URL from Vercel output
# Example: https://mre-oracle-xyz.vercel.app

# Test with your API key
curl -X POST https://YOUR-DEPLOYMENT-URL.vercel.app/api/oracle/eval \
  -H "Authorization: Bearer YOUR-MRE-API-KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "What is the capital of France?",
    "baseline_answer": "The capital of France is Paris. It is located in the north-central part of France.",
    "mre_answer": "Paris is the capital of France."
  }'

# Expected response:
# {
#   "semantic_similarity": 0.9,
#   "instruction_fidelity": 1.0,
#   "factual_consistency": 1.0,
#   "style_preservation": 0.7,
#   "hallucination_risk": 0.0,
#   "oracle_score": 0.92,
#   "raw_model_explanation": "MRE answer preserves core meaning..."
# }
```

## Update Local Frontend

Add the Vercel URL and API key to your local `.env`:

```bash
# In /home/ubuntu/Mirror/.env
VITE_ORACLE_API_URL=https://YOUR-DEPLOYMENT-URL.vercel.app/api/oracle/eval
VITE_ORACLE_API_KEY=YOUR-MRE-API-KEY
```

Update frontend code to use environment variables:

```typescript
// In your Oracle evaluation code
const response = await fetch(import.meta.env.VITE_ORACLE_API_URL, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${import.meta.env.VITE_ORACLE_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    prompt,
    baseline_answer,
    mre_answer,
  }),
});
```

## API Reference

### POST /api/oracle/eval

Evaluate MRE compression quality.

**Headers:**
- `Authorization: Bearer <MRE_API_KEY>` (required)
- `Content-Type: application/json`

**Request Body:**
```json
{
  "prompt": "string (required)",
  "baseline_answer": "string (required)",
  "mre_answer": "string (required)"
}
```

**Response (200 OK):**
```json
{
  "semantic_similarity": 0.0-1.0,
  "instruction_fidelity": 0.0-1.0,
  "factual_consistency": 0.0-1.0,
  "style_preservation": 0.0-1.0,
  "hallucination_risk": 0.0-1.0,
  "oracle_score": 0.0-1.0,
  "raw_model_explanation": "string"
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid or missing API key
- `400 Bad Request` - Missing required fields
- `500 Internal Server Error` - OpenAI API error or processing error

## Security Best Practices

1. **Never commit API keys to Git**
   - Add `.env` to `.gitignore`
   - Use Vercel environment variables

2. **Rotate keys if compromised**
   - Generate new MRE API key
   - Update Vercel environment variables
   - Update local `.env`

3. **Monitor usage**
   - Check Vercel dashboard for request volume
   - Set OpenAI spending limits
   - Enable budget alerts

4. **Rate limiting (optional)**
   - Add Vercel KV for rate limiting
   - Limit to 100 requests/day per key

## Cost Estimation

**Per Oracle Evaluation:**
- OpenAI API: ~$0.0001 (GPT-4o-mini)
- Vercel Compute: ~$0.00013 (Edge Function)
- **Total:** ~$0.00023 per evaluation

**Monthly (1000 evaluations):**
- OpenAI: $0.10
- Vercel: $0.13
- **Total:** $0.23/month

**Free Tier Coverage:**
- Vercel: 100GB bandwidth, 1M invocations (sufficient)
- OpenAI: Pay-as-you-go (set $10/month limit)

## Troubleshooting

### 401 Unauthorized
- Check API key is correct
- Verify `Authorization: Bearer` header format
- Ensure environment variable is set in Vercel

### 500 Internal Server Error
- Check OpenAI API key is valid
- Verify OpenAI account has credits
- Check Vercel function logs

### CORS errors
- Edge Function includes CORS headers
- Should work from localhost
- If issues persist, check browser console

## What's Deployed vs What Stays Private

**Deployed to Vercel (Public):**
- ✅ Generic text comparison API
- ✅ Oracle scoring logic (weights)

**Stays Local (Private):**
- ❌ MRE compression algorithm
- ❌ Kronos temporal intelligence
- ❌ ChromaDB structure and vectors
- ❌ Evaluation methodology
- ❌ Research findings and metrics

**Your IP is protected!** Only the scoring endpoint is public.
