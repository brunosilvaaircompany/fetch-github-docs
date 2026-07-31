(() => {
  "use strict";

  const ROOT_KEY = "slide-editor:v3";
  const LEGACY_PREFIX = "slide-editor:";
  const DEFAULT_DECK_SOURCE = "slides/template.html";

  const BUILTIN_TEMPLATES = [
    {
      id: "builtin-cover",
      name: "Capa",
      description: "Slide de abertura com titulo e subtitulo",
      html: "<h1>Titulo do treinamento</h1><p class=\"cover-subtitle\">Subtitulo</p><p style=\"font-size:0.6em; color:var(--text-muted);\">Nome do instrutor</p>"
    },
    {
      id: "builtin-agenda",
      name: "Agenda",
      description: "Lista de topicos da sessao",
      html: "<h2>Agenda</h2><ul><li>Contexto</li><li>Demonstracao</li><li>Hands-on</li><li>Encerramento</li></ul>"
    },
    {
      id: "builtin-content",
      name: "Conteudo",
      description: "Slide de conteudo com destaque",
      html: "<h2>Topico principal</h2><p>Contexto e explicacao do topico.</p><p class=\"highlight\">Dica: personalize este bloco com um exemplo real.</p>"
    },
    {
      id: "builtin-compare",
      name: "Comparacao",
      description: "Duas colunas para comparar abordagens",
      html: "<h2>Comparacao</h2><div class=\"split-2\"><div><h3>Opcao A</h3><ul><li>Ponto forte</li><li>Limite</li></ul></div><div><h3>Opcao B</h3><ul><li>Ponto forte</li><li>Limite</li></ul></div></div>"
    },
    {
      id: "builtin-closing",
      name: "Encerramento",
      description: "Slide para concluir e abrir Q&A",
      html: "<h2>Proximos passos</h2><ul><li>Aplicar no projeto atual</li><li>Documentar aprendizados</li><li>Compartilhar resultados</li></ul><p style=\"margin-top:1em; color:var(--text-muted);\">Perguntas?</p>"
    }
  ];

  const REPOSITORY_IMAGES = [
    { id: "repo:copilot-48.svg", fileName: "copilot-48.svg", name: "Copilot 48" },
    { id: "repo:copilot-24.svg", fileName: "copilot-24.svg", name: "Copilot 24" },
    { id: "repo:mark-github-24.svg", fileName: "mark-github-24.svg", name: "GitHub Mark 24" },
    { id: "repo:mark-github-16.svg", fileName: "mark-github-16.svg", name: "GitHub Mark 16" }
  ];

  function nowIso() {
    return new Date().toISOString();
  }

  function slugify(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function parseJson(raw) {
    if (!raw || typeof raw !== "string") {
      return null;
    }
    try {
      return JSON.parse(raw);
    } catch (_error) {
      return null;
    }
  }

  function normalizePath(pathname) {
    const clean = String(pathname || "/").replace(/\\/g, "/");
    return clean.length > 0 ? clean : "/";
  }

  function getCurrentPathKey(pathname) {
    const normalized = normalizePath(pathname);
    const marker = "/slides/";
    const index = normalized.indexOf(marker);
    if (index >= 0) {
      return normalized.slice(index + 1);
    }
    return normalized.replace(/^\/+/, "") || "slides/template.html";
  }

  function resolveImagePathForPage(fileName, pathname) {
    const normalized = normalizePath(pathname);
    const marker = "/slides/";
    const markerIndex = normalized.indexOf(marker);
    if (markerIndex < 0) {
      return `slides/images/${fileName}`;
    }

    const afterSlides = normalized.slice(markerIndex + marker.length);
    const slashIndex = afterSlides.lastIndexOf("/");
    const dirPart = slashIndex >= 0 ? afterSlides.slice(0, slashIndex) : "";
    const depth = dirPart.length > 0 ? dirPart.split("/").filter(Boolean).length : 0;
    const prefix = depth > 0 ? "../".repeat(depth) : "";
    return `${prefix}images/${fileName}`;
  }

  function parseTags(value) {
    if (Array.isArray(value)) {
      return value
        .map((tag) => String(tag || "").trim())
        .filter((tag) => tag.length > 0);
    }
    return String(value || "")
      .split(",")
      .map((part) => part.trim())
      .filter((part) => part.length > 0);
  }

  function normalizeDeck(deck) {
    const normalized = Object.assign({}, deck || {});
    normalized.id = String(normalized.id || "");
    normalized.title = String(normalized.title || "Novo deck");
    normalized.description = String(normalized.description || "");
    normalized.tags = parseTags(normalized.tags);
    normalized.sourcePath = String(normalized.sourcePath || DEFAULT_DECK_SOURCE);
    normalized.createdAt = String(normalized.createdAt || nowIso());
    normalized.updatedAt = String(normalized.updatedAt || normalized.createdAt);
    return normalized;
  }

  function defaultState() {
    const state = {
      version: 3,
      decks: {},
      deckOrder: [],
      templates: {},
      templateOrder: [],
      uploads: {}
    };

    const createdAt = nowIso();
    for (const template of BUILTIN_TEMPLATES) {
      state.templates[template.id] = {
        id: template.id,
        name: template.name,
        description: template.description,
        html: template.html,
        builtin: true,
        createdAt,
        updatedAt: createdAt
      };
      state.templateOrder.push(template.id);
    }

    return state;
  }

  function ensureStateShape(state) {
    const safe = state && typeof state === "object" ? state : {};
    const merged = defaultState();

    merged.version = 3;
    merged.decks = safe.decks && typeof safe.decks === "object" ? safe.decks : {};
    merged.deckOrder = Array.isArray(safe.deckOrder) ? safe.deckOrder.slice() : [];
    merged.templates = safe.templates && typeof safe.templates === "object" ? safe.templates : merged.templates;
    merged.templateOrder = Array.isArray(safe.templateOrder) ? safe.templateOrder.slice() : Object.keys(merged.templates);
    merged.uploads = safe.uploads && typeof safe.uploads === "object" ? safe.uploads : {};

    for (const template of BUILTIN_TEMPLATES) {
      if (!merged.templates[template.id]) {
        merged.templates[template.id] = {
          id: template.id,
          name: template.name,
          description: template.description,
          html: template.html,
          builtin: true,
          createdAt: nowIso(),
          updatedAt: nowIso()
        };
      } else {
        merged.templates[template.id].builtin = true;
      }
      if (merged.templateOrder.indexOf(template.id) < 0) {
        merged.templateOrder.unshift(template.id);
      }
    }

    merged.templateOrder = merged.templateOrder.filter((id, index) => {
      return typeof id === "string" && id.length > 0 && merged.templates[id] && merged.templateOrder.indexOf(id) === index;
    });

    const orderedDeckIds = [];
    for (const id of merged.deckOrder) {
      if (typeof id === "string" && merged.decks[id] && orderedDeckIds.indexOf(id) < 0) {
        merged.decks[id] = normalizeDeck(merged.decks[id]);
        orderedDeckIds.push(id);
      }
    }
    for (const id of Object.keys(merged.decks)) {
      if (orderedDeckIds.indexOf(id) < 0) {
        merged.decks[id] = normalizeDeck(merged.decks[id]);
        orderedDeckIds.push(id);
      }
    }
    merged.deckOrder = orderedDeckIds;

    const uploadIds = Object.keys(merged.uploads);
    for (const id of uploadIds) {
      const entry = merged.uploads[id];
      if (!entry || typeof entry !== "object" || typeof entry.dataUrl !== "string" || entry.dataUrl.length === 0) {
        delete merged.uploads[id];
        continue;
      }
      entry.id = String(entry.id || id);
      entry.name = String(entry.name || "imagem");
      entry.createdAt = String(entry.createdAt || nowIso());
      entry.updatedAt = String(entry.updatedAt || entry.createdAt);
    }

    return merged;
  }

  function readState() {
    const raw = window.localStorage.getItem(ROOT_KEY);
    const parsed = parseJson(raw);
    return ensureStateShape(parsed);
  }

  function writeState(state) {
    const payload = JSON.stringify(ensureStateShape(state));
    window.localStorage.setItem(ROOT_KEY, payload);
  }

  function makeDeckId(title) {
    const slug = slugify(title || "deck");
    return `deck-${slug || "deck"}-${Date.now().toString(36)}`;
  }

  function makeTemplateId(name) {
    const slug = slugify(name || "template");
    return `tpl-${slug || "template"}-${Date.now().toString(36)}`;
  }

  function makeUploadId(name) {
    const slug = slugify(name || "upload");
    return `upload-${slug || "upload"}-${Date.now().toString(36)}`;
  }

  function parseLegacyDeck(rawValue) {
    const parsed = parseJson(rawValue);
    if (parsed && typeof parsed === "object" && typeof parsed.slidesHtml === "string") {
      return {
        slidesHtml: parsed.slidesHtml,
        cssText: typeof parsed.cssText === "string" ? parsed.cssText : ""
      };
    }
    if (typeof rawValue === "string" && rawValue.trim().length > 0) {
      return {
        slidesHtml: rawValue,
        cssText: ""
      };
    }
    return null;
  }

  function migrateLegacyDeckIfPresent(state, deckId, pathname) {
    const deck = state.decks[deckId];
    if (!deck) {
      return false;
    }
    if (typeof deck.slidesHtml === "string" && deck.slidesHtml.trim().length > 0) {
      return false;
    }

    const legacyKey = `${LEGACY_PREFIX}${pathname}`;
    const raw = window.localStorage.getItem(legacyKey);
    if (!raw) {
      return false;
    }

    const migrated = parseLegacyDeck(raw);
    if (!migrated) {
      return false;
    }

    deck.slidesHtml = migrated.slidesHtml;
    deck.cssText = migrated.cssText;
    deck.updatedAt = nowIso();
    writeState(state);
    return true;
  }

  function ensureDeckForCurrentPath(options) {
    const settings = options || {};
    const pathname = normalizePath(settings.pathname || window.location.pathname);
    const pathKey = String(settings.pathKey || getCurrentPathKey(pathname));
    const requestedDeckId = settings.deckId ? String(settings.deckId) : "";
    const baselineSlidesHtml = typeof settings.baselineSlidesHtml === "string" ? settings.baselineSlidesHtml : "";
    const baselineCssText = typeof settings.baselineCssText === "string" ? settings.baselineCssText : "";

    const state = readState();
    let deckId = requestedDeckId;
    let deck = deckId ? state.decks[deckId] : null;

    if (!deck) {
      if (!deckId) {
        deckId = `path:${pathKey}`;
        deck = state.decks[deckId] || null;
      }
      if (!deck) {
        const titleSource = pathKey.split("/").pop() || "deck";
        const title = titleSource.replace(".html", "").replace(/[-_]+/g, " ").trim() || "Novo deck";
        const createdAt = nowIso();
        deck = {
          id: deckId,
          title: title.charAt(0).toUpperCase() + title.slice(1),
          description: "",
          tags: [],
          sourcePath: pathKey,
          createdAt,
          updatedAt: createdAt,
          slidesHtml: baselineSlidesHtml,
          cssText: baselineCssText
        };
        state.decks[deckId] = normalizeDeck(deck);
        state.decks[deckId].slidesHtml = baselineSlidesHtml;
        state.decks[deckId].cssText = baselineCssText;
        state.deckOrder.unshift(deckId);
      }
    }

    deck = state.decks[deckId];
    deck = normalizeDeck(deck);
    deck.sourcePath = pathKey;

    if (typeof deck.slidesHtml !== "string" || deck.slidesHtml.trim().length === 0) {
      deck.slidesHtml = baselineSlidesHtml;
    }
    if (typeof deck.cssText !== "string") {
      deck.cssText = baselineCssText;
    }
    deck.updatedAt = nowIso();
    state.decks[deckId] = deck;

    migrateLegacyDeckIfPresent(state, deckId, pathname);
    writeState(state);
    return clone(state.decks[deckId]);
  }

  function getDeckById(deckId) {
    const state = readState();
    const deck = state.decks[String(deckId || "")];
    return deck ? clone(deck) : null;
  }

  function listDecks() {
    const state = readState();
    const result = [];
    for (const id of state.deckOrder) {
      if (state.decks[id]) {
        result.push(clone(state.decks[id]));
      }
    }
    result.sort((a, b) => {
      return String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""));
    });
    return result;
  }

  function createDeck(input) {
    const data = input || {};
    const createdAt = nowIso();
    const title = String(data.title || "Novo deck").trim() || "Novo deck";
    const id = makeDeckId(title);
    const deck = normalizeDeck({
      id,
      title,
      description: String(data.description || ""),
      tags: parseTags(data.tags),
      sourcePath: String(data.sourcePath || DEFAULT_DECK_SOURCE),
      createdAt,
      updatedAt: createdAt,
      slidesHtml: typeof data.slidesHtml === "string" ? data.slidesHtml : "",
      cssText: typeof data.cssText === "string" ? data.cssText : ""
    });

    const state = readState();
    state.decks[id] = deck;
    state.deckOrder.unshift(id);
    writeState(state);
    return clone(deck);
  }

  function updateDeckMeta(deckId, patch) {
    const id = String(deckId || "");
    const state = readState();
    const current = state.decks[id];
    if (!current) {
      return null;
    }

    if (patch && Object.prototype.hasOwnProperty.call(patch, "title")) {
      current.title = String(patch.title || "").trim() || current.title;
    }
    if (patch && Object.prototype.hasOwnProperty.call(patch, "description")) {
      current.description = String(patch.description || "");
    }
    if (patch && Object.prototype.hasOwnProperty.call(patch, "tags")) {
      current.tags = parseTags(patch.tags);
    }
    if (patch && Object.prototype.hasOwnProperty.call(patch, "sourcePath")) {
      current.sourcePath = String(patch.sourcePath || current.sourcePath || DEFAULT_DECK_SOURCE);
    }
    current.updatedAt = nowIso();
    state.decks[id] = normalizeDeck(current);
    writeState(state);
    return clone(state.decks[id]);
  }

  function updateDeckContent(deckId, patch) {
    const id = String(deckId || "");
    const state = readState();
    const current = state.decks[id];
    if (!current) {
      return null;
    }
    if (patch && Object.prototype.hasOwnProperty.call(patch, "slidesHtml")) {
      current.slidesHtml = String(patch.slidesHtml || "");
    }
    if (patch && Object.prototype.hasOwnProperty.call(patch, "cssText")) {
      current.cssText = String(patch.cssText || "");
    }
    if (patch && Object.prototype.hasOwnProperty.call(patch, "sourcePath")) {
      current.sourcePath = String(patch.sourcePath || current.sourcePath || DEFAULT_DECK_SOURCE);
    }
    current.updatedAt = nowIso();
    state.decks[id] = normalizeDeck(current);
    state.decks[id].slidesHtml = current.slidesHtml;
    state.decks[id].cssText = current.cssText;
    writeState(state);
    return clone(state.decks[id]);
  }

  function duplicateDeck(deckId) {
    const source = getDeckById(deckId);
    if (!source) {
      return null;
    }
    const createdAt = nowIso();
    const newTitle = "Copia de " + (source.title || "deck");
    const id = makeDeckId(newTitle);
    const deck = normalizeDeck({
      id,
      title: newTitle,
      description: String(source.description || ""),
      tags: parseTags(source.tags),
      sourcePath: String(source.sourcePath || DEFAULT_DECK_SOURCE),
      createdAt,
      updatedAt: createdAt,
      slidesHtml: typeof source.slidesHtml === "string" ? source.slidesHtml : "",
      cssText: typeof source.cssText === "string" ? source.cssText : ""
    });
    const state = readState();
    state.decks[id] = deck;
    state.decks[id].slidesHtml = deck.slidesHtml;
    state.decks[id].cssText = deck.cssText;
    state.deckOrder.unshift(id);
    writeState(state);
    return clone(state.decks[id]);
  }

  function deleteDeck(deckId) {
    const id = String(deckId || "");
    const state = readState();
    if (!state.decks[id]) {
      return false;
    }
    delete state.decks[id];
    state.deckOrder = state.deckOrder.filter((deckEntryId) => deckEntryId !== id);
    writeState(state);
    return true;
  }

  function listTemplates() {
    const state = readState();
    const result = [];
    for (const id of state.templateOrder) {
      if (state.templates[id]) {
        result.push(clone(state.templates[id]));
      }
    }
    return result;
  }

  function createTemplate(input) {
    const data = input || {};
    const name = String(data.name || "Novo template").trim() || "Novo template";
    const id = makeTemplateId(name);
    const createdAt = nowIso();
    const template = {
      id,
      name,
      description: String(data.description || ""),
      html: String(data.html || "<h2>Novo template</h2><p>Edite o conteudo deste template.</p>"),
      builtin: false,
      createdAt,
      updatedAt: createdAt
    };

    const state = readState();
    state.templates[id] = template;
    state.templateOrder.push(id);
    writeState(state);
    return clone(template);
  }

  function updateTemplate(templateId, patch) {
    const id = String(templateId || "");
    const state = readState();
    const template = state.templates[id];
    if (!template || template.builtin) {
      return null;
    }
    if (patch && Object.prototype.hasOwnProperty.call(patch, "name")) {
      template.name = String(patch.name || "").trim() || template.name;
    }
    if (patch && Object.prototype.hasOwnProperty.call(patch, "description")) {
      template.description = String(patch.description || "");
    }
    if (patch && Object.prototype.hasOwnProperty.call(patch, "html")) {
      template.html = String(patch.html || "");
    }
    template.updatedAt = nowIso();
    state.templates[id] = template;
    writeState(state);
    return clone(template);
  }

  function deleteTemplate(templateId) {
    const id = String(templateId || "");
    const state = readState();
    if (!state.templates[id] || state.templates[id].builtin) {
      return false;
    }
    delete state.templates[id];
    state.templateOrder = state.templateOrder.filter((templateEntryId) => templateEntryId !== id);
    writeState(state);
    return true;
  }

  function listRepositoryImages(pathname) {
    const path = normalizePath(pathname || window.location.pathname);
    return REPOSITORY_IMAGES.map((entry) => {
      return {
        id: entry.id,
        kind: "repo",
        name: entry.name,
        src: resolveImagePathForPage(entry.fileName, path)
      };
    });
  }

  function listUploads() {
    const state = readState();
    const items = Object.keys(state.uploads).map((id) => clone(state.uploads[id]));
    items.sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
    return items;
  }

  function addUploadImage(name, dataUrl) {
    const safeName = String(name || "upload").trim() || "upload";
    const safeDataUrl = String(dataUrl || "");
    if (!safeDataUrl.startsWith("data:")) {
      return null;
    }
    const id = makeUploadId(safeName);
    const createdAt = nowIso();
    const upload = {
      id,
      name: safeName,
      dataUrl: safeDataUrl,
      createdAt,
      updatedAt: createdAt
    };
    const state = readState();
    state.uploads[id] = upload;
    writeState(state);
    return clone(upload);
  }

  function deleteUploadImage(uploadId) {
    const id = String(uploadId || "");
    const state = readState();
    if (!state.uploads[id]) {
      return false;
    }
    delete state.uploads[id];
    writeState(state);
    return true;
  }

  function listImageLibrary(pathname) {
    const repo = listRepositoryImages(pathname);
    const uploads = listUploads().map((entry) => {
      return {
        id: entry.id,
        kind: "upload",
        name: entry.name,
        src: entry.dataUrl
      };
    });
    return repo.concat(uploads);
  }

  function buildDeckHref(deck) {
    const item = normalizeDeck(deck);
    const base = item.sourcePath || DEFAULT_DECK_SOURCE;
    const separator = base.indexOf("?") >= 0 ? "&" : "?";
    return `${base}${separator}deck=${encodeURIComponent(item.id)}`;
  }

  window.SlideDeckStore = {
    key: ROOT_KEY,
    parseTags,
    getCurrentPathKey,
    ensureDeckForCurrentPath,
    getDeckById,
    listDecks,
    createDeck,
    duplicateDeck,
    updateDeckMeta,
    updateDeckContent,
    deleteDeck,
    listTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    listRepositoryImages,
    listUploads,
    addUploadImage,
    deleteUploadImage,
    listImageLibrary,
    buildDeckHref
  };
})();
