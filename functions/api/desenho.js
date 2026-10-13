
import { gerarDesenho, numeroValido } from "../../lib/desenho.js";

export async function onRequest({ request, env }) {
  if (request.method !== "POST") {
    return new Response("Método não permitido.", { status: 405 });
  }

  let dados;

  try {
    const texto = await request.text();

    if (!texto.trim()) {
      return new Response("Corpo inválido.", { status: 400 });
    }

    dados = JSON.parse(texto);
  } catch {
    return new Response("JSON inválido.", { status: 400 });
  }

  if (!dados || !numeroValido(dados.numero)) {
    return new Response("Número inválido.", { status: 400 });
  }

  const autorizacao = request.headers.get("Authorization") || "";
  const correspondencia = autorizacao.match(/^Bearer\s+(.+)$/i);

  if (!correspondencia) {
    return new Response("Token ausente ou inválido.", { status: 401 });
  }

  let informacoes;

  try {
    const resposta = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(correspondencia[1])}`
    );

    if (!resposta.ok) {
      return new Response("Token inválido.", { status: 401 });
    }

    informacoes = await resposta.json();
  } catch {
    return new Response("Não foi possível verificar o token.", {
      status: 401
    });
  }

  if (
    informacoes.aud !== env.GOOGLE_CLIENT_ID ||
    informacoes.email_verified !== "true" ||
    !informacoes.email
  ) {
    return new Response("Token não autorizado.", { status: 401 });
  }

  const svg = gerarDesenho(dados.numero, informacoes.email);

  return new Response(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8"
    }
  });
}
