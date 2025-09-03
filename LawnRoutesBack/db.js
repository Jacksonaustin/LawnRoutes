const dovenv = require('dotenv');
const pg = require('pg');
const { connectionString } = require('pg/lib/defaults');

dovenv.config();

const pool = new pg.Pool({connectionString: process.env.DATABASE_URL});

export default pool;