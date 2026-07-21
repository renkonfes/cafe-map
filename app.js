let map;
let supabaseClient = null;
let currentUser = null;
let cafes = [];
let markers = [];
let coffeeIcon;

const demoKey = "cafe_map_demo_data";

function isSupabaseReady() {
  const config = window.CAFE_MAP_CONFIG || {};
  return config.SUPABASE_URL && config.SUPABASE_KEY;
}

function setupSupabase() {
  if (isSupabaseReady() && window.supabase) {
    supabaseClient = window.supabase.createClient(
      window.CAFE_MAP_CONFIG.SUPABASE_URL,
      window.CAFE_MAP_CONFIG.SUPABASE_KEY
    );
  }
}

function showSetupMessage() {
  const area = document.getElementById("setup-message");
  if (supabaseClient) {
    area.style.display = "none";
    area.textContent = "";
    return;
  }

  area.style.display = "block";
  area.textContent =
    "現在はSupabase未設定のため、このブラウザだけで保存されるデモモードです。config.jsにProject URLとPublishable keyを入れると、みんなで共有できる本番モードになります。";
}

function initMap() {
  map = L.map("map").setView([35.5466, 139.4387], 13);
  coffeeIcon = L.divIcon({
    className: "",
    html: '<div class="coffee-pin"><span>☕</span></div>',
    iconSize: [34, 42],
    iconAnchor: [17, 42],
    popupAnchor: [0, -38]
  });

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap"
  }).addTo(map);

  map.on("click", function (event) {
    document.getElementById("lat").value = event.latlng.lat.toFixed(6);
    document.getElementById("lng").value = event.latlng.lng.toFixed(6);
  });
}

async function checkLogin() {
  if (!supabaseClient) {
    currentUser = { id: "demo-user", email: "demo@example.com" };
    updateLoginStatus();
    return;
  }

  const result = await supabaseClient.auth.getUser();
  currentUser = result.data.user;
  updateLoginStatus();
}

function updateLoginStatus() {
  const status = document.getElementById("login-status");
  const form = document.getElementById("cafe-form");

  if (currentUser) {
    status.textContent = "ログイン中：" + currentUser.email;
    form.style.display = "block";
  } else {
    status.textContent = "ログインしていません。閲覧はできます。";
    form.style.display = "none";
  }
}

async function signup() {
  if (!supabaseClient) {
    alert("デモモードでは登録済み扱いです。");
    return;
  }

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  if (!email || !password) {
    alert("メールアドレスとパスワードを入力してください。");
    return;
  }

  const result = await supabaseClient.auth.signUp({ email, password });
  if (result.error) {
    alert(result.error.message);
    return;
  }
  await checkLogin();
  alert("登録しました。");
}

async function login() {
  if (!supabaseClient) {
    alert("デモモードではログイン済み扱いです。");
    return;
  }

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  if (!email || !password) {
    alert("メールアドレスとパスワードを入力してください。");
    return;
  }

  const result = await supabaseClient.auth.signInWithPassword({ email, password });
  if (result.error) {
    alert(result.error.message);
    return;
  }
  await checkLogin();
  await loadCafes();
}

async function logout() {
  if (supabaseClient) {
    await supabaseClient.auth.signOut();
  }
  currentUser = supabaseClient ? null : { id: "demo-user", email: "demo@example.com" };
  updateLoginStatus();
}

function getFormData() {
  return {
    name: document.getElementById("name").value.trim(),
    address: document.getElementById("address").value.trim(),
    lat: Number(document.getElementById("lat").value),
    lng: Number(document.getElementById("lng").value),
    hours: document.getElementById("hours").value.trim(),
    wifi: document.getElementById("wifi").value,
    power: document.getElementById("power").value,
    parking: document.getElementById("parking").value,
    comment: document.getElementById("comment").value.trim()
  };
}

function validateCafe(data) {
  if (!data.name || !data.address) return "カフェ名と住所を入力してください。";
  if (Number.isNaN(data.lat) || Number.isNaN(data.lng)) return "地図をクリックして緯度・経度を入力してください。";
  return "";
}

async function saveCafe(event) {
  event.preventDefault();
  if (!currentUser) {
    alert("登録するにはログインしてください。");
    return;
  }

  const data = getFormData();
  const error = validateCafe(data);
  if (error) {
    alert(error);
    return;
  }

  const id = document.getElementById("cafe-id").value;

  if (supabaseClient) {
    if (id) {
      const result = await supabaseClient
        .from("cafes")
        .update(data)
        .eq("id", id)
        .eq("user_id", currentUser.id);
      if (result.error) {
        alert(result.error.message);
        return;
      }
    } else {
      const result = await supabaseClient
        .from("cafes")
        .insert({ ...data, user_id: currentUser.id });
      if (result.error) {
        alert(result.error.message);
        return;
      }
    }
  } else {
    saveCafeDemo(id, data);
  }

  clearForm();
  await loadCafes();
}

function saveCafeDemo(id, data) {
  const saved = loadDemoData();
  if (id) {
    const index = saved.findIndex((cafe) => String(cafe.id) === String(id));
    if (index >= 0) saved[index] = { ...saved[index], ...data };
  } else {
    saved.push({
      ...data,
      id: Date.now(),
      user_id: "demo-user",
      like_count: 0,
      comments: []
    });
  }
  localStorage.setItem(demoKey, JSON.stringify(saved));
}

function loadDemoData() {
  const saved = localStorage.getItem(demoKey);
  if (saved) {
    return JSON.parse(saved);
  }
  return [
    {
      id: 1,
      user_id: "demo-user",
      name: "町田サンプルカフェ",
      address: "町田駅周辺",
      lat: 35.5433,
      lng: 139.4450,
      hours: "10:00-19:00",
      wifi: "あり",
      power: "あり",
      parking: "不明",
      comment: "作業しやすい雰囲気のサンプルです。",
      like_count: 0,
      comments: [{ body: "落ち着いていてよさそう" }]
    }
  ];
}

async function loadCafes() {
  if (supabaseClient) {
    const result = await supabaseClient
      .from("cafes")
      .select("*, comments(*)")
      .order("created_at", { ascending: false });

    if (result.error) {
      alert(result.error.message);
      return;
    }
    cafes = result.data || [];
  } else {
    cafes = loadDemoData();
  }

  renderMarkers();
  renderCafeList();
}

function renderMarkers() {
  markers.forEach((marker) => marker.remove());
  markers = [];

  cafes.forEach((cafe) => {
    const marker = L.marker([cafe.lat, cafe.lng], { icon: coffeeIcon }).addTo(map);
    marker.bindPopup(makePopup(cafe));
    markers.push(marker);
  });
}

function makePopup(cafe) {
  const own = currentUser && cafe.user_id === currentUser.id;
  const comments = cafe.comments || [];
  const commentHtml = comments.length
    ? comments.map((item) => `<div class="comment-item">${escapeHtml(item.body || "")}</div>`).join("")
    : "<div class=\"small\">まだコメントはありません</div>";

  return `
    <strong>${escapeHtml(cafe.name)}</strong><br>
    <span>${escapeHtml(cafe.address || "")}</span><br>
    <span>営業時間：${escapeHtml(cafe.hours || "不明")}</span><br>
    <span>Wifi：${escapeHtml(cafe.wifi || "不明")} / 電源：${escapeHtml(cafe.power || "不明")} / 駐車場：${escapeHtml(cafe.parking || "不明")}</span><br>
    <span>${escapeHtml(cafe.comment || "")}</span><br>
    <button onclick="addLike('${cafe.id}')">いいね ${cafe.like_count || 0}</button>
    <div class="comment-box">
      ${commentHtml}
      ${currentUser ? `
        <input id="comment-${cafe.id}" placeholder="コメントを書く">
        <button onclick="addComment('${cafe.id}')">コメント投稿</button>
      ` : "<div class=\"small\">コメントにはログインが必要です</div>"}
    </div>
    ${own ? `
      <div class="popup-actions">
        <button onclick="editCafe('${cafe.id}')">編集</button>
        <button onclick="deleteCafe('${cafe.id}')">削除</button>
      </div>
    ` : ""}
  `;
}

function renderCafeList() {
  const list = document.getElementById("cafe-list");
  if (cafes.length === 0) {
    list.innerHTML = "<p>まだカフェが登録されていません。</p>";
    return;
  }

  list.innerHTML = cafes.map((cafe) => `
    <article class="cafe-card">
      <h3>${escapeHtml(cafe.name)}</h3>
      <p class="small">${escapeHtml(cafe.address || "")}</p>
      <p class="small">営業時間：${escapeHtml(cafe.hours || "不明")}</p>
      <p class="small">Wifi：${escapeHtml(cafe.wifi || "不明")} / 電源：${escapeHtml(cafe.power || "不明")} / 駐車場：${escapeHtml(cafe.parking || "不明")}</p>
      <p>${escapeHtml(cafe.comment || "")}</p>
      <p class="small">いいね：${cafe.like_count || 0}</p>
    </article>
  `).join("");
}

function editCafe(id) {
  const cafe = cafes.find((item) => String(item.id) === String(id));
  if (!cafe) return;

  document.getElementById("cafe-id").value = cafe.id;
  document.getElementById("name").value = cafe.name || "";
  document.getElementById("address").value = cafe.address || "";
  document.getElementById("lat").value = cafe.lat;
  document.getElementById("lng").value = cafe.lng;
  document.getElementById("hours").value = cafe.hours || "";
  document.getElementById("wifi").value = cafe.wifi || "不明";
  document.getElementById("power").value = cafe.power || "不明";
  document.getElementById("parking").value = cafe.parking || "不明";
  document.getElementById("comment").value = cafe.comment || "";
  document.getElementById("save-btn").textContent = "更新";
}

async function deleteCafe(id) {
  if (!confirm("このカフェを削除しますか？")) return;

  if (supabaseClient) {
    const result = await supabaseClient
      .from("cafes")
      .delete()
      .eq("id", id)
      .eq("user_id", currentUser.id);
    if (result.error) {
      alert(result.error.message);
      return;
    }
  } else {
    const saved = loadDemoData().filter((cafe) => String(cafe.id) !== String(id));
    localStorage.setItem(demoKey, JSON.stringify(saved));
  }

  await loadCafes();
}

async function addLike(id) {
  if (!currentUser) {
    alert("いいねにはログインしてください。");
    return;
  }

  const cafe = cafes.find((item) => String(item.id) === String(id));
  const nextCount = (cafe.like_count || 0) + 1;

  if (supabaseClient) {
    const result = await supabaseClient
      .from("cafes")
      .update({ like_count: nextCount })
      .eq("id", id);
    if (result.error) {
      alert(result.error.message);
      return;
    }
  } else {
    const saved = loadDemoData();
    const target = saved.find((item) => String(item.id) === String(id));
    if (target) target.like_count = nextCount;
    localStorage.setItem(demoKey, JSON.stringify(saved));
  }

  await loadCafes();
}

async function addComment(id) {
  if (!currentUser) {
    alert("コメントにはログインしてください。");
    return;
  }

  const input = document.getElementById("comment-" + id);
  const body = input ? input.value.trim() : "";
  if (!body) {
    alert("コメントを入力してください。");
    return;
  }

  if (supabaseClient) {
    const result = await supabaseClient
      .from("comments")
      .insert({ cafe_id: id, user_id: currentUser.id, body });
    if (result.error) {
      alert(result.error.message);
      return;
    }
  } else {
    const saved = loadDemoData();
    const target = saved.find((item) => String(item.id) === String(id));
    if (target) {
      target.comments = target.comments || [];
      target.comments.push({ body });
    }
    localStorage.setItem(demoKey, JSON.stringify(saved));
  }

  await loadCafes();
}

function clearForm() {
  document.getElementById("cafe-id").value = "";
  document.getElementById("cafe-form").reset();
  document.getElementById("save-btn").textContent = "登録";
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function main() {
  setupSupabase();
  showSetupMessage();
  initMap();
  await checkLogin();
  await loadCafes();

  document.getElementById("signup-btn").addEventListener("click", signup);
  document.getElementById("login-btn").addEventListener("click", login);
  document.getElementById("logout-btn").addEventListener("click", logout);
  document.getElementById("cafe-form").addEventListener("submit", saveCafe);
  document.getElementById("cancel-btn").addEventListener("click", clearForm);
}

window.addEventListener("load", main);
