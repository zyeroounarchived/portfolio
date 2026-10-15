export default async function handler(req, res) {
    const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN } = process.env;

    try {
        const basic = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');
        const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${basic}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: SPOTIFY_REFRESH_TOKEN,
            }),
        });

        if (!tokenResponse.ok) {
            return res.status(200).json({ isPlaying: false });
        }

        const { access_token } = await tokenResponse.json();
        if (!access_token) {
            return res.status(200).json({ isPlaying: false });
        }

        const nowPlayingRes = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
            headers: { 'Authorization': `Bearer ${access_token}` },
        });

        if (nowPlayingRes.status === 204 || !nowPlayingRes.ok) {
            return res.status(200).json({ isPlaying: false });
        }

        const song = await nowPlayingRes.json();
        if (!song.item) {
            return res.status(200).json({ isPlaying: false });
        }

        return res.status(200).json({
            isPlaying: song.is_playing,
            title: song.item.name,
            artist: song.item.artists.map(a => a.name).join(', '),
            url: song.item.external_urls.spotify
        });
    } catch (error) {
        console.error('Spotify request failed:', error);
        return res.status(500).json({ error: 'Failed to fetch Spotify data' });
    }
}
