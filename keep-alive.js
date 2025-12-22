/**
 * ============================================
 * 🚀 CivicPulse Keep-Alive Script
 * ============================================
 * This script pings your Render deployment every 14 minutes
 * to prevent it from going to sleep on the free tier.
 * 
 * Usage:
 *   node keep-alive.js
 * 
 * Or run in background:
 *   pm2 start keep-alive.js --name civicpulse-keepalive
 * ============================================
 */

const https = require('https');
const http = require('http');

// ⚙️ CONFIGURATION
const CONFIG = {
    // Your Render app URL (change this to your actual URL)
    url: 'https://civicpulse.onrender.com',

    // Ping interval in minutes (14 minutes to be safe, as Render sleeps at 15)
    intervalMinutes: 14,

    // Endpoint to ping (use a lightweight health check endpoint if available)
    endpoint: '/api/health',

    // Enable logging
    logging: true
};

// Calculate interval in milliseconds
const INTERVAL_MS = CONFIG.intervalMinutes * 60 * 1000;

// Format current time
function getTimestamp() {
    return new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'short',
        timeStyle: 'medium'
    });
}

// Log with timestamp
function log(message, type = 'info') {
    if (!CONFIG.logging) return;

    const icons = {
        'info': '📡',
        'success': '✅',
        'error': '❌',
        'warning': '⚠️',
        'start': '🚀'
    };

    console.log(`[${getTimestamp()}] ${icons[type] || '•'} ${message}`);
}

// Ping the server
function pingServer() {
    const fullUrl = CONFIG.url + CONFIG.endpoint;
    const protocol = fullUrl.startsWith('https') ? https : http;

    log(`Pinging ${fullUrl}...`);

    const startTime = Date.now();

    const req = protocol.get(fullUrl, (res) => {
        const responseTime = Date.now() - startTime;

        if (res.statusCode >= 200 && res.statusCode < 400) {
            log(`Server is AWAKE! Status: ${res.statusCode} (${responseTime}ms)`, 'success');
        } else {
            log(`Unexpected status: ${res.statusCode} (${responseTime}ms)`, 'warning');
        }

        // Consume response data to free up memory
        res.resume();
    });

    req.on('error', (err) => {
        log(`Ping failed: ${err.message}`, 'error');
    });

    req.setTimeout(30000, () => {
        req.destroy();
        log('Request timed out (30s)', 'error');
    });
}

// Main function
function startKeepAlive() {
    console.log('\n========================================');
    console.log('   🔥 CivicPulse Keep-Alive Service');
    console.log('========================================\n');

    log(`Target URL: ${CONFIG.url}`, 'start');
    log(`Ping Interval: Every ${CONFIG.intervalMinutes} minutes`, 'start');
    log(`Next ping in ${CONFIG.intervalMinutes} minutes...\n`, 'start');

    // Initial ping
    pingServer();

    // Schedule recurring pings
    setInterval(pingServer, INTERVAL_MS);

    // Keep alive message every hour
    setInterval(() => {
        log(`Keep-alive service running for ${Math.round((Date.now() - startTime) / 3600000)} hours`, 'info');
    }, 3600000);

    const startTime = Date.now();
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n');
    log('Shutting down keep-alive service...', 'warning');
    process.exit(0);
});

process.on('SIGTERM', () => {
    log('Received SIGTERM, shutting down...', 'warning');
    process.exit(0);
});

// Start the service
startKeepAlive();
