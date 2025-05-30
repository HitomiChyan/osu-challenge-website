// hash.js
const bcrypt = require('bcrypt');
const fs = require('fs');
const cfg = require('./config/admins.json');

async function run() {
  for (let admin of cfg.admins) {
    const hash = await bcrypt.hash(admin.password, 10);
    admin.passwordHash = hash;
    delete admin.password;
  }
  fs.writeFileSync('config/admins.json', JSON.stringify(cfg, null, 2));
  console.log('已更新密碼雜湊值');
}
run();
