(() => {
  "use strict";

  const recentStorageKey = "prepready-recent-files";
  const maxRecentFiles = 8;

  const $ = id => document.getElementById(id);

  function createElement(tag, className, text = "") {
    const element = document.createElement(tag);

    if (className) {
      element.className = className;
    }

    if (text) {
      element.textContent = text;
    }

    return element;
  }

  function createRecentFilesSection() {
    const existing = document.querySelector(".recent-files");

    if (existing) {
      return existing;
    }

    const section = createElement("section", "recent-files");
    section.innerHTML = `
      <div class="recent-files-header">
        <h2>Recent files</h2>
        <span>Stored on this device</span>
      </div>
      <div class="recent-files-list"></div>
    `;

    const stats = document.querySelector(".stats-row");

    if (stats) {
      stats.after(section);
    }

    return section;
  }

  function readRecentFiles() {
    try {
      return JSON.parse(localStorage.getItem(recentStorageKey)) || [];
    } catch {
      return [];
    }
  }

  function saveRecentFiles(files) {
    try {
      localStorage.setItem(recentStorageKey, JSON.stringify(files));
    } catch {
      // Storage may be unavailable or full. The app continues normally.
    }
  }

  function addRecentFile(file) {
    if (!file || !file.type.startsWith("image/")) {
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const files = readRecentFiles().filter(item => item.name !== file.name);

      files.unshift({
        name: file.name,
        size: file.size,
        type: file.type,
        preview: reader.result,
        createdAt: Date.now()
      });

      saveRecentFiles(files.slice(0, maxRecentFiles));
      renderRecentFiles();
    };

    reader.readAsDataURL(file);
  }

  function renderRecentFiles() {
    const section = createRecentFilesSection();
    const list = section.querySelector(".recent-files-list");
    const files = readRecentFiles();

    list.replaceChildren();

    if (!files.length) {
      const empty = createElement(
        "span",
        "recent-files-empty",
        "Your recently selected images will appear here."
      );

      empty.style.color = "var(--muted)";
      empty.style.fontSize = "12px";
      list.appendChild(empty);
      return;
    }

    files.forEach(file => {
      const item = createElement("div", "recent-file");
      const image = document.createElement("img");
      const details = document.createElement("div");
      const name = createElement("strong", "", file.name);
      const size = createElement("span", "", formatRecentSize(file.size));

      image.src = file.preview;
      image.alt = file.name;

      details.append(name, size);
      item.append(image, details);
      list.appendChild(item);
    });
  }

  function formatRecentSize(bytes) {
    if (!bytes) {
      return "Image";
    }

    const kb = bytes / 1024;

    if (kb < 1024) {
      return `${kb.toFixed(1)} KB`;
    }

    return `${(kb / 1024).toFixed(2)} MB`;
  }

  function setupRecentFiles() {
    renderRecentFiles();

    ["photoFile", "signatureFile", "imageFile"].forEach(id => {
      const input = $(id);

      if (!input) {
        return;
      }

      input.addEventListener("change", () => {
        const file = input.files && input.files[0];

        if (file) {
          addRecentFile(file);
        }
      });
    });
  }

  function setupCollapsibleSettings() {
    document.querySelectorAll(".settings-column").forEach(column => {
      const header = column.querySelector(".settings-header");

      if (!header) {
        return;
      }

      header.setAttribute("role", "button");
      header.setAttribute("tabindex", "0");
      header.setAttribute("aria-expanded", "true");

      const toggle = () => {
        const collapsed = column.classList.toggle("polish-collapsed");
        header.setAttribute("aria-expanded", String(!collapsed));
      };

      header.addEventListener("click", event => {
        if (event.target.closest("button, input, select")) {
          return;
        }

        toggle();
      });

      header.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          toggle();
        }
      });
    });
  }

  function createModal() {
    const backdrop = createElement("div", "polish-modal-backdrop");

    backdrop.innerHTML = `
      <section class="polish-modal" role="dialog" aria-modal="true" aria-labelledby="polishModalTitle">
        <h2 id="polishModalTitle">PrepReady</h2>
        <p id="polishModalMessage"></p>
        <div class="polish-modal-actions">
          <button type="button" class="polish-modal-close">Close</button>
          <button type="button" class="polish-modal-confirm">Continue</button>
        </div>
      </section>
    `;

    document.body.appendChild(backdrop);

    const close = () => {
      backdrop.classList.remove("show");
      document.body.classList.remove("modal-open");
    };

    backdrop.addEventListener("click", event => {
      if (event.target === backdrop) {
        close();
      }
    });

    backdrop.querySelector(".polish-modal-close").addEventListener("click", close);

    return {
      backdrop,
      message: backdrop.querySelector("#polishModalMessage"),
      confirm: backdrop.querySelector(".polish-modal-confirm"),
      close
    };
  }

  function setupModal() {
    const modal = createModal();

    document.querySelectorAll(".download-button").forEach(button => {
      button.addEventListener("click", () => {
        modal.message.textContent =
          "Your processed image is ready. The download should begin automatically.";
        modal.confirm.textContent = "Done";
        modal.confirm.onclick = modal.close;
        modal.backdrop.classList.add("show");
        document.body.classList.add("modal-open");
      });
    });

    document.querySelectorAll(".upload-zone").forEach(zone => {
      zone.addEventListener("contextmenu", event => {
        event.preventDefault();
      });
    });
  }

  function setupNavigationEnhancement() {
    const sections = [...document.querySelectorAll(".tool-section, #dashboard")];
    const navItems = [...document.querySelectorAll(".nav-item")];

    if (!("IntersectionObserver" in window)) {
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(entry => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visible) {
          return;
        }

        navItems.forEach(item => {
          item.classList.toggle(
            "active",
            item.getAttribute("href") === `#${visible.target.id}`
          );
        });
      },
      {
        rootMargin: "-20% 0px -65% 0px",
        threshold: [0.1, 0.3, 0.6]
      }
    );

    sections.forEach(section => observer.observe(section));
  }

  function init() {
    createRecentFilesSection();
    setupRecentFiles();
    setupCollapsibleSettings();
    setupModal();
    setupNavigationEnhancement();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();