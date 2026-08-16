import { kv } from '@vercel/kv';

export default async function handler(req, res) {
    // Enable CORS just in case
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        if (req.method === 'GET') {
            // Fetch top 10 scores from a sorted set in Vercel KV
            const scores = await kv.zrange('leaderboard', 0, 9, { rev: true, withScores: true });
            
            // Format the output cleanly for the frontend
            const formattedScores = [];
            for (let i = 0; i < scores.length; i += 2) {
                formattedScores.push({ name: scores[i], score: scores[i + 1] });
            }
            
            return res.status(200).json(formattedScores);
        }

        if (req.method === 'POST') {
            const { name, score } = req.body;
            if (!name || typeof score !== 'number') {
                return res.status(400).json({ error: 'Invalid name or score' });
            }

            // Add or update the score in the Vercel KV sorted set
            await kv.zadd('leaderboard', { score: score, member: name.slice(0, 15) });
            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        return res.status(500).json({ error: 'Database error' });
    }
}
