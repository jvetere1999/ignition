/**
 * Ignition Landing Page Worker
 *
 * Serves static landing pages instantly while containers wake up.
 * Provides /_warm endpoint to pre-heat containers in background.
 */

export interface Env {
  FRONTEND_CONTAINER_URL: string;
  BACKEND_API_URL: string;
}

// Static HTML templates
const LANDING_PAGE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ignition - Fuel Your Potential</title>
  <meta name="description" content="Ignition helps you focus, plan, and achieve your goals with ADHD-friendly tools.">
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E🔥%3C/text%3E%3C/svg%3E">
  <style>
    :root {
      --bg: #0a0a0a;
      --text: #fafafa;
      --muted: #888;
      --accent: #f97316;
      --accent-hover: #ea580c;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    header {
      padding: 1rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #222;
    }
    .logo {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--accent);
      text-decoration: none;
    }
    nav a {
      color: var(--muted);
      text-decoration: none;
      margin-left: 2rem;
      transition: color 0.2s;
    }
    nav a:hover { color: var(--text); }
    main {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }
    .hero {
      text-align: center;
      max-width: 600px;
    }
    h1 {
      font-size: 3rem;
      margin-bottom: 1rem;
      background: linear-gradient(135deg, var(--accent), #fbbf24);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .tagline {
      font-size: 1.25rem;
      color: var(--muted);
      margin-bottom: 2rem;
      line-height: 1.6;
    }
    .cta-group {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
    }
    .btn {
      display: inline-block;
      padding: 0.875rem 2rem;
      border-radius: 8px;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s;
    }
    .btn-primary {
      background: var(--accent);
      color: white;
    }
    .btn-primary:hover {
      background: var(--accent-hover);
      transform: translateY(-2px);
    }
    .btn-secondary {
      background: transparent;
      color: var(--text);
      border: 1px solid #333;
    }
    .btn-secondary:hover {
      border-color: var(--accent);
      color: var(--accent);
    }
    footer {
      padding: 2rem;
      text-align: center;
      color: var(--muted);
      font-size: 0.875rem;
      border-top: 1px solid #222;
    }
    footer a {
      color: var(--muted);
      text-decoration: none;
      margin: 0 1rem;
    }
    footer a:hover { color: var(--text); }
  </style>
</head>
<body>
  <header>
    <a href="/" class="logo">🔥 Ignition</a>
    <nav>
      <a href="/about">About</a>
      <a href="/contact">Contact</a>
    </nav>
  </header>
  <main>
    <div class="hero">
      <h1>Fuel Your Potential</h1>
      <p class="tagline">
        Ignition is your ADHD-friendly productivity companion.
        Focus on what matters, celebrate wins, and build momentum that lasts.
      </p>
      <div class="cta-group">
        <a href="/auth/signin" class="btn btn-primary" id="login-btn">Get Started</a>
        <a href="/about" class="btn btn-secondary">Learn More</a>
      </div>
    </div>
  </main>
  <footer>
    <a href="/privacy">Privacy</a>
    <a href="/terms">Terms</a>
    <span>© 2026 Ignition</span>
  </footer>
  <script>
    // Pre-warm containers when user hovers over login
    const btn = document.getElementById('login-btn');
    let warmed = false;
    btn.addEventListener('mouseenter', () => {
      if (!warmed) {
        warmed = true;
        fetch('/_warm', { method: 'POST' }).catch(() => {});
      }
    });
  </script>
</body>
</html>`;

const ABOUT_PAGE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>About - Ignition</title>
  <style>
    :root { --bg: #0a0a0a; --text: #fafafa; --muted: #888; --accent: #f97316; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; }
    header { padding: 1rem 2rem; border-bottom: 1px solid #222; }
    .logo { font-size: 1.5rem; font-weight: 700; color: var(--accent); text-decoration: none; }
    main { max-width: 800px; margin: 0 auto; padding: 4rem 2rem; }
    h1 { font-size: 2.5rem; margin-bottom: 1.5rem; }
    p { color: var(--muted); line-height: 1.8; margin-bottom: 1rem; }
    a { color: var(--accent); }
  </style>
</head>
<body>
  <header><a href="/" class="logo">🔥 Ignition</a></header>
  <main>
    <h1>About Ignition</h1>
    <p>Ignition is built for minds that work differently. We understand that traditional productivity tools don't always fit the way ADHD brains operate.</p>
    <p>Our approach combines gamification, dopamine-friendly feedback loops, and flexible planning to help you stay focused and celebrate every win along the way.</p>
    <p><a href="/">← Back to Home</a></p>
  </main>
</body>
</html>`;

const CONTACT_PAGE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contact - Ignition</title>
  <style>
    :root { --bg: #0a0a0a; --text: #fafafa; --muted: #888; --accent: #f97316; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; }
    header { padding: 1rem 2rem; border-bottom: 1px solid #222; }
    .logo { font-size: 1.5rem; font-weight: 700; color: var(--accent); text-decoration: none; }
    main { max-width: 800px; margin: 0 auto; padding: 4rem 2rem; }
    h1 { font-size: 2.5rem; margin-bottom: 1.5rem; }
    p { color: var(--muted); line-height: 1.8; margin-bottom: 1rem; }
    a { color: var(--accent); }
  </style>
</head>
<body>
  <header><a href="/" class="logo">🔥 Ignition</a></header>
  <main>
    <h1>Contact Us</h1>
    <p>Have questions or feedback? We'd love to hear from you.</p>
    <p>Email: <a href="mailto:hello@ecent.online">hello@ecent.online</a></p>
    <p><a href="/">← Back to Home</a></p>
  </main>
</body>
</html>`;

const PRIVACY_PAGE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Privacy Policy - Ignition</title>
  <style>
    :root { --bg: #0a0a0a; --text: #fafafa; --muted: #888; --accent: #f97316; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; }
    header { padding: 1rem 2rem; border-bottom: 1px solid #222; }
    .logo { font-size: 1.5rem; font-weight: 700; color: var(--accent); text-decoration: none; }
    main { max-width: 800px; margin: 0 auto; padding: 4rem 2rem; }
    h1 { font-size: 2.5rem; margin-bottom: 1.5rem; }
    h2 { font-size: 1.5rem; margin: 2rem 0 1rem; }
    p { color: var(--muted); line-height: 1.8; margin-bottom: 1rem; }
    a { color: var(--accent); }
  </style>
</head>
<body>
  <header><a href="/" class="logo">🔥 Ignition</a></header>
  <main>
    <h1>Privacy Policy</h1>
    <p>Last updated: January 2026</p>
    <h2>Data We Collect</h2>
    <p>We collect only the data necessary to provide our service: your email (via OAuth), and your productivity data (tasks, goals, habits).</p>
    <h2>How We Use Your Data</h2>
    <p>Your data is used solely to power your Ignition experience. We do not sell or share your personal data with third parties.</p>
    <h2>Data Storage</h2>
    <p>Your data is stored securely using industry-standard encryption and hosted on Cloudflare infrastructure.</p>
    <p><a href="/">← Back to Home</a></p>
  </main>
</body>
</html>`;

const TERMS_PAGE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Terms of Service - Ignition</title>
  <style>
    :root { --bg: #0a0a0a; --text: #fafafa; --muted: #888; --accent: #f97316; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; }
    header { padding: 1rem 2rem; border-bottom: 1px solid #222; }
    .logo { font-size: 1.5rem; font-weight: 700; color: var(--accent); text-decoration: none; }
    main { max-width: 800px; margin: 0 auto; padding: 4rem 2rem; }
    h1 { font-size: 2.5rem; margin-bottom: 1.5rem; }
    h2 { font-size: 1.5rem; margin: 2rem 0 1rem; }
    p { color: var(--muted); line-height: 1.8; margin-bottom: 1rem; }
    a { color: var(--accent); }
  </style>
</head>
<body>
  <header><a href="/" class="logo">🔥 Ignition</a></header>
  <main>
    <h1>Terms of Service</h1>
    <p>Last updated: January 2026</p>
    <h2>Acceptance of Terms</h2>
    <p>By using Ignition, you agree to these terms of service.</p>
    <h2>User Responsibilities</h2>
    <p>You are responsible for maintaining the security of your account and for all activities under your account.</p>
    <h2>Service Availability</h2>
    <p>We strive for high availability but do not guarantee uninterrupted service.</p>
    <p><a href="/">← Back to Home</a></p>
  </main>
</body>
</html>`;

// Static pages map
const STATIC_PAGES: Record<string, string> = {
  "/": LANDING_PAGE,
  "/about": ABOUT_PAGE,
  "/contact": CONTACT_PAGE,
  "/privacy": PRIVACY_PAGE,
  "/terms": TERMS_PAGE,
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Health check
    if (path === "/_health") {
      return new Response(JSON.stringify({ status: "ok", service: "landing" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Warm-up endpoint - fires container fetches in background
    if (path === "/_warm" && request.method === "POST") {
      // Fire and forget - warm up both containers
      const warmPromises = [
        fetch(`${env.FRONTEND_CONTAINER_URL}/_health`).catch(() => null),
        fetch(`${env.BACKEND_API_URL}/health`).catch(() => null),
      ];
      
      // Don't await - let them run in background
      Promise.all(warmPromises);
      
      return new Response(JSON.stringify({ status: "warming" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Serve static pages
    const staticPage = STATIC_PAGES[path];
    if (staticPage) {
      return new Response(staticPage, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public, max-age=300", // 5 min cache
        },
      });
    }

    // Auth signin redirect - show loading screen and wake containers
    if (path === "/auth/signin" || path.startsWith("/auth/signin/")) {
      // Extract provider from path if present
      const provider = path.replace("/auth/signin/", "").replace("/auth/signin", "") || "google";
      
      // Show loading screen that wakes containers and redirects
      const authUrl = `${env.BACKEND_API_URL}/auth/signin/${provider}`;
      const containerUrl = env.FRONTEND_CONTAINER_URL;
      
      return new Response(
        `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Signing In - Ignition</title>
  <style>
    :root { --bg: #0a0a0a; --text: #fafafa; --muted: #888; --accent: #f97316; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .container { text-align: center; max-width: 400px; padding: 2rem; }
    h1 { font-size: 2rem; margin-bottom: 0.5rem; color: var(--accent); }
    p { color: var(--muted); margin-bottom: 1rem; }
    .status { font-size: 0.875rem; color: var(--muted); }
    .spinner { width: 48px; height: 48px; border: 3px solid #333; border-top-color: var(--accent); border-radius: 50%; animation: spin 1s linear infinite; margin: 2rem auto; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .progress { width: 100%; height: 4px; background: #333; border-radius: 2px; overflow: hidden; margin: 1rem 0; }
    .progress-bar { height: 100%; background: var(--accent); width: 0%; animation: progress 8s ease-out forwards; }
    @keyframes progress { 0% { width: 0%; } 50% { width: 70%; } 100% { width: 95%; } }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔥 Ignition</h1>
    <div class="spinner"></div>
    <p id="message">Preparing your session...</p>
    <div class="progress"><div class="progress-bar"></div></div>
    <p class="status" id="status">Starting services</p>
  </div>
  <script>
    const authUrl = "${authUrl}";
    const containerUrl = "${containerUrl}";
    const msg = document.getElementById('message');
    const status = document.getElementById('status');
    
    async function warmAndRedirect() {
      status.textContent = 'Waking up services...';
      
      // Wake both containers in parallel
      const warmPromises = [
        fetch(containerUrl + '/_health').then(r => r.ok).catch(() => false),
        fetch('${env.BACKEND_API_URL}/health').then(r => r.ok).catch(() => false),
      ];
      
      msg.textContent = 'Starting containers...';
      status.textContent = 'This may take a few seconds on first visit';
      
      // Poll until containers respond or timeout
      let attempts = 0;
      const maxAttempts = 20; // ~20 seconds max
      
      while (attempts < maxAttempts) {
        const results = await Promise.all([
          fetch(containerUrl + '/_health').then(r => r.ok).catch(() => false),
          fetch('${env.BACKEND_API_URL}/health').then(r => r.ok).catch(() => false),
        ]);
        
        if (results[0] && results[1]) {
          msg.textContent = 'Ready! Redirecting...';
          status.textContent = 'Services online';
          // Both containers ready - redirect to OAuth
          window.location.href = authUrl;
          return;
        }
        
        if (results[1]) {
          status.textContent = 'Backend ready, waiting for frontend...';
        } else if (results[0]) {
          status.textContent = 'Frontend ready, waiting for backend...';
        }
        
        attempts++;
        await new Promise(r => setTimeout(r, 1000));
      }
      
      // Timeout - try redirecting anyway
      msg.textContent = 'Redirecting...';
      status.textContent = 'Services may still be starting';
      window.location.href = authUrl;
    }
    
    warmAndRedirect();
  </script>
</body>
</html>`,
        {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        }
      );
    }

    // For all other paths, proxy to frontend container
    const containerUrl = `${env.FRONTEND_CONTAINER_URL}${path}${url.search}`;
    
    try {
      const response = await fetch(containerUrl, {
        method: request.method,
        headers: request.headers,
        body: request.body,
      });
      
      return response;
    } catch (error) {
      // Container not ready - show loading page
      return new Response(
        `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Loading - Ignition</title>
  <style>
    body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #0a0a0a; color: #fafafa; }
    .container { text-align: center; }
    h1 { font-size: 2rem; margin-bottom: 0.5rem; color: #f97316; }
    p { color: #888; }
    .spinner { width: 40px; height: 40px; border: 3px solid #333; border-top-color: #f97316; border-radius: 50%; animation: spin 1s linear infinite; margin: 2rem auto; }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
  <meta http-equiv="refresh" content="3">
</head>
<body>
  <div class="container">
    <h1>🔥 Ignition</h1>
    <div class="spinner"></div>
    <p>Starting up... This page will refresh automatically.</p>
  </div>
</body>
</html>`,
        {
          status: 503,
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Retry-After": "3",
          },
        }
      );
    }
  },
};
