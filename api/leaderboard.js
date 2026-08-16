import Redis from 'ioredis';

// Connect using the standard URL Vercel provided in your environment
const redis = new Redis(process.env.REDIS_URL);

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        if (req.method === 'GET') {
            // Fetch top 10 scores using standard Redis syntax
            const scores = await redis.zrevrange('leaderboard', 0, 9, 'WITHSCORES');
            
            let formattedScores = [];
            // ioredis returns a flat array: ['name1', 'score1', 'name2', 'score2']
            for (let i = 0; i < scores.length; i += 2) {
                formattedScores.push({ name: scores[i], score: parseInt(scores[i + 1], 10) });
            }
            
            return res.status(200).json(formattedScores);
        }

        if (req.method === 'POST') {
            const { name, score } = req.body;
            if (!name || typeof score !== 'number') {
                return res.status(400).json({ error: 'Invalid data' });
            }

            // Save the score using standard Redis syntax
            await redis.zadd('leaderboard', score, name.slice(0, 15));
            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error("Redis Error:", error);
        return res.status(500).json({ error: 'Database error', details: error.message });
    }
}
