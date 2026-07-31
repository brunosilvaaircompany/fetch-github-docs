(() => {
  "use strict";

  const slidesRoot = document.querySelector(".reveal .slides");
  if (!slidesRoot) {
    return;
  }

  const UI_ATTR = "data-slide-editor-ui";
  const storageKey = `slide-editor:${window.location.pathname}`;
  const baselineSlidesHtml = slidesRoot.innerHTML;

  let reveal = null;
  let saveTimer = null;
  let storageEnabled = true;
  let inlineEditing = false;
  let editableSlide = null;
  let statusText = null;
  let toggleButton = null;

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
      window.localStorage.setItem(storageKey, slidesRoot.innerHTML);
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
    window.localStorage.removeItem(storageKey);
    syncRevealLayout();
    const firstSlide = getLeafSlides()[0] || null;
    if (firstSlide) {
      goToSlide(firstSlide);
    }
    setEditableSlide(firstSlide);
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

  function applySavedSlides() {
    const savedSlides = window.localStorage.getItem(storageKey);
    if (savedSlides && savedSlides.trim().length > 0) {
      slidesRoot.innerHTML = savedSlides;
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
      .slide-editor-inline-target {
        outline: 2px dashed #6e40c9;
        outline-offset: 6px;
        cursor: text;
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
      inlineEditing = !inlineEditing;
      toggleButton.textContent = inlineEditing ? "Parar edicao" : "Editar texto";
      setEditableSlide(getCurrentSlide());
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

    const exportButton = document.createElement("button");
    exportButton.textContent = "Exportar HTML";
    exportButton.type = "button";
    exportButton.addEventListener("click", exportSlides);

    const resetButton = document.createElement("button");
    resetButton.textContent = "Resetar";
    resetButton.type = "button";
    resetButton.addEventListener("click", resetSlides);

    statusText = document.createElement("span");
    statusText.className = "slide-editor-status";

    toolbar.appendChild(statusText);
    toolbar.appendChild(toggleButton);
    toolbar.appendChild(addButton);
    toolbar.appendChild(duplicateButton);
    toolbar.appendChild(closeButton);
    toolbar.appendChild(exportButton);
    toolbar.appendChild(resetButton);
    document.body.appendChild(toolbar);

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

    updateStatus(getCurrentSlide());
  }

  window.initSlideEditor = function initSlideEditor(revealInstance) {
    reveal = revealInstance || null;
    if (reveal && typeof reveal.on === "function") {
      reveal.on("slidechanged", () => {
        setEditableSlide(getCurrentSlide());
      });
    }
    setEditableSlide(getCurrentSlide());
  };

  applySavedSlides();
  buildUi();
})();
