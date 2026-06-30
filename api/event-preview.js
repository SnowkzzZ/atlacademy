// Vercel Serverless Function
// GET /api/event-preview?ev=EVENT_ID
// Retorna HTML com Open Graph tags para preview no WhatsApp/redes sociais

export default async function handler(req, res) {
    const { ev } = req.query;

    const SUPABASE_URL  = process.env.VITE_SUPABASE_URL;
    const SUPABASE_KEY  = process.env.VITE_SUPABASE_ANON_KEY;
    const SITE_URL      = process.env.VITE_SITE_URL || 'https://atlacademy.vercel.app';

    let event = null;

    if (ev && SUPABASE_URL && SUPABASE_KEY) {
        try {
            const resp = await fetch(
                `${SUPABASE_URL}/rest/v1/live_trainings?id=eq.${ev}&select=*`,
                { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
            );
            const data = await resp.json();
            if (Array.isArray(data) && data.length > 0) event = data[0];
        } catch (_) { /* silencioso */ }
    }

    const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    const formatDate = (ts) => {
        const d = new Date(Number(ts));
        return `${d.getDate()} de ${MESES[d.getMonth()]} · ${String(d.getHours()).padStart(2,'0')}h${String(d.getMinutes()).padStart(2,'0')}`;
    };

    const title       = event ? event.title       : 'ATL Academy — Treinamentos ao Vivo';
    const description = event
        ? `${event.type} com ${event.presenter} · ${formatDate(event.scheduledAt)}`
        : 'Acompanhe os treinamentos e eventos da ATL Academy.';
    const image       = event?.artUrl || `${SITE_URL}/og-default.jpg`;
    const redirectUrl = ev ? `${SITE_URL}/treinamentos?ev=${ev}` : `${SITE_URL}/treinamentos`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
    res.status(200).send(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <meta name="description" content="${description}" />

  <!-- Open Graph (WhatsApp, Facebook, etc.) -->
  <meta property="og:type"        content="website" />
  <meta property="og:url"         content="${redirectUrl}" />
  <meta property="og:title"       content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image"       content="${image}" />
  <meta property="og:image:width"  content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:site_name"   content="ATL Academy" />

  <!-- Twitter / X -->
  <meta name="twitter:card"        content="summary_large_image" />
  <meta name="twitter:title"       content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image"       content="${image}" />

  <!-- Redireciona para o app após o bot ler as tags -->
  <meta http-equiv="refresh" content="0;url=${redirectUrl}" />
</head>
<body>
  <p>Redirecionando para <a href="${redirectUrl}">${title}</a>...</p>
</body>
</html>`);
}
