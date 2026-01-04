import { Sequelize } from 'sequelize';

const { DATABASE_URL, PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD } =
  process.env;

let sequelize;

// Prefer full URL if provided (Neon supplies this)
const url = DATABASE_URL;
if (url) {
  sequelize = new Sequelize(url, {
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: {
      ssl: { require: true, rejectUnauthorized: false },
    },
    logging: false,
  });
} else if (PGHOST) {
  // Build from discrete env vars (PG*)
  if (!PGDATABASE || !PGUSER) {
    console.error(
      'PGDATABASE and PGUSER must be set when using discrete PG env vars.'
    );
  } else {
    sequelize = new Sequelize(PGDATABASE, PGUSER, PGPASSWORD || '', {
      host: PGHOST,
      port: Number(PGPORT) || 5432,
      dialect: 'postgres',
      protocol: 'postgres',
      logging: console.log,
    });
  }
} else {
  console.warn(
    'No Postgres configuration found. Set DATABASE_URL (recommended) or PG* env vars.'
  );
}

export { sequelize };

export async function connectToDatabase() {
  if (!sequelize) {
    console.warn(
      'Skipping DB connection because no database URL is configured.'
    );
    return null;
  }
  try {
    await sequelize.authenticate();
    console.log('Sequelize: Connection has been established successfully.');
    // Import and sync all models
    await import('../models/index.js');
    await sequelize.sync({ alter: true });
    console.log('Database tables synced successfully.');
    return sequelize;
  } catch (error) {
    console.error('Unable to connect to the database:', error.message);
    throw error;
  }
}
