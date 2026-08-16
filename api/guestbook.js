import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        if (req.method === 'GET') {
            const entries = await redis.lrange('guestbook:entries', 0, 49);
            const parsed = entries.map(e => JSON.parse(e));
            return res.status(200).json(parsed);
        }

        if (req.method === 'POST') {
            let { text } = req.body;
            
            if (!text || typeof text !== 'string') {
                return res.status(400).json({ error: 'Invalid payload' });
            }

            // Strip HTML and cap at 120 chars
            text = text.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim().slice(0, 120);
            if (text.length === 0) return res.status(400).json({ error: 'Message empty' });

            // 10-Minute IP Rate Limiting via Redis
            const ip = req.headers['x-forwarded-for'] || 'unknown';
            if (ip !== 'unknown') {
                const rateLimitKey = `guestbook:ratelimit:${ip}`;
                const isAllowed = await redis.set(rateLimitKey, '1', 'EX', 600, 'NX');
                if (!isAllowed) {
                    return res.status(429).json({ error: 'Rate limit hit. Try again in 10 minutes.' });
                }
            }

            const loc = req.headers['x-vercel-ip-country'] || '??';
            const entry = { text, ts: Date.now(), loc };

            await redis.lpush('guestbook:entries', JSON.stringify(entry));
            return res.status(200).json({ success: true, entry });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error("Guestbook Error:", error);
        return res.status(500).json({ error: 'Database error' });
    }
}
