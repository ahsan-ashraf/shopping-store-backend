import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  engine: 'classic', // or "binary"
  datasource: {
    url: env('DATABASE_URL'), // this is correct in Prisma 7+
  },
});
