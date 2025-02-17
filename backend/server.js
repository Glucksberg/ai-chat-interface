import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();

console.log('Starting server...');

// Middleware
app.use(cors({
    origin: process.env.ALLOWED_ORIGIN,
    methods: ['POST', 'OPTIONS']
}));

app.use(express.json());

// Chat endpoint
app.post('/api/chat', async (req, res) => {
    console.log('Received chat request:', req.body);
    try {
        console.log('Sending request to Perplexity API...');
        const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
                'Content-Type': 'application/json',
                'accept': 'application/json'
            },
            body: JSON.stringify({
                model: "sonar-pro",
                messages: req.body.messages,
                stream: false,
                max_tokens: 1024,
                temperature: 0.7
            })
        });

        console.log('Perplexity API response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Perplexity API error:', errorText);
            throw new Error(`API responded with status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Perplexity API response:', data);
        res.json(data);
    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).json({ 
            error: 'Failed to process request',
            message: error.message 
        });
    }
});

// Options endpoint for connection testing
app.options('/api/chat', (req, res) => {
    res.status(200).end();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
