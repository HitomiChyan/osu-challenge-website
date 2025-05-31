// admin.js

// DOM 元素
const loginForm    = document.getElementById('login-form');
const dashboard    = document.getElementById('dashboard');
const formLogin    = document.getElementById('form-login');
const loginMsg     = document.getElementById('login-msg');
const dashMsg      = document.getElementById('dash-msg');
const tblBody      = document.querySelector('#tbl-registrations tbody');
const btnLogout    = document.getElementById('btn-logout');

// 一開始先判斷：如果還沒登入，就顯示登入表單
window.addEventListener('DOMContentLoaded', () => {
  showLogin();
});

// 顯示登入畫面
function showLogin() {
  loginForm.style.display = 'block';
  dashboard.style.display = 'none';
}

// 顯示後台畫面
function showDashboard() {
  loginForm.style.display = 'none';
  dashboard.style.display = 'block';
  loginMsg.textContent = ''; // 清空任何登入錯誤訊息
  loadRegistrations();      // 立刻載入報名資料
}

// 登入表單送出事件
formLogin.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginMsg.textContent = '';
  
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  if (!username || !password) {
    loginMsg.textContent = '請輸入帳號與密碼';
    return;
  }

  try {
    const resp = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await resp.json();
    if (!resp.ok) {
      loginMsg.textContent = data.message || '登入失敗';
      return;
    }
    // 登入成功，切換到 dashboard 顯示
    showDashboard();
  } catch (err) {
    console.error(err);
    loginMsg.textContent = '伺服器錯誤，請稍後再試';
  }
});

// 登出事件
btnLogout.addEventListener('click', async () => {
  try {
    await fetch('/api/admin/logout', { method: 'POST' });
  } catch (e) {
    console.error(e);
  } finally {
    // 不管 logout 成功與否，都跳回登入畫面
    showLogin();
  }
});

// 載入所有報名資料，並把它顯示在 <table> 裡
async function loadRegistrations() {
  dashMsg.textContent = '';
  tblBody.innerHTML = ''; // 先清空表格
  try {
    const resp = await fetch('/api/registrations', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (resp.status === 401) {
      // 如果 401 (未登入)，強制跳回登入畫面
      showLogin();
      return;
    }
    const list = await resp.json();
    // 假設 list 是一個陣列，元素長得像 { _id, name, score }
    for (const item of list) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${item._id}</td>
        <td>${item.name}</td>
        <td>${item.score !== undefined ? item.score : ''}</td>
        <td>
          <button class="btn-update" data-id="${item._id}">更新分數</button>
          <button class="btn-delete" data-id="${item._id}">刪除</button>
        </td>
      `;
      tblBody.appendChild(tr);
    }
    bindTableButtons();
  } catch (err) {
    console.error(err);
    dashMsg.textContent = '讀取報名資料失敗';
  }
}

// 綁定每一列的「更新分數」與「刪除」按鈕事件
function bindTableButtons() {
  // 更新分數按鈕
  document.querySelectorAll('.btn-update').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const newScore = prompt('請輸入新的分數：');
      if (newScore === null) return; // 點「取消」就不做
      const num = Number(newScore);
      if (isNaN(num)) {
        alert('分數必須是數字');
        return;
      }
      try {
        const resp = await fetch(`/api/registrations/${id}/score`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ score: num }),
        });
        const data = await resp.json();
        if (!resp.ok) {
          alert(data.message || '更新失敗');
          return;
        }
        alert(data.message);
        loadRegistrations(); // 重新載入列表
      } catch (err) {
        console.error(err);
        alert('伺服器錯誤，請稍後再試');
      }
    });
  });

  // 刪除按鈕
  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      if (!confirm('確定要刪除嗎？')) return;
      try {
        const resp = await fetch(`/api/registrations/${id}`, {
          method: 'DELETE',
        });
        const data = await resp.json();
        if (!resp.ok) {
          alert(data.message || '刪除失敗');
          return;
        }
        alert(data.message);
        loadRegistrations(); // 重新載入列表
      } catch (err) {
        console.error(err);
        alert('伺服器錯誤，請稍後再試');
      }
    });
  });
}
