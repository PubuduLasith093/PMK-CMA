const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();
const PORT = 5000;

// Production:// Update this to your Remote Server Internal IP (VPN IP)
const TARGET_URL = 'http://192.168.1.7:5000';
const TARGET_PORT = 5000;

app.use(cors());

// Health check for local debugging
app.get('/health', (req, res) => {
    res.json({ status: 'Proxy Running', target: TARGET_URL });
});

// Proxy everything to the remote server
app.use('/', createProxyMiddleware({
    target: TARGET_URL,
    changeOrigin: true,
    secure: false, // Ignore self-signed certs on remote server
    ws: true,      // <--- ENABLE WEBSOCKET SUPPORT
    logLevel: 'debug',
    onProxyReq: (proxyReq, req, res) => {
        // console.log(`[Proxy] ${req.method} ${req.path} -> ${TARGET_URL}${req.path}`);
    },
    onError: (err, req, res) => {
        console.error('[Proxy Error]', err);
        res.status(500).send('Proxy Error');
    }
}));

app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 PROXY SERVER STARTED!`);
    console.log(`📱 Connect Mobile App to: http://192.168.1.7:${PORT}`);
    console.log(`🔗 Forwarding requests -> ${TARGET_URL}\n`);
});
