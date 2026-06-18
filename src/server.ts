import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

function validateEnvironment(): void {
  const requiredVars: string[] = [];
  if (process.env.SUPABASE_URL) requiredVars.push('SUPABASE_ANON_KEY');
  if (process.env.SUPABASE_ANON_KEY) requiredVars.push('SUPABASE_URL');

  const missing = requiredVars.filter((k) => !process.env[k]);
  if (missing.length > 0 && missing.length < requiredVars.length) {
    console.warn(`[env] Warning: Missing complementary env vars: ${missing.join(', ')}`);
  }

  if (!process.env.SUPABASE_URL && !process.env.SUPABASE_ANON_KEY) {
    console.log('[env] Running in demo mode (no Supabase configured)');
  }
}

function gracefulShutdown(signal: string): void {
  console.log(`\n[server] Received ${signal}. Starting graceful shutdown...`);
  process.exit(0);
}

app.prepare().then(() => {
  validateEnvironment();

  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);

      // Health check endpoint
      if (parsedUrl.pathname === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
        return;
      }

      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  });

  server.once('error', (err) => {
    console.error(err);
    process.exit(1);
  });

  server.listen(port, () => {
    console.log(
      `> Server listening at http://${hostname}:${port} as ${
        dev ? 'development' : process.env.NODE_ENV || 'production'
      }`,
    );
  });

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
});
