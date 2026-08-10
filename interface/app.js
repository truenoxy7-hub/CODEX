const elements = {
  description: document.querySelector("#description"),
  interpret: document.querySelector("#interpret"),
  interpretation: document.querySelector("#interpretation"),
  interpretationTitle: document.querySelector("#interpretation-title"),
  edit: document.querySelector("#edit"),
  confirm: document.querySelector("#confirm"),
  previewState: document.querySelector("#preview-state"),
  previewMessage: document.querySelector("#preview-message"),
  semanticDot: document.querySelector("#semantic-dot"),
  semanticStatus: document.querySelector("#semantic-status"),
  relationDot: document.querySelector("#relation-dot"),
  relationStatus: document.querySelector("#relation-status"),
  announcer: document.querySelector("#announcer"),
};

function setStep(activeStep) {
  document.querySelectorAll(".stepper li").forEach((step) => {
    step.classList.toggle("is-active", step.dataset.step === activeStep);
  });
}

function announce(message) {
  elements.announcer.textContent = "";
  window.setTimeout(() => {
    elements.announcer.textContent = message;
  }, 30);
}

function showInterpretation() {
  if (!elements.description.value.trim()) {
    elements.description.focus();
    announce("Escriu una descripció abans d'interpretar l'exercici.");
    return;
  }

  elements.interpretation.hidden = false;
  elements.semanticDot.classList.add("is-ready");
  elements.semanticStatus.textContent = "Interpretació disponible";
  elements.previewState.textContent = "Pendent de confirmació";
  elements.previewState.classList.remove("is-ready");
  setStep("review");
  elements.interpretationTitle.focus();
  announce("Interpretació provisional preparada. Revisa les dues fases detectades.");
}

function editDescription() {
  elements.description.focus();
  setStep("write");
  announce("Pots modificar la descripció i tornar-la a interpretar.");
}

function confirmInterpretation() {
  elements.relationDot.classList.add("is-ready");
  elements.relationStatus.textContent = "Contracte UVOF001 disponible";
  elements.previewState.textContent = "Interpretació confirmada";
  elements.previewState.classList.add("is-ready");
  elements.previewMessage.innerHTML = `
    <span class="preview-symbol" aria-hidden="true">✓</span>
    <strong>Preparat per generar</strong>
    <p>La interpretació queda confirmada. Connectarem aquí el motor geomètric en la propera iteració.</p>
  `;
  setStep("generate");
  announce("Interpretació confirmada. El model està preparat per al futur motor gràfic.");
}

elements.interpret.addEventListener("click", showInterpretation);
elements.edit.addEventListener("click", editDescription);
elements.confirm.addEventListener("click", confirmInterpretation);
