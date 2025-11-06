
// =====================
// UniTrack - Agenda con Google Login + Calendar con hora personalizada
// =====================

// --- Inicialización de tareas ---
const taskForm = document.getElementById("taskForm");
const taskList = document.getElementById("taskList");
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

// --- Renderizar tareas ---
function renderTasks() {
  taskList.innerHTML = "";
  if (tasks.length === 0) {
    taskList.innerHTML = "<p>No hay tareas aún 📭</p>";
    return;
  }

  tasks.forEach((task, index) => {
    const li = document.createElement("li");
    li.classList.add("task");
    li.innerHTML = `
      <div>
        <strong>${task.title}</strong><br>
        <small>${task.category} — ${task.date} (${task.startTime} - ${task.endTime})</small>
      </div>
      <button class="delete" data-index="${index}">🗑️</button>
    `;
    taskList.appendChild(li);
  });
}

// --- Agregar tarea ---
taskForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const title = document.getElementById("title").value.trim();
  const date = document.getElementById("date").value;
  const startTime = document.getElementById("startTime").value;
  const endTime = document.getElementById("endTime").value;
  const category = document.getElementById("category").value;

  if (!title || !date || !startTime || !endTime)
    return alert("Completa todos los campos");

  const newTask = { title, date, startTime, endTime, category };
  tasks.push(newTask);
  localStorage.setItem("tasks", JSON.stringify(tasks));
  taskForm.reset();
  renderTasks();

  // --- Si hay sesión con Google, crear evento en Calendar ---
  if (accessToken) {
    const startDateTime = new Date(`${date}T${startTime}:00`);
    const endDateTime = new Date(`${date}T${endTime}:00`);

    const event = {
      summary: `${title} (${category})`,
      start: { dateTime: startDateTime.toISOString(), timeZone: "America/Bogota" },
      end: { dateTime: endDateTime.toISOString(), timeZone: "America/Bogota" },
    };

    fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(event),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.id) {
          alert("✅ Tarea agregada también a tu Google Calendar 🎉");
        } else {
          console.error("Error al crear evento:", data);
          alert("⚠️ No se pudo agregar al Calendar. Revisa la consola.");
        }
      })
      .catch((err) => console.error("Error al conectar con Calendar:", err));
  }
});

// --- Eliminar tarea ---
taskList.addEventListener("click", (e) => {
  if (e.target.classList.contains("delete")) {
    const index = e.target.dataset.index;
    tasks.splice(index, 1);
    localStorage.setItem("tasks", JSON.stringify(tasks));
    renderTasks();
  }
});

renderTasks();

// --- Botón de modo oscuro/claro ---
const themeToggle = document.getElementById("themeToggle");
const loginButton = document.getElementById("loginGoogle");

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  themeToggle.textContent = document.body.classList.contains("dark")
    ? "🌞 Modo Claro"
    : "🌓 Modo Oscuro";

  // Cambiar texto del botón Google según el modo
  if (document.body.classList.contains("dark")) {
    loginButton.style.color = "#fff";
  } else {
    loginButton.style.color = "#fff"; // mismo color, puedes ajustar si quieres
  }
});

// --- Exportar tareas a CSV ---
document.getElementById("exportBtn").addEventListener("click", () => {
  if (tasks.length === 0) return alert("No hay tareas para exportar");

  const headers = ["Título", "Fecha", "Hora inicio", "Hora fin", "Categoría"];
  const rows = tasks.map((t) => [t.title, t.date, t.startTime, t.endTime, t.category]);

  let csvContent = headers.join(",") + "\n" + rows.map((r) => r.join(",")).join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "UniTrack_tareas.csv";
  link.click();
});

// ============================
// 🔑 Autenticación con Google
// ============================
const CLIENT_ID = "885469183343-lpr31ui9scfq0oiq5e8s3tba6oejg3br.apps.googleusercontent.com";

let redirectUri;
if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
  redirectUri = "http://127.0.0.1:5500/";
} else {
  redirectUri = "https://angelcub23.github.io/unitrack/";
}

loginButton.addEventListener("click", () => {
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=token&scope=email%20profile%20openid%20https://www.googleapis.com/auth/calendar.events`;
  window.location.href = authUrl;
});

// ============================
// 🗓️ Vincular UniTrack con Google Calendar
// ============================
const params = new URLSearchParams(window.location.hash.substring(1));
const accessToken = params.get("access_token");

if (accessToken) {
  console.log("✅ Token de acceso recibido:", accessToken);

  fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
    .then((res) => res.json())
    .then((data) => {
      alert(`Hola ${data.name || data.email}! Has iniciado sesión con Google 🎉`);
    })
    .catch((err) => console.error("Error obteniendo info de usuario:", err));

  fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=5&orderBy=startTime&singleEvents=true",
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
    .then((res) => res.json())
    .then((data) => console.log("📅 Próximos eventos:", data.items))
    .catch((err) => console.error("Error al listar eventos:", err));
}