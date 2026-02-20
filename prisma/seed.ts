import { PrismaClient, Priority, Status } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.task.deleteMany();
  await prisma.subproject.deleteMany();
  await prisma.project.deleteMany();

  await prisma.project.create({
    data: {
      name: "Website relancering",
      description: "Nyt design og bedre performance.",
      tasks: {
        create: [
          {
            title: "Afklar scope med stakeholders",
            priority: Priority.HIGH,
            status: Status.DONE,
            deadline: new Date("2026-03-01"),
            completedAt: new Date("2026-02-25"),
          },
          {
            title: "Planlæg release-vindue",
            priority: Priority.MEDIUM,
            status: Status.IN_PROGRESS,
            deadline: new Date("2026-03-10"),
          },
        ],
      },
      subprojects: {
        create: [
          {
            name: "Frontend",
            description: "Opdatering af UI og komponenter.",
            tasks: {
              create: [
                {
                  title: "Byg ny hero-sektion",
                  priority: Priority.HIGH,
                  status: Status.IN_PROGRESS,
                  deadline: new Date("2026-03-04"),
                },
                {
                  title: "Tilføj dark mode",
                  priority: Priority.MEDIUM,
                  status: Status.TODO,
                  deadline: new Date("2026-03-12"),
                },
              ],
            },
          },
          {
            name: "Backend",
            description: "Optimer API-kald og caching.",
            tasks: {
              create: [
                {
                  title: "Implementer redis-cache",
                  priority: Priority.HIGH,
                  status: Status.TODO,
                  deadline: new Date("2026-03-08"),
                },
              ],
            },
          },
        ],
      },
    },
  });

  await prisma.project.create({
    data: {
      name: "Mobil app",
      description: "Første MVP-version til iOS og Android.",
      tasks: {
        create: [
          {
            title: "Forbered beta-test",
            priority: Priority.MEDIUM,
            status: Status.TODO,
            deadline: new Date("2026-04-05"),
          },
        ],
      },
      subprojects: {
        create: [
          {
            name: "Autentifikation",
            tasks: {
              create: [
                {
                  title: "Login med e-mail",
                  priority: Priority.MEDIUM,
                  status: Status.DONE,
                  deadline: new Date("2026-02-20"),
                  completedAt: new Date("2026-02-18"),
                },
                {
                  title: "Glemt kodeord-flow",
                  priority: Priority.LOW,
                  status: Status.IN_PROGRESS,
                  deadline: new Date("2026-03-02"),
                },
              ],
            },
          },
        ],
      },
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
