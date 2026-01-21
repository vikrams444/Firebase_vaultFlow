import { auth, db, storage } from "./firebase.js";
import { openModal, closeModal, setModalError, setModalLoading } from "./ui.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";

import {
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-storage.js";

import {
  doc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

const logoutBtn = document.getElementById("logoutBtn");

const newFolderBtn = document.getElementById("newFolderBtn");
const addFileBtn = document.getElementById("addFileBtn");
const newNoteBtn = document.getElementById("newNoteBtn");
const addMemberBtn = document.getElementById("addMemberBtn");

const filesList = document.getElementById("filesList");
const notesList = document.getElementById("notesList");
const membersList = document.getElementById("membersList");
const filesHint = document.getElementById("filesHint");

let uid = null;
let filesCount = 0;

function renderEmpty(el, msg) {
  el.innerHTML = `<p class="muted">${msg}</p>`;
}

function renderLoading(el) {
  el.innerHTML = `<p class="muted">Loading...</p>`;
}

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  if (!user.emailVerified) {
    window.location.href = "index.html";
    return;
  }

  uid = user.uid;

  setupFirestoreLists();
  setupButtons();
});

function setupFirestoreLists() {
  // ✅ Files
  renderLoading(filesList);
  const filesRef = collection(db, "users", uid, "files");
  const filesQ = query(filesRef, orderBy("createdAt", "desc"));

  onSnapshot(filesQ, (snap) => {
    filesCount = snap.size;

    // ✅ Free plan limit
    if (filesCount >= 5) {
      addFileBtn.disabled = true;
      filesHint.innerText = "You’ve reached the free plan limit.";
    } else {
      addFileBtn.disabled = false;
      filesHint.innerText = "";
    }

    if (snap.empty) {
      renderEmpty(filesList, "No files yet.");
      return;
    }

    filesList.innerHTML = "";
    snap.forEach((docSnap) => {
      const f = docSnap.data();

      const row = document.createElement("div");
      row.className = "listRow";

      row.innerHTML = `
        <div>
          <b>${f.name || "Untitled"}</b>
          <div class="small muted">${f.type || ""} • ${Math.round((f.size || 0) / 1024)} KB</div>
        </div>

        <div class="row">
          <button class="secondary" data-action="download">Download</button>
          <button class="danger" data-action="delete">Delete</button>
        </div>
      `;

      // Download
      row.querySelector('[data-action="download"]').addEventListener("click", () => {
        if (f.downloadURL) window.open(f.downloadURL, "_blank");
      });

      // Delete
      row.querySelector('[data-action="delete"]').addEventListener("click", async () => {
        try {
          // Storage delete
          if (f.storagePath) {
            await deleteObject(ref(storage, f.storagePath));
          }
          // Firestore doc delete
          await deleteDoc(doc(db, "users", uid, "files", docSnap.id));
        } catch (err) {
          console.log(err);
        }
      });

      filesList.appendChild(row);
    });
  });

  // ✅ Notes
  renderLoading(notesList);
  const notesRef = collection(db, "users", uid, "notes");
  const notesQ = query(notesRef, orderBy("createdAt", "desc"));

  onSnapshot(notesQ, (snap) => {
    if (snap.empty) {
      renderEmpty(notesList, "No notes yet.");
      return;
    }

    notesList.innerHTML = "";
    snap.forEach((docSnap) => {
      const n = docSnap.data();
      const card = document.createElement("div");
      card.className = "listRow";
      card.innerHTML = `
        <div>
          <b>${n.title || "Untitled Note"}</b>
          <div class="small muted">${(n.content || "").slice(0, 60)}</div>
        </div>
      `;
      notesList.appendChild(card);
    });
  });

  // ✅ Team Members
  renderLoading(membersList);
  const membersRef = collection(db, "users", uid, "teamMembers");
  const memQ = query(membersRef, orderBy("createdAt", "desc"));

  onSnapshot(memQ, (snap) => {
    if (snap.empty) {
      renderEmpty(membersList, "No team members yet.");
      return;
    }

    membersList.innerHTML = "";
    snap.forEach((docSnap) => {
      const m = docSnap.data();
      const row = document.createElement("div");
      row.className = "listRow";
      row.innerHTML = `
        <div>
          <b>${m.name || "Member"}</b>
          <div class="small muted">${m.role || ""}</div>
        </div>
      `;
      membersList.appendChild(row);
    });
  });
}

function setupButtons() {
  // ✅ New Folder
  newFolderBtn.addEventListener("click", () => {
    openModal({
      title: "New Folder",
      bodyHTML: `
        <div class="field">
          <label>Folder Name</label>
          <input id="folderName" type="text" placeholder="e.g. Work Docs" />
        </div>
      `,
      onOk: async () => {
        const name = document.getElementById("folderName").value.trim();
        if (!name) return setModalError("Folder name is required");

        try {
          setModalLoading(true);
          await addDoc(collection(db, "users", uid, "folders"), {
            name,
            createdAt: serverTimestamp()
          });
          closeModal();
        } catch (err) {
          setModalError("Failed to create folder");
        } finally {
          setModalLoading(false);
        }
      }
    });
  });

  // ✅ New Note
  newNoteBtn.addEventListener("click", () => {
    openModal({
      title: "New Note",
      bodyHTML: `
        <div class="field">
          <label>Title</label>
          <input id="noteTitle" type="text" placeholder="Note title" />
        </div>
        <div class="field">
          <label>Content</label>
          <textarea id="noteContent" placeholder="Write something..."></textarea>
        </div>
      `,
      onOk: async () => {
        const title = document.getElementById("noteTitle").value.trim();
        const content = document.getElementById("noteContent").value.trim();

        if (!title) return setModalError("Title is required");

        try {
          setModalLoading(true);
          await addDoc(collection(db, "users", uid, "notes"), {
            title,
            content,
            createdAt: serverTimestamp()
          });
          closeModal();
        } catch (err) {
          setModalError("Failed to create note");
        } finally {
          setModalLoading(false);
        }
      }
    });
  });

  // ✅ Add Member
  addMemberBtn.addEventListener("click", () => {
    openModal({
      title: "Add Member",
      bodyHTML: `
        <div class="field">
          <label>Name</label>
          <input id="memberName" type="text" placeholder="e.g. Rohan" />
        </div>
        <div class="field">
          <label>Role</label>
          <input id="memberRole" type="text" placeholder="e.g. Designer" />
        </div>
      `,
      onOk: async () => {
        const name = document.getElementById("memberName").value.trim();
        const role = document.getElementById("memberRole").value.trim();

        if (!name) return setModalError("Name is required");

        try {
          setModalLoading(true);
          await addDoc(collection(db, "users", uid, "teamMembers"), {
            name,
            role,
            createdAt: serverTimestamp()
          });
          closeModal();
        } catch (err) {
          setModalError("Failed to add member");
        } finally {
          setModalLoading(false);
        }
      }
    });
  });

  // ✅ Add File (Upload)
  addFileBtn.addEventListener("click", async () => {
    if (filesCount >= 5) {
      openUpgradeModal();
      return;
    }

    const foldersSnap = await getDocs(collection(db, "users", uid, "folders"));
    const folderOptions = foldersSnap.docs.map(d => {
      const f = d.data();
      return `<option value="${d.id}">${f.name}</option>`;
    }).join("");

    openModal({
      title: "Upload File",
      okText: "Upload",
      bodyHTML: `
        <div class="field">
          <label>Select File</label>
          <input id="realFileInput" type="file" />
        </div>

        <div class="field">
          <label>Folder (optional)</label>
          <select id="folderSelect">
            <option value="">None</option>
            ${folderOptions}
          </select>
        </div>

        <p class="muted small" id="progressText"></p>
      `,
      onOk: async () => {
        const fileInput = document.getElementById("realFileInput");
        const folderId = document.getElementById("folderSelect").value || null;
        const progressText = document.getElementById("progressText");

        const file = fileInput.files[0];
        if (!file) return setModalError("Please select a file");

        try {
          setModalLoading(true);

          // ✅ Make unique storage path
          const fileId = crypto.randomUUID();
          const storagePath = `user_uploads/${uid}/${fileId}-${file.name}`;
          const storageRef = ref(storage, storagePath);

          const uploadTask = uploadBytesResumable(storageRef, file);

          uploadTask.on("state_changed", (snap) => {
            const percent = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
            progressText.innerText = `Uploading... ${percent}%`;
          });

          await new Promise((resolve, reject) => {
            uploadTask.on(
              "state_changed",
              null,
              reject,
              resolve
            );
          });

          const downloadURL = await getDownloadURL(storageRef);

          // ✅ Save Firestore metadata
          await addDoc(collection(db, "users", uid, "files"), {
            name: file.name,
            storagePath,
            downloadURL,
            size: file.size,
            type: file.type,
            folderId,
            createdAt: serverTimestamp()
          });

          closeModal();
        } catch (err) {
          console.log(err);
          setModalError("Upload failed. Try again.");
        } finally {
          setModalLoading(false);
        }
      }
    });
  });
}

function openUpgradeModal() {
  openModal({
    title: "Upgrade your plan",
    okText: "Close",
    bodyHTML: `
      <p class="muted">
        You’ve reached the free plan limit. Upgrade to upload more files.
      </p>
    `,
    onOk: () => closeModal()
  });
}
