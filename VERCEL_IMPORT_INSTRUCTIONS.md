# Import to Vercel - Manual Steps

Since the Vercel MCP doesn't support creating new projects, you'll need to import the GitHub repository manually through the Vercel dashboard.

## Step-by-Step Instructions

### 1. Go to Vercel Dashboard

Open: https://vercel.com/new

### 2. Import GitHub Repository

1. Click "Add New..." → "Project"
2. Under "Import Git Repository", find **mre-oracle-edge**
   - If you don't see it, click "Adjust GitHub App Permissions" to grant access
3. Click "Import" next to **Legend1280/mre-oracle-edge**

### 3. Configure Project

**Framework Preset:** Other (or leave as detected)

**Root Directory:** `./` (leave as default)

**Build Command:** Leave empty (Edge Functions don't need build)

**Output Directory:** Leave empty

**Install Command:** Leave empty

### 4. Add Environment Variables

Before clicking "Deploy", add these environment variables:

**Name:** `OPENAI_API_KEY`  
**Value:** `<your-openai-api-key-here>`

**Name:** `MRE_API_KEY`  
**Value:** `87f0d2ebb8c60cdbbdf73a6b899d0b5d8b5c1d71d9a3fdc55b770b87cfab5f2c`

### 5. Deploy

Click "Deploy" button

Vercel will:
- Clone your repository
- Build the Edge Function
- Deploy to production
- Give you a URL like: `https://mre-oracle-edge.vercel.app`

### 6. Test the Deployment

Once deployed, test with curl:

```bash
curl -X POST https://YOUR-DEPLOYMENT-URL.vercel.app/api/oracle/eval \
  -H "Authorization: Bearer 87f0d2ebb8c60cdbbdf73a6b899d0b5d8b5c1d71d9a3fdc55b770b87cfab5f2c" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "What is the capital of France?",
    "baseline_answer": "The capital of France is Paris. It is located in the north-central part of France.",
    "mre_answer": "Paris is the capital of France."
  }'
```

Expected response:
```json
{
  "semantic_similarity": 0.9,
  "instruction_fidelity": 1.0,
  "factual_consistency": 1.0,
  "style_preservation": 0.7,
  "hallucination_risk": 0.0,
  "oracle_score": 0.92,
  "raw_model_explanation": "MRE answer preserves core meaning..."
}
```

### 7. Update Local Frontend

Add to `/home/ubuntu/Mirror/.env`:

```bash
VITE_ORACLE_API_URL=https://YOUR-DEPLOYMENT-URL.vercel.app/api/oracle/eval
VITE_ORACLE_API_KEY=87f0d2ebb8c60cdbbdf73a6b899d0b5d8b5c1d71d9a3fdc55b770b87cfab5f2c
```

---

## Troubleshooting

### Deployment Failed

**Check build logs:**
1. Go to Vercel dashboard
2. Click on your project
3. Click on the failed deployment
4. View "Build Logs" tab

**Common issues:**
- Missing environment variables
- TypeScript errors (check `api/oracle/eval.ts`)
- Invalid `vercel.json` configuration

### 401 Unauthorized When Testing

- Verify `MRE_API_KEY` is set in Vercel environment variables
- Check `Authorization: Bearer` header format
- Ensure API key matches exactly

### 500 Internal Server Error

- Check `OPENAI_API_KEY` is valid
- Verify OpenAI account has credits
- View function logs in Vercel dashboard

---

## Next Steps After Deployment

1. **Save your deployment URL** - You'll need it for the frontend
2. **Test with curl** - Verify it works before integrating
3. **Update frontend** - Add URL and API key to `.env`
4. **Monitor usage** - Check Vercel dashboard for request volume
5. **Set spending limits** - OpenAI dashboard → Usage limits

---

## Security Checklist

- [ ] Environment variables added to Vercel (not in code)
- [ ] API key is secure (256-bit random)
- [ ] `.env` file in `.gitignore`
- [ ] No secrets committed to Git
- [ ] OpenAI spending limit set ($10/month)
- [ ] Vercel budget alert configured ($5/month)

---

## What's Deployed

**Public:**
- ✅ Oracle scoring API endpoint
- ✅ Generic text comparison logic

**Private (NOT deployed):**
- ❌ MRE compression algorithm
- ❌ Kronos temporal intelligence
- ❌ ChromaDB structure and vectors
- ❌ Evaluation methodology
- ❌ Research findings

**Your IP is protected!**
