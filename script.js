// Ano automático no rodapé
document.getElementById("year").textContent = new Date().getFullYear();

// ===========================
// MENU MOBILE
// ===========================
const toggle = document.getElementById("menuToggle");
const nav = document.getElementById("navMenu");

// abre/fecha menu
if (toggle && nav) {
  toggle.addEventListener("click", () => {
    nav.classList.toggle("active");
  });

  // fecha menu ao clicar em um link (boa prática mobile)
  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => nav.classList.remove("active"));
  });
}

// ===========================
// PROGRAMACOES (render via JS)
// ===========================

// Ordem dos dias (para ordenar automaticamente)
const ordemDias = {
  "Segunda": 1,
  "Terça": 2,
  "Quarta": 3,
  "Quinta": 4,
  "Sexta": 5,
  "Sábado": 6,
  "Domingo": 7
};

const programacoes = [
  { titulo: "Reunião do Círculo de Oração", dia: "Segunda", horario: "19h", descricao: "Reunião de oração e comunhão." },
  { titulo: "Culto de Ensino", dia: "Quarta", horario: "19h30", descricao: "Ensino bíblico para fortalecimento espiritual." },
  { titulo: "Culto de Oração", dia: "Sexta", horario: "19h30", descricao: "Momento de intercessão e busca ao Senhor." },
  { titulo: "Consagração Geral", dia: "Sábado", horario: "07h", descricao: "Momento especial de consagração e oração." },
  { titulo: "Escola Bíblica Dominical", dia: "Domingo", horario: "08h", descricao: "Estudo da Palavra de Deus para todas as idades." },
  { titulo: "Culto de Departamentos", dia: "Domingo", horario: "19h", descricao: "Culto dirigido pelos departamentos da igreja." }
];

// Ordena por dia da semana
programacoes.sort((a, b) => (ordemDias[a.dia] ?? 99) - (ordemDias[b.dia] ?? 99));

// Estado do filtro
let mostrandoTodas = false;

// Função: renderizar lista
function renderProgramacoes() {
  const grid = document.getElementById("programacoesGrid");
  if (!grid) return;

  const hint = document.getElementById("programacoesHint");
  const btn = document.getElementById("btnToggleProgramacoes");

  grid.innerHTML = "";

  // "Principais" = só 3 primeiras (Seg/Qua/Sex por exemplo)
  const lista = mostrandoTodas ? programacoes : programacoes.slice(0, 3);

  lista.forEach((item) => {
    const card = document.createElement("article");
    card.className = "card";

    card.innerHTML = `
      <h4 class="card__title">${item.titulo}</h4>
      <p class="card__meta">${item.dia} • ${item.horario}</p>
      <p class="card__text">${item.descricao}</p>
    `;

    grid.appendChild(card);
  });

  if (btn) btn.textContent = mostrandoTodas ? "Ver principais" : "Ver todas";
  if (hint) hint.textContent = mostrandoTodas ? "Mostrando todas as programações." : "Mostrando principais desta semana.";
}

// Botão: alterna “todas/principais”
const btnToggle = document.getElementById("btnToggleProgramacoes");
if (btnToggle) {
  btnToggle.addEventListener("click", () => {
    mostrandoTodas = !mostrandoTodas;
    renderProgramacoes();
  });
}

// inicial
renderProgramacoes();


// ===========================
// NOTÍCIAS (via JSON + fetch) + MODAL
// ===========================

// Vamos guardar as notícias aqui depois que vierem do JSON
let noticias = [];

// Converte "DD/MM/AAAA" em Date para conseguir ordenar corretamente
function parseDataBR(dataStr) {
  const [dia, mes, ano] = dataStr.split("/").map(Number);
  return new Date(ano, mes - 1, dia);
}

// Renderiza cards de notícias (recebe uma lista)
function renderNoticias(lista) {
  const grid = document.getElementById("noticiasGrid");
  if (!grid) return;

  grid.innerHTML = "";

  lista.forEach((n) => {
    const card = document.createElement("article");
    card.className = "card";

    card.innerHTML = `
      <img src="${n.imagem}" alt="${n.titulo}" class="card__image">

      <h4 class="card__title">${n.titulo}</h4>
      <p class="card__meta">${n.data}</p>
      <p class="card__text">${n.resumo}</p>

      <div class="card__actions">
        <button class="btn-link" data-id="${n.id}">Ler mais →</button>
      </div>
    `;

    grid.appendChild(card);
  });

  // Eventos dos botões "Ler mais"
  grid.querySelectorAll(".btn-link").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = Number(e.currentTarget.getAttribute("data-id"));
      abrirModal(id);
    });
  });
}

// Modal: abrir
function abrirModal(id) {
  const noticia = noticias.find((n) => n.id === id);
  if (!noticia) return;

  document.getElementById("modalTitle").textContent = noticia.titulo;
  document.getElementById("modalMeta").textContent = noticia.data;
  document.getElementById("modalText").textContent = noticia.texto;

  document.getElementById("modal").classList.add("active");
  document.body.style.overflow = "hidden";
}

// Modal: fechar
function fecharModal() {
  document.getElementById("modal").classList.remove("active");
  document.body.style.overflow = "";
}

// Eventos do modal
const modalOverlay = document.getElementById("modalOverlay");
const modalClose = document.getElementById("modalClose");

if (modalOverlay) modalOverlay.addEventListener("click", fecharModal);
if (modalClose) modalClose.addEventListener("click", fecharModal);

// Fecha no ESC
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") fecharModal();
});

// ===========================
// BUSCAR NOTÍCIAS NO JSON (fetch)
// ===========================

async function carregarNoticias() {
  const grid = document.getElementById("noticiasGrid");
  if (!grid) return;

  // Feedback visual simples enquanto carrega
  grid.innerHTML = `<p style="font-weight:800;color:#475569;">Carregando notícias...</p>`;

  try {
    // 1) Busca o arquivo noticias.json (como se fosse uma API)
    const resposta = await fetch("noticias.json");

    // 2) Se der erro de rede/arquivo, cai aqui
    if (!resposta.ok) {
      throw new Error(`Erro ao carregar noticias.json (status ${resposta.status})`);
    }

    // 3) Converte o conteúdo em JavaScript (JSON -> objeto)
    const dados = await resposta.json();

    // Debug
    console.log("Notícias carregadas do JSON:", dados);

    // 4) Ordena por data (mais recente primeiro) e salva em memória
    noticias = dados.sort((a, b) => parseDataBR(b.data) - parseDataBR(a.data));

    // 5) Renderiza na tela
    renderNoticias(noticias);

  } catch (erro) {
    console.error("Falha ao carregar notícias:", erro);
    grid.innerHTML = `<p style="font-weight:800;color:#b91c1c;">Não foi possível carregar as notícias.</p>`;
  }
}

// Inicializa (chama ao carregar a página)
carregarNoticias();
