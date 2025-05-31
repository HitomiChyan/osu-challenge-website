// public/admin.js

// 全域變數：登入後會存放 role ('full' or 'limited')
let currentRole = null;

// 先拿到幾個 DOM 元素
const loginSection     = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');
const logoutSection    = document.getElementById('logout-section');
const loginError       = document.getElementById('login-error');
const tblBody          = document.querySelector('#tbl-scores tbody');

// 新增參賽者的區塊
const addSection = document.getElementById('add-section');
const addError   = document.getElementById('add-error');
const btnAdd     = document.getElementById('btn-add');
const inputNewUsername = document.getElementById('new-username');
const inputNewScore    = document.getElementById('new-score');
const inputNewDate     = document.getElementById('new-date');

const API_BASE = 'http://localhost:3000'; // 後端網址

// 頁面載入完後，顯示登入畫面
window.addEventListener('DOMContentLoaded', () => {
  showLogin();
});

function showLogin() {
  loginSection.classList.remove('hidden');
  dashboardSection.classList.add('hidden');
  logoutSection.classList.add('hidden');
  addSection.classList.add('hidden');
}

function showDashboard() {
  loginSection.classList.add('hidden');
  dashboardSection.classList.remove('hidden');
  logoutSection.classList.remove('hidden');

  // 如果登入者是 full，就顯示「新增參賽者」區塊
  if (currentRole === 'full') {
    addSection.classList.remove('hidden');
  } else {
    addSection.classList.add('hidden');
  }

  loadScores(); // 載入列表
}

// 1. 登入
document.getElementById('btn-login').addEventListener('click', async () => {
  loginError.textContent = '';
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  if (!username || !password) {
    loginError.textContent = '請填寫帳號與密碼';
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // 帶上 cookie 以建立 session
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) {
      loginError.textContent = data.message || '登入失敗';
      return;
    }
    // 取得後端回傳的 role，存到 currentRole
    currentRole = data.role;

    // 切到後台介面
    showDashboard();
  } catch (err) {
    loginError.textContent = '網路錯誤，請稍後再試';
  }
});

// 2. 登出
document.getElementById('btn-logout').addEventListener('click', async () => {
  await fetch(`${API_BASE}/api/admin/logout`, {
    method: 'POST',
    credentials: 'include'
  });
  currentRole = null; // 清掉 role
  showLogin();
});

// 3. 新增參賽者（只有 full 權限）
btnAdd.addEventListener('click', async () => {
  addError.textContent = '';
  const newUser = inputNewUsername.value.trim();
  const newScore = inputNewScore.value.trim();
  const newDate  = inputNewDate.value; // HTML5 date 格式是 yyyy-MM-dd

  if (!newUser || newScore === '' || !newDate) {
    addError.textContent = '請填寫所有欄位';
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/scores`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: newUser,
        score: Number(newScore),
        date: newDate
      })
    });
    const data = await res.json();
    if (!res.ok) {
      addError.textContent = data.message || '新增失敗';
      return;
    }
    alert('新增成功');
    // 新增後清空欄位並重新載入列表
    inputNewUsername.value = '';
    inputNewScore.value    = '';
    inputNewDate.value     = '';
    loadScores();
  } catch (err) {
    addError.textContent = '伺服器錯誤，請稍後再試';
  }
});

// 4. 載入並顯示參賽者（scores）列表
async function loadScores() {
  tblBody.innerHTML = ''; // 清空表格
  try {
    const res = await fetch(`${API_BASE}/api/scores`, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    if (res.status === 401) {
      // Session 過期或未登入，回到登入畫面
      showLogin();
      return;
    }
    const list = await res.json();
    list.forEach(item => {
      const tr = document.createElement('tr');

      // 如果是 full，username 做成 <input>；否則純文字
      let usernameCell;
      if (currentRole === 'full') {
        usernameCell = `<input type="text" value="${item.username}" id="user-${item._id}" />`;
      } else {
        usernameCell = `${item.username}`;
      }

      tr.innerHTML = `
        <td>${item._id}</td>
        <td>${usernameCell}</td>
        <td>
          <input type="number" value="${item.score ?? ''}" id="score-${item._id}" />
        </td>
        <td>
          <button data-id="${item._id}" class="btn-update">更新</button>
        </td>
        <td>
          <button data-id="${item._id}" class="btn-delete">刪除</button>
        </td>
      `;
      tblBody.appendChild(tr);
    });

    // 綁定更新按鈕
    document.querySelectorAll('.btn-update').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const scoreInput = document.getElementById(`score-${id}`);
        const newScore   = scoreInput.value.trim();
        if (newScore === '') {
          alert('請輸入分數');
          return;
        }
        const bodyObj = { score: Number(newScore) };

        // 只有 full 權限才會將 username 加入更新物件
        if (currentRole === 'full') {
          const userInput = document.getElementById(`user-${id}`);
          bodyObj.username = userInput.value.trim();
          if (!bodyObj.username) {
            alert('請輸入使用者名稱');
            return;
          }
        }

        try {
          const updRes = await fetch(`${API_BASE}/api/scores/${id}/score`, {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyObj)
          });
          const data = await updRes.json();
          if (!updRes.ok) {
            alert(data.message || '更新失敗');
            return;
          }
          alert('已更新');
          loadScores(); // 重新載入
        } catch (err) {
          alert('伺服器錯誤，請稍後再試');
        }
      });
    });

    // 綁定刪除按鈕（僅 full 權限可刪除）
    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('確定要刪除此參賽者？')) return;
        const id = btn.dataset.id;
        try {
          const delRes = await fetch(`${API_BASE}/api/scores/${id}`, {
            method: 'DELETE',
            credentials: 'include'
          });
          const data = await delRes.json();
          if (!delRes.ok) {
            alert(data.message || '刪除失敗');
            return;
          }
          alert('已刪除');
          loadScores();
        } catch (err) {
          alert('伺服器錯誤，請稍後再試');
        }
      });
    });

  } catch (err) {
    alert('網路連線錯誤');
  }
}
