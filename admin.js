let currentRole = null;
let activities = ['五週年'];

const loginSection     = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');
const loginError       = document.getElementById('login-error');
const btnLogin         = document.getElementById('btn-login');
const btnLogout        = document.getElementById('btn-logout');
const tabRegs          = document.getElementById('tab-registrations');
const tabNonChall      = document.getElementById('tab-nonchallengers');
const btnTabRegs       = document.getElementById('btn-tab-registrations');
const btnTabNonChall   = document.getElementById('btn-tab-nonchallengers');
const tblRegsBody      = document.querySelector('#tbl-registrations tbody');
const tblNonChallBody  = document.querySelector('#tbl-nonchallengers tbody');
const searchBox        = document.getElementById('search-box');
const API_BASE = 'http://localhost:3000';

// sidebar (報名)
const btnShowAddReg   = document.getElementById('show-add-registration');
const regSidebar      = document.getElementById('registration-sidebar');
const regForm         = document.getElementById('registration-form');
const btnCloseAddReg  = document.getElementById('close-add-registration');
// sidebar (非挑戰者)
const btnShowAddNC    = document.getElementById('show-add-nonchallenger');
const ncSidebar       = document.getElementById('nonchallenger-sidebar');
const ncForm          = document.getElementById('nonchallenger-form');
const btnCloseAddNC   = document.getElementById('close-add-nonchallenger');

// 活動下拉選單
const regActSel       = document.getElementById('add-act');
const ncActSel        = document.getElementById('nc-add-act');

let currentTab = 'registrations';

window.addEventListener('DOMContentLoaded', () => {
  showLogin();
  updateActivitySelects();
});

function showLogin() {
  loginSection.classList.remove('hidden');
  dashboardSection.classList.add('hidden');
  closeSidebar();
}
function showDashboard() {
  loginSection.classList.add('hidden');
  dashboardSection.classList.remove('hidden');
  activateTab(currentTab);
}

function activateTab(tabName) {
  currentTab = tabName;
  if (tabName === 'registrations') {
    tabRegs.classList.add('active');
    tabNonChall.classList.remove('active');
    tabRegs.classList.add('tab-content', 'active');
    tabNonChall.classList.remove('tab-content', 'active');
    loadRegistrations();
  } else {
    tabRegs.classList.remove('active');
    tabNonChall.classList.add('active');
    tabRegs.classList.remove('tab-content', 'active');
    tabNonChall.classList.add('tab-content', 'active');
    loadNonChallengers();
  }
  closeSidebar();
}
btnTabRegs.addEventListener('click', () => activateTab('registrations'));
btnTabNonChall.addEventListener('click', () => activateTab('nonchallengers'));

btnShowAddReg.addEventListener('click', () => { regSidebar.classList.add('active'); });
btnCloseAddReg.addEventListener('click', () => { regSidebar.classList.remove('active'); });
btnShowAddNC.addEventListener('click', () => { ncSidebar.classList.add('active'); });
btnCloseAddNC.addEventListener('click', () => { ncSidebar.classList.remove('active'); });

function closeSidebar() {
  regSidebar.classList.remove('active');
  ncSidebar.classList.remove('active');
}

btnLogin.addEventListener('click', async () => {
  loginError.textContent = '';
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  if (!username || !password) {
    loginError.textContent = '請填寫帳號與密碼';
    return;
  }
  try {
    const res = await fetch('https://your-api-host.com/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ username: 'HitomiCyan0820', password: 'Card1130756' })
})
    const data = await res.json();
    if (!res.ok) {
      loginError.textContent = data.message || '登入失敗';
      return;
    }
    currentRole = data.role;
    showDashboard();
  } catch (err) {
    loginError.textContent = '網路錯誤，請稍後再試';
  }
});
btnLogout.addEventListener('click', async () => {
  await fetch(`${API_BASE}/api/admin/logout`, {
    method: 'POST',
    credentials: 'include'
  });
  currentRole = null;
  showLogin();
});

function updateActivitySelects() {
  regActSel.innerHTML = '';
  ncActSel.innerHTML = '';
  activities.forEach(act => {
    const o = document.createElement('option');
    o.value = act; o.textContent = act;
    regActSel.appendChild(o.cloneNode(true));
    ncActSel.appendChild(o.cloneNode(true));
  });
}
document.getElementById('btn-add-activity').onclick =
document.getElementById('btn-add-activity-nc').onclick = () => {
  const name = prompt('請輸入新活動名稱（不可重複）');
  if (!name) return;
  if (activities.includes(name)) { alert('活動已存在！'); return; }
  activities.push(name);
  updateActivitySelects();
  alert('已新增活動：' + name);
};
document.getElementById('btn-del-activity').onclick =
document.getElementById('btn-del-activity-nc').onclick = () => {
  if (activities.length === 0) { alert('目前無活動可刪除'); return; }
  let msg = '請選擇要刪除的活動編號：\n';
  activities.forEach((act, i) => { msg += `${i+1}. ${act}\n`; });
  const idx = prompt(msg);
  const i = parseInt(idx) - 1;
  if (isNaN(i) || i < 0 || i >= activities.length) return;
  const actName = activities[i];
  if (!confirm(`確定要刪除「${actName}」？\n（此動作僅影響下拉列表，不會影響已報名的資料）`)) return;
  activities.splice(i, 1);
  updateActivitySelects();
  alert('已刪除活動：' + actName);
};

// ===== 報名 submit =====
regForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (currentRole !== 'full') { alert('只有 full 權限可新增'); return; }
  const bodyObj = {
    activityName: document.getElementById('add-act').value,
    twitchName: document.getElementById('add-twn').value.trim(),
    twitchID: document.getElementById('add-twid').value.trim(),
    identity: document.getElementById('add-iden').value,
    osuID: document.getElementById('add-osu').value.trim(),
    rank: document.getElementById('add-rank').value,
    time: document.getElementById('add-time').value,
    results: [
      document.getElementById('add-res1').value,
      document.getElementById('add-res2').value,
      document.getElementById('add-res3').value,
    ],
    manualTickets: Number(document.getElementById('add-manual').value) || 0,
  };
  try {
    const res = await fetch('https://your-api-host.com/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ username: 'HitomiCyan0820', password: 'Card1130756' })
})
    const data = await res.json();
    if (!res.ok) { alert(data.message || '新增失敗'); return; }
    alert('新增成功');
    regSidebar.classList.remove('active');
    regForm.reset();
    loadRegistrations();
  } catch (err) {
    alert('伺服器錯誤');
  }
});

// ===== 非挑戰者 submit =====
ncForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (currentRole !== 'full') { alert('只有 full 權限可新增'); return; }
  const bodyObj = {
    activityName: document.getElementById('nc-add-act').value,
    twitchName: document.getElementById('nc-add-twn').value.trim(),
    twitchID: document.getElementById('nc-add-twid').value.trim(),
    manualTickets: Number(document.getElementById('nc-add-manual').value) || 0,
    note: document.getElementById('nc-add-note').value.trim()
  };
  if (!bodyObj.activityName) { alert('活動名稱必填'); return; }
  try {
    const res = await fetch('https://your-api-host.com/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ username: 'HitomiCyan0820', password: 'Card1130756' })
})
    const data = await res.json();
    if (!res.ok) { alert(data.message || '新增失敗'); return; }
    alert('新增成功');
    ncSidebar.classList.remove('active');
    ncForm.reset();
    loadNonChallengers();
  } catch (err) {
    alert('伺服器錯誤');
  }
});

// ====== 載入報名/非挑戰者 ======
async function loadRegistrations() {
  tblRegsBody.innerHTML = '';
  try {
    const res = await fetch(`${API_BASE}/api/registrations`, { method: 'GET', credentials: 'include' });
    if (res.status === 401) { showLogin(); return; }
    const list = await res.json();
    const filtered = list.filter(item => item.identity === '挑戰者' && item.activityName);
    filtered.forEach((item, idx) => {
      const displayId = `${item.activityName}${String(idx + 1).padStart(3, '0')}`;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${displayId}</td>
        <td>${item.activityName}</td>
        <td>${item.twitchName}</td>
        <td>${item.twitchID}</td>
        <td>${item.identity}</td>
        <td>${item.osuID}</td>
        <td>${item.rank}</td>
        <td>${item.time}</td>
        <td>${item.results?.[0] || ''}</td>
        <td>${item.results?.[1] || ''}</td>
        <td>${item.results?.[2] || ''}</td>
        <td>${item.reward || 0}</td>
        <td>${item.manualTickets || 0}</td>
        <td>${item.totalTickets || 0}</td>
        <td>
          <button class="copy-btn" onclick="copyRow(this)">📋</button>
          <button class="btn btn-update" data-id="${item._id}" onclick="updateRow('${item._id}', 'reg')">更新</button>
          <button class="btn btn-delete" data-id="${item._id}" onclick="deleteRow('${item._id}', 'reg')">刪除</button>
        </td>
      `;
      tblRegsBody.appendChild(tr);
    });
    filterByTwitchID(searchBox.value.trim().toLowerCase());
  } catch (err) {
    alert('讀取報名資料失敗');
  }
}

// 非挑戰者
async function loadNonChallengers() {
  tblNonChallBody.innerHTML = '';
  try {
    const res = await fetch(`${API_BASE}/api/nonchallengers`, { method: 'GET', credentials: 'include' });
    if (res.status === 401) { showLogin(); return; }
    const list = await res.json();
    list.forEach((item, idx) => {
      const displayId = `${item.activityName}${String(idx + 1).padStart(3, '0')}`;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${displayId}</td>
        <td>${item.activityName}</td>
        <td>${item.twitchName}</td>
        <td>${item.twitchID}</td>
        <td>${item.manualTickets || 0}</td>
        <td>${item.totalTickets || 0}</td>
        <td>${item.note || ''}</td>
        <td>
          <button class="copy-btn" onclick="copyRow(this)">📋</button>
          <button class="btn btn-update" data-id="${item._id}" onclick="updateRow('${item._id}', 'nc')">更新</button>
          <button class="btn btn-delete" onclick="deleteNcRow('${item._id}')">刪除</button>
        </td>
      `;
      tblNonChallBody.appendChild(tr);
    });
    filterByTwitchID(searchBox.value.trim().toLowerCase());
  } catch (err) {
    alert('讀取非挑戰者資料失敗');
  }
}

// 編輯功能（報名+非挑戰者）
window.updateRow = async function(id, type) {
  if (currentRole !== 'full') { alert('只有 full 權限可更新'); return; }
  let data;
  if (type === 'reg') {
    data = [...document.querySelectorAll('#tbl-registrations tbody tr')]
      .find(tr => tr.querySelector('.btn-update')?.dataset.id === id);
    if (!data) return alert('找不到資料');
    const tds = data.querySelectorAll('td');
    const twitchName = prompt('Twitch 中文名稱：', tds[2].textContent);
    const twitchID   = prompt('Twitch ID：', tds[3].textContent);
    const osuID      = prompt('osu! ID：', tds[5].textContent);
    const rank       = prompt('挑戰 Rank：', tds[6].textContent);
    const time       = prompt('挑戰時間：', tds[7].textContent);
    const manualTickets = prompt('手動抽獎券：', tds[12].textContent);
    const results = [
      prompt('結果1：', tds[8].textContent),
      prompt('結果2：', tds[9].textContent),
      prompt('結果3：', tds[10].textContent),
    ];
    const bodyObj = {
      twitchName,
      twitchID,
      osuID,
      rank,
      time,
      results,
      manualTickets: Number(manualTickets) || 0
    };
    try {
      const res = await fetch('https://your-api-host.com/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ username: 'HitomiCyan0820', password: 'Card1130756' })
})
      const resp = await res.json();
      if (!res.ok) return alert(resp.message || '更新失敗');
      alert('更新成功');
      loadRegistrations();
    } catch (err) {
      alert('伺服器錯誤');
    }
  } else if (type === 'nc') {
    data = [...document.querySelectorAll('#tbl-nonchallengers tbody tr')]
      .find(tr => tr.querySelector('.btn-update')?.dataset.id === id);
    if (!data) return alert('找不到資料');
    const tds = data.querySelectorAll('td');
    const twitchName = prompt('Twitch 中文名稱：', tds[2].textContent);
    const twitchID   = prompt('Twitch ID：', tds[3].textContent);
    const manualTickets = prompt('手動抽獎券：', tds[4].textContent);
    const note       = prompt('備註：', tds[6].textContent);
    const bodyObj = {
      twitchName,
      twitchID,
      manualTickets: Number(manualTickets) || 0,
      note,
    };
    try {
      const res = await fetch('https://your-api-host.com/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ username: 'HitomiCyan0820', password: 'Card1130756' })
})
      const resp = await res.json();
      if (!res.ok) return alert(resp.message || '更新失敗');
      alert('更新成功');
      loadNonChallengers();
    } catch (err) {
      alert('伺服器錯誤');
    }
  }
};

window.copyRow = function(btn) {
  const tr = btn.closest('tr');
  if (!tr) return;
  const data = [...tr.querySelectorAll('td:not(:last-child)')].map(td => td.textContent.trim()).join('\t');
  navigator.clipboard.writeText(data).then(() => {
    btn.textContent = '✅';
    setTimeout(() => { btn.textContent = '📋'; }, 900);
  });
};
window.deleteRow = async function(id, type) {
  if (currentRole !== 'full') { alert('只有 full 權限可刪除'); return; }
  if (!confirm('確定要刪除這筆資料？')) return;
  try {
    const res = await fetch(`${API_BASE}/api/registrations/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    const data = await res.json();
    if (!res.ok) { alert(data.message || '刪除失敗'); return; }
    alert('刪除成功');
    loadRegistrations();
  } catch (err) {
    alert('伺服器錯誤，請稍後再試');
  }
};
window.deleteNcRow = async function(id) {
  if (currentRole !== 'full') { alert('只有 full 權限可刪除'); return; }
  if (!confirm('確定要刪除這筆非挑戰者？')) return;
  try {
    const res = await fetch(`${API_BASE}/api/nonchallengers/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    const data = await res.json();
    if (!res.ok) { alert(data.message || '刪除失敗'); return; }
    alert('刪除成功');
    loadNonChallengers();
  } catch (err) {
    alert('伺服器錯誤');
  }
};

searchBox.addEventListener('input', () => {
  filterByTwitchID(searchBox.value.trim().toLowerCase());
});
function filterByTwitchID(keyword) {
  document.querySelectorAll('#tbl-registrations tbody tr').forEach(tr => {
    const cell = tr.querySelector('td:nth-child(4)');
    tr.style.display = (cell && cell.textContent.toLowerCase().includes(keyword)) ? '' : 'none';
  });
  document.querySelectorAll('#tbl-nonchallengers tbody tr').forEach(tr => {
    const cell = tr.querySelector('td:nth-child(4)');
    tr.style.display = (cell && cell.textContent.toLowerCase().includes(keyword)) ? '' : 'none';
  });
}