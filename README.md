# ToothMatch

## Environment

Copy `.env.example` to `.env` and set the required values.

```
PORT=3000
DATABASE_URL=postgres://USER:PASSWORD@HOST:PORT/DBNAME?sslmode=require
POSTGRES_URL=
```

## Scripts

- `npm run start` – start the server
- `npm run dev` – start the server with nodemon

## Notes (Neon Postgres)
- Use `DATABASE_URL` from Neon. Ensure it includes `sslmode=require` or set SSL in the Sequelize config (already handled in `services/db.js`).