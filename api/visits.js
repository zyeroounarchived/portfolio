import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        if (req.method === 'GET') {
            const logs = await redis.lrange('visits:log', 0, 29);
            const parsed = logs.map(entry => JSON.parse(entry));
            return res.status(200).json(parsed);
        }

        if (req.method === 'POST') {
            const ip = req.headers['x-forwarded-for'] || 'unknown';

            // 15-minute rate limit per IP to keep the map diverse and clean
            if (ip !== 'unknown') {
                const rateLimitKey = `visits:ratelimit:${ip}`;
                const isAllowed = await redis.set(rateLimitKey, '1', 'EX', 900, 'NX');
                if (!isAllowed) {
                    return res.status(200).json({ status: 'rate-limited', message: 'Ping throttled' });
                }
            }

            const city = req.headers['x-vercel-ip-city'] ? decodeURIComponent(req.headers['x-vercel-ip-city']) : 'Unknown Grid';
            const country = req.headers['x-vercel-ip-country'] || '??';
            const lat = parseFloat(req.headers['x-vercel-ip-latitude']) || 0;
            const lng = parseFloat(req.headers['x-vercel-ip-longitude']) || 0;

            const visitData = {
                city,
                country,
                lat,
                lng,
                ts: Date.now()
            };

            // Push to Redis and cap at 50 entries
            await redis.lpush('visits:log', JSON.stringify(visitData));
            await redis.ltrim('visits:log', 0, 49);

            return res.status(200).json({ status: 'logged', data: visitData });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Visits Telemetry Error:', error);
        return res.status(500).json({ error: 'Telemetry database error' });
    }
}
