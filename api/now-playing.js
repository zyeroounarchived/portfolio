export default async function handler(req, res) {
    const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN } = process.env;
    
    try {
        // 1. Trade the refresh token for a fresh, temporary access token
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
        
        const { access_token } = await tokenResponse.json();

        // 2. Ask Spotify what you are listening to right now
        const nowPlayingRes = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
            headers: { 'Authorization': `Bearer ${access_token}` },
        });

        // 204 means successful request, but nothing is currently playing
        if (nowPlayingRes.status === 204 || nowPlayingRes.status > 400) {
            return res.status(200).json({ isPlaying: false });
        }

        const song = await nowPlayingRes.json();
        
        // If it's a podcast or something goes weird
        if (!song.item) {
            return res.status(200).json({ isPlaying: false });
        }

        // 3. Send the clean data back to your frontend
        return res.status(200).json({
            isPlaying: song.is_playing,
            title: song.item.name,
            artist: song.item.artists.map(a => a.name).join(', '),
            url: song.item.external_urls.spotify
        });

    } catch (error) {
        return res.status(500).json({ error: 'Failed to fetch Spotify data' });
    }
}
