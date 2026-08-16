import { kv } from '@vercel/kv';

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        if (req.method === 'GET') {
            // Fetch top 10 scores
            const scores = await kv.zrange('leaderboard', 0, 9, { rev: true, withScores: true });
            
            let formattedScores = [];
            if (scores && scores.length > 0) {
                // Handle different Vercel KV data formats safely
                if (typeof scores[0] === 'object') {
                    formattedScores = scores.map(s => ({ name: s.member, score: s.score }));
                } else {
                    for (let i = 0; i < scores.length; i += 2) {
                        formattedScores.push({ name: scores[i], score: scores[i + 1] });
                    }
                }
            }
            return res.status(200).json(formattedScores);
        }

        if (req.method === 'POST') {
            const { name, score } = req.body;
            if (!name || typeof score !== 'number') {
                return res.status(400).json({ error: 'Invalid name or score' });
            }

            // Save the score
            await kv.zadd('leaderboard', { score: score, member: name.slice(0, 15) });
            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error("KV Error:", error);
        return res.status(500).json({ error: 'Database error', details: error.message });
    }
}
