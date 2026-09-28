import { addGuest } from '@/lib/guestOps';

// Intercept browser fetch('/api/guests') requests so programmatic client calls
// immediately create real IndexedDB records and trigger live dashboard updates.
export function setupClientApi(): void {
  if (typeof window === 'undefined') return;

  const originalFetch = window.fetch;
  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

    if (urlStr.endsWith('/api/guests') || urlStr.includes('/api/guests')) {
      const method = (init?.method || (typeof input === 'object' && 'method' in input ? input.method : 'GET')).toUpperCase();

      if (method === 'POST') {
        try {
          const bodyText = typeof init?.body === 'string' ? init.body : '';
          const data = bodyText ? JSON.parse(bodyText) : {};
          const name = data.name || data.guest_name || 'API Guest';
          const durationMinutes = Number(data.durationMinutes || data.duration_minutes || 3);
          const remarks = data.remarks || 'API Entry';

          const created = await addGuest({
            guest_name: name,
            in_time: new Date(),
            duration_minutes: durationMinutes,
            remarks,
          });

          const responseData = {
            success: true,
            guest: {
              id: created.id,
              serialNumber: created.serial_number,
              name: created.guest_name,
              durationMinutes: created.duration_minutes,
              inTime: created.in_time,
              expectedOutTime: created.expected_out_time,
              status: created.status,
            },
          };

          return new Response(JSON.stringify(responseData), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
          });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: String(err) }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }
    }

    return originalFetch.apply(this, [input, init]);
  };

  // Expose global window helper for easy browser console testing
  (window as unknown as { addGuestApi: typeof addGuest }).addGuestApi = addGuest;
}
