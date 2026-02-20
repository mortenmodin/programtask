# Next.js + Prisma + SQLite eksempel

Dette projekt er sat op med:

- Next.js (App Router) i TypeScript
- Prisma ORM
- SQLite database
- Datamodel: `Project`, `Subproject`, `Task`
- Enums: `Priority`, `Status`
- Seed-data med eksempler
- Simpel projektside med CRUD via **Server Actions**
- Projektdetaljeside med CRUD for underprojekter
- Tasks (to-do) på både projekt og underprojekt med deadline/prioritet/status + markér som færdig
- Sortering og filtrering på projekter og tasks (dato/prioritet/status/høj prioritet)
- Visning af overskredne deadlines

## Kom i gang

```bash
npm install
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run prisma:seed
npm run dev
```

Åbn derefter `http://localhost:3000`.
