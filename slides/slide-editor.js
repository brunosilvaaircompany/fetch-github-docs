(() => {
  "use strict";

  const slidesRoot = document.querySelector(".reveal .slides");
  if (!slidesRoot || !window.SlideDeckStore) {
    return;
  }

  const store = window.SlideDeckStore;
  const UI_ATTR = "data-slide-editor-ui";
  const baselineSlidesHtml = slidesRoot.innerHTML;
  const editableStyleTag = getEditableStyleTag();
  const baselineCssText = editableStyleTag ? editableStyleTag.textContent : "";
  const pathKey = store.getCurrentPathKey(window.location.pathname);
  const queryDeckId = new URLSearchParams(window.location.search).get("deck");

  let activeDeck = store.ensureDeckForCurrentPath({
    pathname: window.location.pathname,
    pathKey,
    deckId: queryDeckId,
    baselineSlidesHtml,
    baselineCssText
  });

  if (!activeDeck) {
    return;
  }

  if (typeof activeDeck.slidesHtml === "string" && activeDeck.slidesHtml.trim().length > 0) {
    slidesRoot.innerHTML = activeDeck.slidesHtml;
    slidesRoot.querySelectorAll(".slide-editor-image-target").forEach(el => el.classList.remove("slide-editor-image-target"));
    slidesRoot.querySelectorAll(".slide-editor-inline-target").forEach(el => el.classList.remove("slide-editor-inline-target"));
  }
  if (editableStyleTag && typeof activeDeck.cssText === "string" && activeDeck.cssText.trim().length > 0) {
    editableStyleTag.textContent = activeDeck.cssText;
  }

  let reveal = null;
  let saveTimer = null;
  let storageEnabled = true;
  let inlineEditing = false;
  let editableSlide = null;
  let selectedImageElement = null;
  let lastCaretRange = null;
  let codeMode = null;
  let codePanel = null;
  let codeTextarea = null;
  let panelTitle = null;
  let statusText = null;
  let toggleButton = null;
  let htmlButton = null;
  let cssButton = null;
  let hideControlsButton = null;
  let showControlsButton = null;
  let backToHomeButton = null;
  let templatePanel = null;
  let templateList = null;
  let templateNameInput = null;
  let templateDescriptionInput = null;
  let templateHtmlTextarea = null;
  let selectedTemplateId = "";
  let imagePanel = null;
  let imageList = null;
  let imageUploadInput = null;
  let imagesButton = null;
  let templatesButton = null;

  function getEditableStyleTag() {
    const styles = Array.from(document.head.querySelectorAll("style"));
    for (const style of styles) {
      if (!style.hasAttribute(UI_ATTR)) {
        return style;
      }
    }

    const createdStyle = document.createElement("style");
    createdStyle.textContent = "/* Edite este CSS com o botao Editar CSS */";
    document.head.appendChild(createdStyle);
    return createdStyle;
  }

  function getHomePagePath() {
    const pathname = window.location.pathname || "/";
    const marker = "/slides/";
    const markerIndex = pathname.indexOf(marker);
    if (markerIndex >= 0) {
      const prefix = pathname.slice(0, markerIndex);
      return `${prefix}/index.html`;
    }
    return "/index.html";
  }

  function getLeafSlides() {
    const sections = Array.from(slidesRoot.querySelectorAll("section"));
    return sections.filter((section) => {
      return !Array.from(section.children).some((child) => child.tagName === "SECTION");
    });
  }

  function getCurrentSlide() {
    if (reveal && typeof reveal.getCurrentSlide === "function") {
      const current = reveal.getCurrentSlide();
      if (current) {
        return current;
      }
    }
    return getLeafSlides()[0] || null;
  }

  function refreshDeckFromStore() {
    const updated = store.getDeckById(activeDeck.id);
    if (updated) {
      activeDeck = updated;
    }
  }

  function getSanitizedSlidesHtml() {
    const clone = slidesRoot.cloneNode(true);
    clone.querySelectorAll(".slide-editor-image-target").forEach(el => el.classList.remove("slide-editor-image-target"));
    clone.querySelectorAll(".slide-editor-inline-target").forEach(el => el.classList.remove("slide-editor-inline-target"));
    return clone.innerHTML;
  }

  function saveSlidesNow() {
    if (!storageEnabled) {
      return;
    }
    try {
      const saved = store.updateDeckContent(activeDeck.id, {
        sourcePath: pathKey,
        slidesHtml: getSanitizedSlidesHtml(),
        cssText: editableStyleTag ? editableStyleTag.textContent : ""
      });
      if (!saved) {
        throw new Error("Deck nao encontrado para salvar.");
      }
      activeDeck = saved;
    } catch (error) {
      storageEnabled = false;
      console.error("Slide editor: failed to persist deck state in localStorage.", error);
      window.alert("Nao foi possivel salvar no navegador. Verifique as permissoes de armazenamento local.");
    }
  }

  function queueSave() {
    if (saveTimer) {
      window.clearTimeout(saveTimer);
    }
    saveTimer = window.setTimeout(() => {
      saveSlidesNow();
      saveTimer = null;
    }, 180);
  }

  function syncRevealLayout() {
    if (!reveal) {
      return;
    }
    if (typeof reveal.sync === "function") {
      reveal.sync();
    }
    if (typeof reveal.layout === "function") {
      reveal.layout();
    }
  }

  function goToSlide(slide) {
    if (!reveal || !slide || typeof reveal.getIndices !== "function" || typeof reveal.slide !== "function") {
      return;
    }
    const indices = reveal.getIndices(slide);
    if (!indices || typeof indices.h !== "number") {
      return;
    }
    reveal.slide(indices.h, typeof indices.v === "number" ? indices.v : 0, typeof indices.f === "number" ? indices.f : 0);
  }

  function currentSlideLabel(slide) {
    if (!reveal || !slide || typeof reveal.getIndices !== "function") {
      return "Slide atual";
    }
    const indices = reveal.getIndices(slide);
    if (!indices || typeof indices.h !== "number") {
      return "Slide atual";
    }
    const horizontal = indices.h + 1;
    const vertical = typeof indices.v === "number" ? indices.v + 1 : 1;
    return `Slide ${horizontal}.${vertical}`;
  }

  function setSelectedImage(imageElement) {
    if (selectedImageElement) {
      selectedImageElement.classList.remove("slide-editor-image-target");
    }
    selectedImageElement = null;
    if (!imageElement) {
      return;
    }
    selectedImageElement = imageElement;
    selectedImageElement.classList.add("slide-editor-image-target");
  }

  function updateStatus(slide) {
    if (!statusText) {
      return;
    }
    if (!slide) {
      statusText.textContent = "Sem slide selecionado";
      return;
    }

    const deckTitle = activeDeck && activeDeck.title ? activeDeck.title : "Deck";
    let modeLabel = "";
    if (codeMode === "html") {
      modeLabel = " - edicao de HTML ativa";
    } else if (codeMode === "css") {
      modeLabel = " - edicao de CSS ativa";
    } else if (inlineEditing) {
      modeLabel = " - edicao de slide ativa";
    } else if (selectedImageElement) {
      modeLabel = " - imagem selecionada";
    }
    statusText.textContent = `${deckTitle} - ${currentSlideLabel(slide)}${modeLabel}`;
  }

  function setEditableSlide(slide) {
    if (editableSlide) {
      editableSlide.removeAttribute("contenteditable");
      editableSlide.removeAttribute("spellcheck");
      editableSlide.classList.remove("slide-editor-inline-target");
    }

    editableSlide = null;
    if (lastCaretRange && (!slide || !slide.contains(lastCaretRange.commonAncestorContainer))) {
      lastCaretRange = null;
    }
    if (!inlineEditing || !slide) {
      updateStatus(getCurrentSlide());
      return;
    }

    editableSlide = slide;
    editableSlide.setAttribute("contenteditable", "true");
    editableSlide.setAttribute("spellcheck", "true");
    editableSlide.classList.add("slide-editor-inline-target");
    updateStatus(slide);
  }

  function setInlineEditing(enabled) {
    inlineEditing = enabled;
    toggleButton.textContent = inlineEditing ? "Parar edicao" : "Editar slide";
    if (!inlineEditing) {
      lastCaretRange = null;
      setSelectedImage(null);
    }
    setEditableSlide(getCurrentSlide());
  }

  function captureCaretRange() {
    if (!inlineEditing || !editableSlide) {
      return;
    }
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !editableSlide.contains(selection.anchorNode)) {
      return;
    }
    lastCaretRange = selection.getRangeAt(0).cloneRange();
  }

  function openCodeEditor(mode) {
    if (!codePanel || !codeTextarea || !panelTitle) {
      return;
    }

    closeTemplatePanel();
    closeImagePanel();
    setInlineEditing(false);
    codeMode = mode;
    codePanel.classList.add("open");
    htmlButton.classList.toggle("active", mode === "html");
    cssButton.classList.toggle("active", mode === "css");

    if (mode === "html") {
      panelTitle.textContent = "Editar HTML do slide atual";
      const current = getCurrentSlide();
      codeTextarea.value = current ? current.innerHTML.trim() : "";
    } else {
      panelTitle.textContent = "Editar CSS da apresentacao";
      codeTextarea.value = editableStyleTag ? editableStyleTag.textContent.trim() : "";
    }

    updateStatus(getCurrentSlide());
  }

  function closeCodeEditor() {
    if (!codePanel) {
      return;
    }
    codePanel.classList.remove("open");
    codeMode = null;
    htmlButton.classList.remove("active");
    cssButton.classList.remove("active");
    updateStatus(getCurrentSlide());
  }

  function hideControls() {
    if (!hideControlsButton || !showControlsButton || !codePanel) {
      return;
    }
    hideControlsButton.parentElement.classList.add("hidden");
    showControlsButton.classList.add("show");
    closeCodeEditor();
    closeTemplatePanel();
    closeImagePanel();
    setInlineEditing(false);
  }

  function showControls() {
    if (!hideControlsButton || !showControlsButton) {
      return;
    }
    hideControlsButton.parentElement.classList.remove("hidden");
    showControlsButton.classList.remove("show");
  }

  function createSlideElement(customHtml) {
    const section = document.createElement("section");
    section.innerHTML = customHtml || "<h2>Novo slide</h2><p>Clique em 'Editar slide' para editar diretamente neste slide.</p>";
    return section;
  }

  function addSlide() {
    const current = getCurrentSlide();
    if (!current || !current.parentElement) {
      return;
    }
    const section = createSlideElement("");
    current.parentElement.insertBefore(section, current.nextSibling);
    syncRevealLayout();
    goToSlide(section);
    setEditableSlide(section);
    queueSave();
  }

  function insertSlideFromTemplate(html) {
    const current = getCurrentSlide();
    if (!current || !current.parentElement) {
      return;
    }
    const section = createSlideElement(html);
    current.parentElement.insertBefore(section, current.nextSibling);
    syncRevealLayout();
    goToSlide(section);
    setEditableSlide(section);
    queueSave();
  }

  function duplicateSlide() {
    const current = getCurrentSlide();
    if (!current || !current.parentElement) {
      return;
    }
    const clone = current.cloneNode(true);
    current.parentElement.insertBefore(clone, current.nextSibling);
    syncRevealLayout();
    goToSlide(clone);
    setEditableSlide(clone);
    queueSave();
  }

  function closeCurrentSlide() {
    const current = getCurrentSlide();
    if (!current || !current.parentElement) {
      return;
    }

    if (getLeafSlides().length <= 1) {
      window.alert("Nao e possivel fechar o ultimo slide do deck.");
      return;
    }

    const shouldClose = window.confirm("Fechar o slide atual? Esta acao remove o slide da apresentacao.");
    if (!shouldClose) {
      return;
    }

    const parent = current.parentElement;
    const fallbackSlide = current.nextElementSibling || current.previousElementSibling;
    parent.removeChild(current);

    if (parent.tagName === "SECTION") {
      const remainingChildren = Array.from(parent.children).filter((child) => child.tagName === "SECTION");
      if (remainingChildren.length === 0 && parent.parentElement) {
        parent.parentElement.removeChild(parent);
      }
    }

    syncRevealLayout();
    if (fallbackSlide) {
      goToSlide(fallbackSlide);
    } else {
      const firstSlide = getLeafSlides()[0] || null;
      if (firstSlide) {
        goToSlide(firstSlide);
      }
    }
    setEditableSlide(getCurrentSlide());
    queueSave();
  }

  function resetSlides() {
    const shouldReset = window.confirm("Restaurar apenas o deck atual para o template inicial desta pagina?");
    if (!shouldReset) {
      return;
    }
    slidesRoot.innerHTML = baselineSlidesHtml;
    if (editableStyleTag) {
      editableStyleTag.textContent = baselineCssText;
    }
    syncRevealLayout();
    const firstSlide = getLeafSlides()[0] || null;
    if (firstSlide) {
      goToSlide(firstSlide);
    }
    setSelectedImage(null);
    setEditableSlide(firstSlide);
    closeCodeEditor();
    closeTemplatePanel();
    closeImagePanel();
    saveSlidesNow();
  }

  function exportSlides() {
    const clone = document.documentElement.cloneNode(true);
    const nodes = Array.from(clone.querySelectorAll(`[${UI_ATTR}]`));
    nodes.forEach((node) => node.remove());

    const deckTitleSlug = String(activeDeck.title || "deck")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const deckName = deckTitleSlug || "deck";
    const html = `<!DOCTYPE html>\n${clone.outerHTML}`;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const objectUrl = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = `${deckName}-editado.html`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(objectUrl);
  }

  function editDeckMetadata() {
    refreshDeckFromStore();
    const title = window.prompt("Titulo do deck:", activeDeck.title || "");
    if (title === null) {
      return;
    }
    const description = window.prompt("Descricao do deck:", activeDeck.description || "");
    if (description === null) {
      return;
    }
    const tags = window.prompt("Tags do deck (separadas por virgula):", (activeDeck.tags || []).join(", "));
    if (tags === null) {
      return;
    }

    const updated = store.updateDeckMeta(activeDeck.id, {
      title: title,
      description: description,
      tags: tags,
      sourcePath: pathKey
    });
    if (!updated) {
      window.alert("Nao foi possivel atualizar os metadados do deck.");
      return;
    }
    activeDeck = updated;
    if (backToHomeButton) {
      backToHomeButton.title = `Voltar para galeria (${activeDeck.title})`;
    }
    updateStatus(getCurrentSlide());
    window.alert("Metadados do deck atualizados.");
  }

  function deleteCurrentDeck() {
    refreshDeckFromStore();
    const canDelete = !String(activeDeck.id || "").startsWith("path:");
    if (!canDelete) {
      window.alert("Este deck base nao pode ser excluido. Crie um novo deck pela galeria para gerenciar exclusao.");
      return;
    }

    const shouldDelete = window.confirm(`Excluir o deck "${activeDeck.title}"?`);
    if (!shouldDelete) {
      return;
    }
    const deleted = store.deleteDeck(activeDeck.id);
    if (!deleted) {
      window.alert("Nao foi possivel excluir o deck.");
      return;
    }
    window.location.assign(getHomePagePath());
  }

  function closeTemplatePanel() {
    if (!templatePanel) {
      return;
    }
    templatePanel.classList.remove("open");
    if (templatesButton) {
      templatesButton.classList.remove("active");
    }
  }

  function openTemplatePanel() {
    if (!templatePanel) {
      return;
    }
    closeCodeEditor();
    closeImagePanel();
    templatePanel.classList.add("open");
    if (templatesButton) {
      templatesButton.classList.add("active");
    }
    renderTemplateList();
  }

  function closeImagePanel() {
    if (!imagePanel) {
      return;
    }
    imagePanel.classList.remove("open");
    if (imagesButton) {
      imagesButton.classList.remove("active");
    }
  }

  function openImagePanel() {
    if (!imagePanel) {
      return;
    }
    closeCodeEditor();
    closeTemplatePanel();
    imagePanel.classList.add("open");
    if (imagesButton) {
      imagesButton.classList.add("active");
    }
    renderImageList();
  }

  function selectTemplate(templateId) {
    const templates = store.listTemplates();
    const selected = templates.find((template) => template.id === templateId);
    if (!selected) {
      selectedTemplateId = "";
      templateNameInput.value = "";
      templateDescriptionInput.value = "";
      templateHtmlTextarea.value = "";
      renderTemplateList();
      return;
    }

    selectedTemplateId = selected.id;
    templateNameInput.value = selected.name || "";
    templateDescriptionInput.value = selected.description || "";
    templateHtmlTextarea.value = selected.html || "";
    renderTemplateList();
  }

  function createTemplateFromCurrentSlide() {
    const current = getCurrentSlide();
    if (!current) {
      window.alert("Sem slide selecionado.");
      return;
    }
    const name = window.prompt("Nome do template:", "Novo template");
    if (name === null) {
      return;
    }
    const description = window.prompt("Descricao do template:", "Template criado a partir do slide atual");
    if (description === null) {
      return;
    }
    const created = store.createTemplate({
      name: name,
      description: description,
      html: current.innerHTML.trim()
    });
    if (!created) {
      window.alert("Nao foi possivel criar o template.");
      return;
    }
    selectTemplate(created.id);
  }

  function saveTemplateFromPanel() {
    const name = String(templateNameInput.value || "").trim();
    const html = String(templateHtmlTextarea.value || "").trim();
    if (name.length === 0) {
      window.alert("Informe um nome para o template.");
      return;
    }
    if (html.length === 0) {
      window.alert("Informe o HTML do template.");
      return;
    }

    const description = String(templateDescriptionInput.value || "").trim();
    const current = selectedTemplateId ? store.listTemplates().find((template) => template.id === selectedTemplateId) : null;
    let result = null;

    if (current && !current.builtin) {
      result = store.updateTemplate(current.id, {
        name,
        description,
        html
      });
    } else {
      result = store.createTemplate({
        name,
        description,
        html
      });
    }

    if (!result) {
      window.alert("Nao foi possivel salvar o template.");
      return;
    }
    selectTemplate(result.id);
  }

  function deleteSelectedTemplate() {
    if (!selectedTemplateId) {
      return;
    }
    const current = store.listTemplates().find((template) => template.id === selectedTemplateId);
    if (!current) {
      return;
    }
    if (current.builtin) {
      window.alert("Templates padrao nao podem ser excluidos.");
      return;
    }
    const shouldDelete = window.confirm(`Excluir o template "${current.name}"?`);
    if (!shouldDelete) {
      return;
    }
    const deleted = store.deleteTemplate(current.id);
    if (!deleted) {
      window.alert("Nao foi possivel excluir o template.");
      return;
    }
    selectedTemplateId = "";
    templateNameInput.value = "";
    templateDescriptionInput.value = "";
    templateHtmlTextarea.value = "";
    renderTemplateList();
  }

  function renderTemplateList() {
    if (!templateList) {
      return;
    }
    const templates = store.listTemplates();
    templateList.innerHTML = "";

    templates.forEach((template) => {
      const row = document.createElement("div");
      row.className = "slide-editor-list-row";

      const title = document.createElement("div");
      title.className = "slide-editor-list-title";
      title.textContent = template.builtin ? `${template.name} (padrao)` : template.name;

      const description = document.createElement("div");
      description.className = "slide-editor-list-description";
      description.textContent = template.description || "Sem descricao";

      const actions = document.createElement("div");
      actions.className = "slide-editor-list-actions";

      const insertButton = document.createElement("button");
      insertButton.type = "button";
      insertButton.textContent = "Inserir";
      insertButton.addEventListener("click", () => {
        insertSlideFromTemplate(template.html);
        closeTemplatePanel();
      });

      const editButton = document.createElement("button");
      editButton.type = "button";
      editButton.textContent = "Editar";
      editButton.className = selectedTemplateId === template.id ? "active" : "";
      editButton.addEventListener("click", () => {
        selectTemplate(template.id);
      });

      actions.appendChild(insertButton);
      actions.appendChild(editButton);
      row.appendChild(title);
      row.appendChild(description);
      row.appendChild(actions);
      templateList.appendChild(row);
    });
  }

  function applyImageToSelectedSlide(asset) {
    if (!inlineEditing || !editableSlide) {
      window.alert("Ative 'Editar slide' para adicionar imagens.");
      return;
    }

    const current = getCurrentSlide();
    if (!current) {
      window.alert("Sem slide selecionado.");
      return;
    }

    const target = document.createElement("img");
    target.alt = asset.name || "Imagem";
    target.src = asset.src;
    target.style.maxWidth = "56%";

    const selection = window.getSelection();
    let insertionRange = null;
    if (selection && selection.rangeCount > 0 && editableSlide.contains(selection.anchorNode)) {
      insertionRange = selection.getRangeAt(0).cloneRange();
    } else if (lastCaretRange && editableSlide.contains(lastCaretRange.commonAncestorContainer)) {
      insertionRange = lastCaretRange.cloneRange();
    }

    if (insertionRange) {
      insertionRange.deleteContents();
      insertionRange.insertNode(target);
      insertionRange.setStartAfter(target);
      insertionRange.collapse(true);
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(insertionRange);
      }
      lastCaretRange = insertionRange.cloneRange();
    } else {
      editableSlide.appendChild(target);
    }

    setSelectedImage(target);
    syncRevealLayout();
    queueSave();
  }

  function renderImageList() {
    if (!imageList) {
      return;
    }
    imageList.innerHTML = "";
    const assets = store.listImageLibrary(window.location.pathname);
    assets.forEach((asset) => {
      const card = document.createElement("div");
      card.className = "slide-editor-image-card";

      const preview = document.createElement("img");
      preview.src = asset.src;
      preview.alt = asset.name;
      preview.className = "slide-editor-image-preview";

      const name = document.createElement("div");
      name.className = "slide-editor-image-name";
      name.textContent = asset.name;

      const actions = document.createElement("div");
      actions.className = "slide-editor-list-actions";

      const useButton = document.createElement("button");
      useButton.type = "button";
      useButton.textContent = "Usar";
      useButton.addEventListener("click", () => {
        applyImageToSelectedSlide(asset);
      });

      actions.appendChild(useButton);

      if (asset.kind === "upload") {
        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.textContent = "Excluir";
        deleteButton.addEventListener("click", () => {
          const shouldDelete = window.confirm(`Excluir upload "${asset.name}"?`);
          if (!shouldDelete) {
            return;
          }
          store.deleteUploadImage(asset.id);
          renderImageList();
        });
        actions.appendChild(deleteButton);
      }

      card.appendChild(preview);
      card.appendChild(name);
      card.appendChild(actions);
      imageList.appendChild(card);
    });
  }

  function handleImageUpload(event) {
    const files = event.target && event.target.files ? Array.from(event.target.files) : [];
    if (files.length === 0) {
      return;
    }
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result !== "string") {
          return;
        }
        const created = store.addUploadImage(file.name, reader.result);
        if (!created) {
          window.alert(`Falha ao salvar upload: ${file.name}`);
          return;
        }
        renderImageList();
      };
      reader.readAsDataURL(file);
    });
    event.target.value = "";
  }

  function buildUi() {
    const style = document.createElement("style");
    style.setAttribute(UI_ATTR, "true");
    style.textContent = `
      .slide-editor-toolbar {
        position: fixed;
        right: 16px;
        top: 16px;
        z-index: 1200;
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        max-width: 88vw;
      }
      .slide-editor-toolbar.hidden {
        display: none;
      }
      .slide-editor-status {
        border: 1px solid #30363d;
        background: rgba(13, 17, 23, 0.9);
        color: #8b949e;
        border-radius: 999px;
        font-size: 12px;
        padding: 8px 12px;
      }
      .slide-editor-toolbar button {
        border: 1px solid #30363d;
        background: #0d1117;
        color: #e6edf3;
        border-radius: 999px;
        font-size: 12px;
        padding: 8px 12px;
        cursor: pointer;
      }
      .slide-editor-toolbar button:hover {
        border-color: #6e40c9;
      }
      .slide-editor-toolbar button.active {
        border-color: #6e40c9;
        color: #a371f7;
      }
      .slide-editor-gear-button {
        border: none !important;
        background: transparent !important;
        padding: 2px 6px !important;
        font-size: 22px !important;
        line-height: 1;
        min-width: auto;
      }
      .slide-editor-gear-button:hover {
        border-color: transparent !important;
        transform: scale(1.08);
      }
      .slide-editor-gear-visible {
        color: #a371f7 !important;
        text-shadow: 0 0 10px rgba(163, 113, 247, 0.45);
      }
      .slide-editor-show-controls {
        position: fixed;
        right: 16px;
        top: 16px;
        z-index: 1201;
        display: none;
        color: rgba(230, 237, 243, 0.65);
        cursor: pointer;
      }
      .slide-editor-show-controls.show {
        display: inline-block;
      }
      .slide-editor-home-button {
        position: fixed;
        left: 16px;
        top: 16px;
        z-index: 1201;
        border: 1px solid #30363d;
        background: rgba(13, 17, 23, 0.92);
        color: #e6edf3;
        border-radius: 999px;
        width: 38px;
        height: 38px;
        font-size: 18px;
        line-height: 1;
        padding: 0;
        cursor: pointer;
      }
      .slide-editor-home-button:hover {
        border-color: #6e40c9;
        color: #a371f7;
      }
      .slide-editor-inline-target {
        outline: 2px dashed #6e40c9;
        outline-offset: 6px;
        cursor: text;
      }
      .slide-editor-image-target {
        outline: 2px dashed #3fb950;
      }
      .slide-editor-code-panel,
      .slide-editor-side-panel {
        position: fixed;
        top: 64px;
        right: 16px;
        width: min(660px, 94vw);
        height: min(76vh, 700px);
        z-index: 1200;
        border: 1px solid #30363d;
        border-radius: 10px;
        background: #0d1117;
        display: none;
        flex-direction: column;
        box-shadow: 0 10px 28px rgba(0, 0, 0, 0.45);
      }
      .slide-editor-code-panel.open,
      .slide-editor-side-panel.open {
        display: flex;
      }
      .slide-editor-code-panel header,
      .slide-editor-side-panel header {
        border-bottom: 1px solid #21262d;
        padding: 10px 12px;
        font-size: 12px;
        color: #8b949e;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
      }
      .slide-editor-code-panel header button,
      .slide-editor-side-panel header button,
      .slide-editor-list-actions button,
      .slide-editor-panel-actions button {
        border: 1px solid #30363d;
        background: #0d1117;
        color: #e6edf3;
        border-radius: 999px;
        font-size: 11px;
        padding: 6px 10px;
        cursor: pointer;
      }
      .slide-editor-code-panel textarea,
      .slide-editor-side-panel textarea,
      .slide-editor-side-panel input {
        width: 100%;
        border: 1px solid #30363d;
        border-radius: 8px;
        outline: 0;
        padding: 10px;
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
        font-size: 12px;
        line-height: 1.5;
        color: #e6edf3;
        background: #0d1117;
      }
      .slide-editor-code-panel textarea {
        flex: 1;
        resize: none;
        border: 0;
        border-radius: 0;
      }
      .slide-editor-code-panel footer,
      .slide-editor-side-panel footer {
        border-top: 1px solid #21262d;
        padding: 8px 12px;
        color: #8b949e;
        font-size: 11px;
      }
      .slide-editor-side-panel .panel-body {
        display: grid;
        grid-template-columns: minmax(260px, 1fr) minmax(280px, 1fr);
        gap: 12px;
        padding: 12px;
        overflow: auto;
      }
      .slide-editor-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .slide-editor-list-row {
        border: 1px solid #30363d;
        border-radius: 8px;
        padding: 8px;
      }
      .slide-editor-list-title {
        font-size: 12px;
        color: #e6edf3;
        margin-bottom: 4px;
        font-weight: 700;
      }
      .slide-editor-list-description {
        font-size: 11px;
        color: #8b949e;
        margin-bottom: 8px;
      }
      .slide-editor-list-actions {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
      }
      .slide-editor-form {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .slide-editor-form textarea {
        min-height: 190px;
        resize: vertical;
      }
      .slide-editor-panel-actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      .slide-editor-image-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        gap: 8px;
        padding: 12px;
        overflow: auto;
      }
      .slide-editor-image-card {
        border: 1px solid #30363d;
        border-radius: 8px;
        padding: 8px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .slide-editor-image-preview {
        width: 100%;
        height: 90px;
        object-fit: contain;
        background: #161b22;
        border: 1px solid #21262d;
        border-radius: 6px;
      }
      .slide-editor-image-name {
        font-size: 11px;
        color: #8b949e;
        word-break: break-word;
      }
      .slide-editor-upload-wrap {
        padding: 12px;
        border-bottom: 1px solid #21262d;
      }
      @media (max-width: 940px) {
        .slide-editor-side-panel .panel-body {
          grid-template-columns: 1fr;
        }
      }
    `;
    document.head.appendChild(style);

    backToHomeButton = document.createElement("button");
    backToHomeButton.type = "button";
    backToHomeButton.className = "slide-editor-home-button";
    backToHomeButton.textContent = "✕";
    backToHomeButton.title = `Voltar para galeria (${activeDeck.title})`;
    backToHomeButton.setAttribute("aria-label", "Fechar apresentação e voltar para a página inicial");
    backToHomeButton.setAttribute(UI_ATTR, "true");
    backToHomeButton.addEventListener("click", () => {
      window.location.assign(getHomePagePath());
    });
    document.body.appendChild(backToHomeButton);

    const toolbar = document.createElement("div");
    toolbar.className = "slide-editor-toolbar";
    toolbar.setAttribute(UI_ATTR, "true");

    statusText = document.createElement("span");
    statusText.className = "slide-editor-status";

    toggleButton = document.createElement("button");
    toggleButton.textContent = "Editar slide";
    toggleButton.type = "button";
    toggleButton.addEventListener("click", () => {
      closeCodeEditor();
      closeTemplatePanel();
      closeImagePanel();
      setInlineEditing(!inlineEditing);
    });

    const addButton = document.createElement("button");
    addButton.textContent = "+ Slide";
    addButton.type = "button";
    addButton.addEventListener("click", addSlide);

    templatesButton = document.createElement("button");
    templatesButton.textContent = "Templates";
    templatesButton.type = "button";
    templatesButton.addEventListener("click", () => {
      if (templatePanel && templatePanel.classList.contains("open")) {
        closeTemplatePanel();
      } else {
        openTemplatePanel();
      }
    });

    const duplicateButton = document.createElement("button");
    duplicateButton.textContent = "Duplicar";
    duplicateButton.type = "button";
    duplicateButton.addEventListener("click", duplicateSlide);

    const closeButton = document.createElement("button");
    closeButton.textContent = "Fechar slide";
    closeButton.type = "button";
    closeButton.addEventListener("click", closeCurrentSlide);

    imagesButton = document.createElement("button");
    imagesButton.textContent = "Imagens";
    imagesButton.type = "button";
    imagesButton.addEventListener("click", () => {
      if (imagePanel && imagePanel.classList.contains("open")) {
        closeImagePanel();
      } else {
        openImagePanel();
      }
    });

    htmlButton = document.createElement("button");
    htmlButton.textContent = "Editar HTML";
    htmlButton.type = "button";
    htmlButton.addEventListener("click", () => {
      if (codeMode === "html") {
        closeCodeEditor();
        return;
      }
      openCodeEditor("html");
    });

    cssButton = document.createElement("button");
    cssButton.textContent = "Editar CSS";
    cssButton.type = "button";
    cssButton.addEventListener("click", () => {
      if (codeMode === "css") {
        closeCodeEditor();
        return;
      }
      openCodeEditor("css");
    });

    const deckButton = document.createElement("button");
    deckButton.textContent = "Deck";
    deckButton.type = "button";
    deckButton.addEventListener("click", editDeckMetadata);

    const removeDeckButton = document.createElement("button");
    removeDeckButton.textContent = "Excluir deck";
    removeDeckButton.type = "button";
    removeDeckButton.addEventListener("click", deleteCurrentDeck);

    const exportButton = document.createElement("button");
    exportButton.textContent = "Exportar HTML";
    exportButton.type = "button";
    exportButton.addEventListener("click", exportSlides);

    const resetButton = document.createElement("button");
    resetButton.textContent = "Resetar deck";
    resetButton.type = "button";
    resetButton.addEventListener("click", resetSlides);

    hideControlsButton = document.createElement("button");
    hideControlsButton.textContent = "⚙";
    hideControlsButton.title = "Esconder botoes";
    hideControlsButton.setAttribute("aria-label", "Esconder botoes");
    hideControlsButton.className = "slide-editor-gear-button slide-editor-gear-visible";
    hideControlsButton.type = "button";
    hideControlsButton.addEventListener("click", hideControls);

    toolbar.appendChild(statusText);
    toolbar.appendChild(toggleButton);
    toolbar.appendChild(addButton);
    toolbar.appendChild(templatesButton);
    toolbar.appendChild(duplicateButton);
    toolbar.appendChild(closeButton);
    toolbar.appendChild(imagesButton);
    toolbar.appendChild(htmlButton);
    toolbar.appendChild(cssButton);
    toolbar.appendChild(deckButton);
    toolbar.appendChild(removeDeckButton);
    toolbar.appendChild(exportButton);
    toolbar.appendChild(resetButton);
    toolbar.appendChild(hideControlsButton);
    document.body.appendChild(toolbar);

    showControlsButton = document.createElement("button");
    showControlsButton.type = "button";
    showControlsButton.textContent = "⚙";
    showControlsButton.title = "Mostrar botoes";
    showControlsButton.setAttribute("aria-label", "Mostrar botoes");
    showControlsButton.className = "slide-editor-show-controls slide-editor-gear-button";
    showControlsButton.setAttribute(UI_ATTR, "true");
    showControlsButton.addEventListener("click", showControls);
    document.body.appendChild(showControlsButton);

    codePanel = document.createElement("div");
    codePanel.className = "slide-editor-code-panel";
    codePanel.setAttribute(UI_ATTR, "true");

    const panelHeader = document.createElement("header");
    panelTitle = document.createElement("span");
    panelTitle.textContent = "Editor";
    const panelCloseButton = document.createElement("button");
    panelCloseButton.type = "button";
    panelCloseButton.textContent = "Fechar";
    panelCloseButton.addEventListener("click", closeCodeEditor);
    panelHeader.appendChild(panelTitle);
    panelHeader.appendChild(panelCloseButton);

    codeTextarea = document.createElement("textarea");
    codeTextarea.setAttribute("aria-label", "Editor de codigo do slide");
    codeTextarea.addEventListener("input", () => {
      if (codeMode === "html") {
        const current = getCurrentSlide();
        if (!current) {
          return;
        }
        current.innerHTML = codeTextarea.value;
        syncRevealLayout();
      } else if (codeMode === "css" && editableStyleTag) {
        editableStyleTag.textContent = codeTextarea.value;
      }
      queueSave();
    });

    const panelFooter = document.createElement("footer");
    panelFooter.textContent = "As alteracoes de HTML/CSS sao salvas automaticamente no deck atual.";

    codePanel.appendChild(panelHeader);
    codePanel.appendChild(codeTextarea);
    codePanel.appendChild(panelFooter);
    document.body.appendChild(codePanel);

    templatePanel = document.createElement("div");
    templatePanel.className = "slide-editor-side-panel";
    templatePanel.setAttribute(UI_ATTR, "true");

    const templateHeader = document.createElement("header");
    const templateHeaderTitle = document.createElement("span");
    templateHeaderTitle.textContent = "Templates de pagina";
    const templateCloseButton = document.createElement("button");
    templateCloseButton.type = "button";
    templateCloseButton.textContent = "Fechar";
    templateCloseButton.addEventListener("click", closeTemplatePanel);
    templateHeader.appendChild(templateHeaderTitle);
    templateHeader.appendChild(templateCloseButton);

    const templateBody = document.createElement("div");
    templateBody.className = "panel-body";

    templateList = document.createElement("div");
    templateList.className = "slide-editor-list";

    const templateForm = document.createElement("div");
    templateForm.className = "slide-editor-form";

    templateNameInput = document.createElement("input");
    templateNameInput.type = "text";
    templateNameInput.placeholder = "Nome do template";

    templateDescriptionInput = document.createElement("input");
    templateDescriptionInput.type = "text";
    templateDescriptionInput.placeholder = "Descricao";

    templateHtmlTextarea = document.createElement("textarea");
    templateHtmlTextarea.placeholder = "HTML da pagina template";

    const templateActions = document.createElement("div");
    templateActions.className = "slide-editor-panel-actions";

    const templateSaveButton = document.createElement("button");
    templateSaveButton.type = "button";
    templateSaveButton.textContent = "Salvar template";
    templateSaveButton.addEventListener("click", saveTemplateFromPanel);

    const templateNewButton = document.createElement("button");
    templateNewButton.type = "button";
    templateNewButton.textContent = "Novo";
    templateNewButton.addEventListener("click", () => {
      selectedTemplateId = "";
      templateNameInput.value = "";
      templateDescriptionInput.value = "";
      templateHtmlTextarea.value = "";
      renderTemplateList();
    });

    const templateFromSlideButton = document.createElement("button");
    templateFromSlideButton.type = "button";
    templateFromSlideButton.textContent = "Salvar slide atual";
    templateFromSlideButton.addEventListener("click", createTemplateFromCurrentSlide);

    const templateDeleteButton = document.createElement("button");
    templateDeleteButton.type = "button";
    templateDeleteButton.textContent = "Excluir";
    templateDeleteButton.addEventListener("click", deleteSelectedTemplate);

    const templateInsertButton = document.createElement("button");
    templateInsertButton.type = "button";
    templateInsertButton.textContent = "Inserir no deck";
    templateInsertButton.addEventListener("click", () => {
      if (!selectedTemplateId) {
        window.alert("Selecione um template.");
        return;
      }
      const template = store.listTemplates().find((item) => item.id === selectedTemplateId);
      if (!template) {
        window.alert("Template nao encontrado.");
        return;
      }
      insertSlideFromTemplate(template.html || "");
      closeTemplatePanel();
    });

    templateActions.appendChild(templateSaveButton);
    templateActions.appendChild(templateNewButton);
    templateActions.appendChild(templateFromSlideButton);
    templateActions.appendChild(templateDeleteButton);
    templateActions.appendChild(templateInsertButton);

    templateForm.appendChild(templateNameInput);
    templateForm.appendChild(templateDescriptionInput);
    templateForm.appendChild(templateHtmlTextarea);
    templateForm.appendChild(templateActions);

    templateBody.appendChild(templateList);
    templateBody.appendChild(templateForm);

    const templateFooter = document.createElement("footer");
    templateFooter.textContent = "Templates padrao sao somente leitura. Para editar, selecione e salve como novo template.";

    templatePanel.appendChild(templateHeader);
    templatePanel.appendChild(templateBody);
    templatePanel.appendChild(templateFooter);
    document.body.appendChild(templatePanel);

    imagePanel = document.createElement("div");
    imagePanel.className = "slide-editor-side-panel";
    imagePanel.setAttribute(UI_ATTR, "true");

    const imageHeader = document.createElement("header");
    const imageTitle = document.createElement("span");
    imageTitle.textContent = "Biblioteca de imagens";
    const imageCloseButton = document.createElement("button");
    imageCloseButton.type = "button";
    imageCloseButton.textContent = "Fechar";
    imageCloseButton.addEventListener("click", closeImagePanel);
    imageHeader.appendChild(imageTitle);
    imageHeader.appendChild(imageCloseButton);

    const uploadWrap = document.createElement("div");
    uploadWrap.className = "slide-editor-upload-wrap";
    imageUploadInput = document.createElement("input");
    imageUploadInput.type = "file";
    imageUploadInput.accept = "image/*";
    imageUploadInput.multiple = true;
    imageUploadInput.addEventListener("change", handleImageUpload);
    uploadWrap.appendChild(imageUploadInput);

    imageList = document.createElement("div");
    imageList.className = "slide-editor-image-list";

    const imageFooter = document.createElement("footer");
    imageFooter.textContent = "Ative 'Editar slide' para inserir a imagem na posicao atual do cursor.";

    imagePanel.appendChild(imageHeader);
    imagePanel.appendChild(uploadWrap);
    imagePanel.appendChild(imageList);
    imagePanel.appendChild(imageFooter);
    document.body.appendChild(imagePanel);

    slidesRoot.addEventListener("input", (event) => {
      if (!inlineEditing || !editableSlide) {
        return;
      }
      if (!editableSlide.contains(event.target)) {
        return;
      }
      captureCaretRange();
      syncRevealLayout();
      queueSave();
    });

    slidesRoot.addEventListener("keyup", captureCaretRange);
    slidesRoot.addEventListener("mouseup", captureCaretRange);
    document.addEventListener("selectionchange", captureCaretRange);

    slidesRoot.addEventListener("click", (event) => {
      const clickedImage = event.target.closest("img");
      if (clickedImage && slidesRoot.contains(clickedImage)) {
        setSelectedImage(clickedImage);
        updateStatus(getCurrentSlide());
      }
      if (!inlineEditing) {
        return;
      }
      const link = event.target.closest("a");
      if (link) {
        event.preventDefault();
      }
    }, true);

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && codePanel && codePanel.classList.contains("open")) {
        closeCodeEditor();
      } else if (event.key === "Escape" && templatePanel && templatePanel.classList.contains("open")) {
        closeTemplatePanel();
      } else if (event.key === "Escape" && imagePanel && imagePanel.classList.contains("open")) {
        closeImagePanel();
      }
    });

    updateStatus(getCurrentSlide());
  }

  window.initSlideEditor = function initSlideEditor(revealInstance) {
    reveal = revealInstance || null;
    if (reveal && typeof reveal.on === "function") {
      reveal.on("slidechanged", () => {
        setEditableSlide(getCurrentSlide());
        if (codeMode === "html" && codeTextarea) {
          const current = getCurrentSlide();
          codeTextarea.value = current ? current.innerHTML.trim() : "";
        }
        if (selectedImageElement && !document.contains(selectedImageElement)) {
          setSelectedImage(null);
        }
      });
    }
    setEditableSlide(getCurrentSlide());
  };

  buildUi();
})();
