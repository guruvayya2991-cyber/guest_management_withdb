import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

function apiGuestPlugin(): Plugin {
  return {
    name: 'api-guest-plugin',
    configureServer(server) {
      server.middlewares.use('/api/guests', (req, res) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const data = body ? JSON.parse(body) : {};
              const name = data.name || data.guest_name || 'API Guest';
              const durationMinutes = Number(data.durationMinutes || data.duration_minutes || 3);
              const now = new Date();
              const expectedOut = new Date(now.getTime() + durationMinutes * 60000);

              const guest = {
                id: `guest-api-${Date.now()}`,
                name,
                durationMinutes,
                inTime: now.toISOString(),
                expectedOutTime: expectedOut.toISOString(),
                status: 'active',
              };

              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 201;
              res.end(JSON.stringify({ success: true, guest }));
            } catch (err) {
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 400;
              res.end(JSON.stringify({ success: false, error: String(err) }));
            }
          });
        } else {
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 200;
          res.end(JSON.stringify({ success: true, message: 'API Guests Endpoint Ready. Use POST to add guests.' }));
        }
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), apiGuestPlugin()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
