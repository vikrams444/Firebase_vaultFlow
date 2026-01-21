const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const modalBody = document.getElementById("modalBody");
const modalError = document.getElementById("modalError");

const modalCancelBtn = document.getElementById("modalCancelBtn");
const modalOkBtn = document.getElementById("modalOkBtn");

let currentOkHandler = null;

export function openModal({ title, bodyHTML, okText = "Create", onOk }) {
  modalTitle.innerText = title;
  modalBody.innerHTML = bodyHTML;
  modalOkBtn.innerText = okText;
  modalError.innerText = "";
  currentOkHandler = onOk;

  modal.classList.remove("hidden");
}

export function closeModal() {
  modal.classList.add("hidden");
}

export function setModalError(msg) {
  modalError.innerText = msg;
}

export function setModalLoading(isLoading) {
  modalOkBtn.disabled = isLoading;
  modalCancelBtn.disabled = isLoading;
  modalOkBtn.innerText = isLoading ? "Please wait..." : modalOkBtn.innerText;
}

modalCancelBtn.addEventListener("click", () => {
  closeModal();
});

modalOkBtn.addEventListener("click", async () => {
  if (currentOkHandler) currentOkHandler();
});
