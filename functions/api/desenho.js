```javascript
import { gerarDesenho, numeroValido } from "../../lib/desenho.js";

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== "POST") {
    return new Response("Método não permitido.", {
      status: 405,
      headers: { Allow: "POST" },
    });
  }

  let dados;

  try {
    dados = await request.json();
  } catch {
    return new Response("JSON inválido.", { status: 400 });
  }

  const numero = dados?.numero;

  if (!numeroValido(numero)) {
    return new Response("Número inválido. Informe um inteiro entre 1 e 100.", {
      status: 400,
    });
  }

  const autorizacao = request.headers.get("Authorization");
  const token = autorizacao?.startsWith("Bearer ")
    ? autorizacao.slice(7)
    : "";

  if (!token) {
    return new Response("Token ausente ou inválido.", { status: 401 });
  }

  let usuario;

  try {
    const resposta = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(token)}`
    );

    if (!resposta.ok) {
      throw new Error("Token inválido");
    }

    usuario = await resposta.json();
  } catch {
    return new Response("Token inválido ou expirado.", { status: 401 });
  }

  if (
    !env.GOOGLE_CLIENT_ID ||
    usuario.aud !== env.GOOGLE_CLIENT_ID ||
    usuario.email_verified !== "true" ||
    !usuario.email
  ) {
    return new Response("Token não autorizado.", { status: 401 });
  }

  const svg = gerarDesenho(numero, usuario.email);

  return new Response(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
```
