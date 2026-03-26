// api/reverse-geo.js
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    const { lat, lon } = req.query;
    
    if (!lat || !lon) {
        return res.status(400).json({ error: 'lat und lon werden benötigt' });
    }
    
    const API_KEY = process.env.WEATHER_API_KEY;
    
    const url = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=5&appid=${API_KEY}`;
    
    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`API Fehler: ${response.status}`);
        }
        
        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        console.error('Fehler:', error);
        res.status(500).json({ error: error.message });
    }
}