// ===== Add/Remove block support for Add More sections (Optimized) =====
const SECTION_CONFIG = [
  { id: "employmentSection", block: ".employment-block", addFn: "addEmployment" },
  { id: "eduSection",        block: ".edu-block",        addFn: "addEducation" },
  { id: "familySection",     block: ".family-block",     addFn: "addFamily" },
  { id: "certSection",       block: ".cert-block",       addFn: "addCertification" }
];

function clearBlockFields(blockEl) {
  blockEl.querySelectorAll("input, textarea, select").forEach(el => {
    // Reset common input types safely
    if (el.tagName === "SELECT") {
      el.selectedIndex = 0;
      return;
    }
    const t = (el.type || "").toLowerCase();
    if (t === "checkbox" || t === "radio") {
      el.checked = false;
      return;
    }
    el.value = "";
  });
}

function addRemoveButton(blockEl, containerEl, blockSelector, minBlocks = 1) {
  if (blockEl.querySelector(".remove-block-btn")) return;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "remove-block-btn";
  btn.textContent = "Remove";

  btn.addEventListener("click", () => {
    const blocks = containerEl.querySelectorAll(blockSelector);
    if (blocks.length <= minBlocks) {
      alert("At least one entry is required.");
      return;
    }
    blockEl.remove();

    // Ensure first block never shows remove (safety, in case of DOM changes)
    const remaining = containerEl.querySelectorAll(blockSelector);
    remaining.forEach((b, i) => {
      const r = b.querySelector(".remove-block-btn");
      if (i === 0 && r) r.remove();
      if (i > 0 && !r) addRemoveButton(b, containerEl, blockSelector, minBlocks);
    });
  });

  blockEl.appendChild(btn);
}

function initRemoveButtons() {
  SECTION_CONFIG.forEach(cfg => {
    const container = document.getElementById(cfg.id);
    if (!container) return;

    const blocks = Array.from(container.querySelectorAll(cfg.block));

    // Re-normalize remove buttons: first block none; others have it
    blocks.forEach((b, i) => {
      b.querySelectorAll(".remove-block-btn").forEach(x => x.remove());
      if (i > 0) addRemoveButton(b, container, cfg.block, 1);
    });
  });
}

function addBlock(cfg) {
  const container = document.getElementById(cfg.id);
  if (!container) return;

  const firstBlock = container.querySelector(cfg.block);
  if (!firstBlock) return;

  const clone = firstBlock.cloneNode(true);

  // Remove any cloned remove button + clear values
  clone.querySelectorAll(".remove-block-btn").forEach(btn => btn.remove());
  clearBlockFields(clone);

  container.appendChild(clone);
  addRemoveButton(clone, container, cfg.block, 1);
}

// Keep your existing HTML onclick="addEmployment()" etc working:
function addEmployment()      { addBlock(SECTION_CONFIG[0]); }
function addEducation()       { addBlock(SECTION_CONFIG[1]); }
function addFamily()          { addBlock(SECTION_CONFIG[2]); }
function addCertification()   { addBlock(SECTION_CONFIG[3]); }

// Initialize on load
document.addEventListener("DOMContentLoaded", () => {
  initRemoveButtons();
});
