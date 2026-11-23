const { query } = require('../src/config/db');

async function main() {
  const res = await query("UPDATE esp32_command_queue SET status = 'CANCELLED' WHERE status = 'PENDING'");
  console.log('Cancelled pending commands:', res.affectedRows);
  const cmds = await query('SELECT id, command_type, status, created_at FROM esp32_command_queue ORDER BY id DESC LIMIT 5');
  console.log('Recent commands:', cmds);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

