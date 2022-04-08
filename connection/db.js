const { Pool } = require('pg')  // Import pg pool

const dbPool = new Pool({
    database: 'personal_web',
    port: 5432,
    user: 'postgres',
    password: 'Admin'
})

module.exports = dbPool