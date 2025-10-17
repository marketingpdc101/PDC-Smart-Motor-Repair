/**
 * Cloudflare Worker - PDC Smart Motor Repair Webhook Proxy
 * 
 * Dual Webhook Architecture:
 * - Internal OA: /webhook/internal → Apps Script (isInternal=true)
 * - External OA: /webhook/external → Apps Script (isInternal=false)
 * 
 * Deploy: wrangler deploy
 */

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx2nmE9w5ea5qBGmfJfK8SCXn4pERD6WPhqoF1PIsxAU09KqdKFhKbTdlmiYh0m4Zpg/exec';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Line-Signature',
    };

    // Handle OPTIONS (preflight)
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // ========================================
    // Route 1: Internal OA Webhook
    // ========================================
    if (path === '/webhook/internal' || path === '/internal') {
      return handleWebhook(request, corsHeaders, true);
    }

    // ========================================
    // Route 2: External OA Webhook
    // ========================================
    if (path === '/webhook/external' || path === '/external') {
      return handleWebhook(request, corsHeaders, false);
    }

    // ========================================
    // Route 3: Health Check
    // ========================================
    if (path === '/health' || path === '/') {
      return new Response(JSON.stringify({
        status: 'ok',
        service: 'PDC Smart Motor Repair Webhook Proxy',
        version: '2.0.0',
        endpoints: {
          internal: '/webhook/internal',
          external: '/webhook/external',
          health: '/health'
        },
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 404 for unknown routes
    return new Response('Not Found', { 
      status: 404,
      headers: corsHeaders
    });
  }
};

/**
 * Handle Webhook - Forward to Apps Script
 */
async function handleWebhook(request, corsHeaders, isInternal) {
  try {
    // Get request body
    const body = await request.text();
    
    // Get LINE signature
    const signature = request.headers.get('X-Line-Signature') || '';

    // Forward to Apps Script with channel flag
    const appsScriptUrl = `${APPS_SCRIPT_URL}?isInternal=${isInternal}`;
    
    const response = await fetch(appsScriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Line-Signature': signature,
        'X-Channel-Type': isInternal ? 'internal' : 'external'
      },
      body: body
    });

    const result = await response.text();

    return new Response(result, {
      status: response.status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Webhook Error:', error);
    
    return new Response(JSON.stringify({
      status: 'error',
      message: error.message,
      channel: isInternal ? 'internal' : 'external',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
}
