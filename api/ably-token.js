
// Vercel Node Serverless Function - only does auth, no state
// Env var: ABLY_API_KEY from ably.com dashboard
import Ably from 'ably';
export default async function handler(req, res) {
  // CORS for your Vercel frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { clientId } = req.query;
  if (!process.env.ABLY_API_KEY) {
    return res.status(500).json({ error: 'Set ABLY_API_KEY in Vercel env vars' });
  }
  const client = new Ably.Rest(process.env.ABLY_API_KEY);
  const tokenRequest = await client.auth.createTokenRequest({ clientId: clientId || 'anonymous' });
  res.status(200).json(tokenRequest);
}
