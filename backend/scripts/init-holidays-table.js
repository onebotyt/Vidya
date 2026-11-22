const { query } = require('../src/config/db');

async function init() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS register_holidays (
        id INT AUTO_INCREMENT PRIMARY KEY,
        register_id INT NULL,
        holiday_date DATE NOT NULL,
        holiday_name VARCHAR(150) NULL,
        is_working_day TINYINT(1) NOT NULL DEFAULT 0,
        created_by INT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_reg_date (register_id, holiday_date)
      )
    `);
    const desc = await query('DESCRIBE register_holidays');
    console.log('register_holidays initialized:', desc.map(c => c.Field));
    process.exit(0);
  } catch (err) {
    console.error('Failed to init register_holidays:', err);
    process.exit(1);
  }
}

init();
