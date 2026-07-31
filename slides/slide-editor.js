(() => {
  "use strict";

  const slidesRoot = document.querySelector(".reveal .slides");
  if (!slidesRoot) {
    return;
  }

  const UI_ATTR = "data-slide-editor-ui";
  const storageKey = `slide-editor:${window.location.pathname}`;
  const baselineSlidesHtml = slidesRoot.innerHTML;
  const editableStyleTag = getEditableStyleTag();
  const baselineCssText = editableStyleTag ? editableStyleTag.textContent : "";

  let reveal = null;
  let saveTimer = null;
  let storageEnabled = true;
  let inlineEditing = false;
  let editableSlide = null;
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

  function saveSlidesNow() {
    if (!storageEnabled) {
      return;
    }
    try {
      const payload = JSON.stringify({
        version: 2,
        slidesHtml: slidesRoot.innerHTML,
        cssText: editableStyleTag ? editableStyleTag.textContent : ""
      });
      window.localStorage.setItem(storageKey, payload);
    } catch (error) {
      storageEnabled = false;
      console.error("Slide editor: failed to persist slides in localStorage.", error);
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

  function updateStatus(slide) {
    if (!statusText) {
      return;
    }
    if (!slide) {
      statusText.textContent = "Sem slide selecionado";
      return;
    }
    if (codeMode === "html") {
      statusText.textContent = `${currentSlideLabel(slide)} - edicao de HTML ativa`;
      return;
    }
    if (codeMode === "css") {
      statusText.textContent = "Edicao de CSS ativa";
      return;
    }
    statusText.textContent = inlineEditing
      ? `${currentSlideLabel(slide)} - edicao de texto ativa`
      : currentSlideLabel(slide);
  }

  function setEditableSlide(slide) {
    if (editableSlide) {
      editableSlide.removeAttribute("contenteditable");
      editableSlide.removeAttribute("spellcheck");
      editableSlide.classList.remove("slide-editor-inline-target");
    }

    editableSlide = null;
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
    toggleButton.textContent = inlineEditing ? "Parar edicao" : "Editar texto";
    setEditableSlide(getCurrentSlide());
  }

  function openCodeEditor(mode) {
    if (!codePanel || !codeTextarea || !panelTitle) {
      return;
    }

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
    setInlineEditing(false);
  }

  function showControls() {
    if (!hideControlsButton || !showControlsButton) {
      return;
    }
    hideControlsButton.parentElement.classList.remove("hidden");
    showControlsButton.classList.remove("show");
  }

  function createSlideElement() {
    const section = document.createElement("section");
    section.innerHTML = "<h2>Novo slide</h2><p>Clique em 'Editar texto' para editar diretamente neste slide.</p>";
    return section;
  }

  function addSlide() {
    const current = getCurrentSlide();
    if (!current || !current.parentElement) {
      return;
    }
    const section = createSlideElement();
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
    const shouldReset = window.confirm("Restaurar os slides para a versao original deste arquivo?");
    if (!shouldReset) {
      return;
    }
    slidesRoot.innerHTML = baselineSlidesHtml;
    if (editableStyleTag) {
      editableStyleTag.textContent = baselineCssText;
    }
    window.localStorage.removeItem(storageKey);
    syncRevealLayout();
    const firstSlide = getLeafSlides()[0] || null;
    if (firstSlide) {
      goToSlide(firstSlide);
    }
    setEditableSlide(firstSlide);
    closeCodeEditor();
  }

  function exportSlides() {
    const clone = document.documentElement.cloneNode(true);
    const nodes = Array.from(clone.querySelectorAll(`[${UI_ATTR}]`));
    nodes.forEach((node) => node.remove());

    const deckName = (window.location.pathname.split("/").filter(Boolean).pop() || "slides").replace(".html", "");
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

  function applySavedState() {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw || raw.trim().length === 0) {
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.slidesHtml === "string" && parsed.slidesHtml.trim().length > 0) {
        slidesRoot.innerHTML = parsed.slidesHtml;
      }
      if (editableStyleTag && typeof parsed.cssText === "string") {
        editableStyleTag.textContent = parsed.cssText;
      }
    } catch (_error) {
      if (raw.trim().length > 0) {
        slidesRoot.innerHTML = raw;
      }
    }
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
        max-width: 78vw;
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
      .slide-editor-show-controls {
        position: fixed;
        right: 16px;
        top: 16px;
        z-index: 1201;
        display: none;
        border: 1px solid #30363d;
        background: #0d1117;
        color: #e6edf3;
        border-radius: 999px;
        font-size: 12px;
        padding: 8px 12px;
        cursor: pointer;
      }
      .slide-editor-show-controls.show {
        display: inline-block;
      }
      .slide-editor-inline-target {
        outline: 2px dashed #6e40c9;
        outline-offset: 6px;
        cursor: text;
      }
      .slide-editor-code-panel {
        position: fixed;
        top: 64px;
        right: 16px;
        width: min(620px, 92vw);
        height: min(72vh, 620px);
        z-index: 1200;
        border: 1px solid #30363d;
        border-radius: 10px;
        background: #0d1117;
        display: none;
        flex-direction: column;
        box-shadow: 0 10px 28px rgba(0, 0, 0, 0.45);
      }
      .slide-editor-code-panel.open {
        display: flex;
      }
      .slide-editor-code-panel header {
        border-bottom: 1px solid #21262d;
        padding: 10px 12px;
        font-size: 12px;
        color: #8b949e;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
      }
      .slide-editor-code-panel header button {
        border: 1px solid #30363d;
        background: #0d1117;
        color: #e6edf3;
        border-radius: 999px;
        font-size: 11px;
        padding: 6px 10px;
        cursor: pointer;
      }
      .slide-editor-code-panel textarea {
        flex: 1;
        width: 100%;
        resize: none;
        border: 0;
        outline: 0;
        padding: 12px;
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
        font-size: 12px;
        line-height: 1.5;
        color: #e6edf3;
        background: #0d1117;
      }
      .slide-editor-code-panel footer {
        border-top: 1px solid #21262d;
        padding: 8px 12px;
        color: #8b949e;
        font-size: 11px;
      }
    `;
    document.head.appendChild(style);

    const toolbar = document.createElement("div");
    toolbar.className = "slide-editor-toolbar";
    toolbar.setAttribute(UI_ATTR, "true");

    toggleButton = document.createElement("button");
    toggleButton.textContent = "Editar texto";
    toggleButton.type = "button";
    toggleButton.addEventListener("click", () => {
      closeCodeEditor();
      setInlineEditing(!inlineEditing);
    });

    const addButton = document.createElement("button");
    addButton.textContent = "+ Slide";
    addButton.type = "button";
    addButton.addEventListener("click", addSlide);

    const duplicateButton = document.createElement("button");
    duplicateButton.textContent = "Duplicar";
    duplicateButton.type = "button";
    duplicateButton.addEventListener("click", duplicateSlide);

    const closeButton = document.createElement("button");
    closeButton.textContent = "Fechar slide";
    closeButton.type = "button";
    closeButton.addEventListener("click", closeCurrentSlide);

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

    const exportButton = document.createElement("button");
    exportButton.textContent = "Exportar HTML";
    exportButton.type = "button";
    exportButton.addEventListener("click", exportSlides);

    const resetButton = document.createElement("button");
    resetButton.textContent = "Resetar";
    resetButton.type = "button";
    resetButton.addEventListener("click", resetSlides);

    hideControlsButton = document.createElement("button");
    hideControlsButton.textContent = "Esconder botoes";
    hideControlsButton.type = "button";
    hideControlsButton.addEventListener("click", hideControls);

    statusText = document.createElement("span");
    statusText.className = "slide-editor-status";

    toolbar.appendChild(statusText);
    toolbar.appendChild(toggleButton);
    toolbar.appendChild(addButton);
    toolbar.appendChild(duplicateButton);
    toolbar.appendChild(closeButton);
    toolbar.appendChild(htmlButton);
    toolbar.appendChild(cssButton);
    toolbar.appendChild(exportButton);
    toolbar.appendChild(resetButton);
    toolbar.appendChild(hideControlsButton);
    document.body.appendChild(toolbar);

    showControlsButton = document.createElement("button");
    showControlsButton.type = "button";
    showControlsButton.textContent = "Mostrar botoes";
    showControlsButton.className = "slide-editor-show-controls";
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
    panelFooter.textContent = "As alteracoes de HTML/CSS sao salvas automaticamente no navegador.";

    codePanel.appendChild(panelHeader);
    codePanel.appendChild(codeTextarea);
    codePanel.appendChild(panelFooter);
    document.body.appendChild(codePanel);

    slidesRoot.addEventListener("input", (event) => {
      if (!inlineEditing || !editableSlide) {
        return;
      }
      if (!editableSlide.contains(event.target)) {
        return;
      }
      syncRevealLayout();
      queueSave();
    });

    slidesRoot.addEventListener("click", (event) => {
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
      });
    }
    setEditableSlide(getCurrentSlide());
  };

  applySavedState();
  buildUi();
})();
