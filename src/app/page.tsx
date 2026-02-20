import Link from "next/link";
import { Priority, Status, type Task } from "@prisma/client";
import { createProject, deleteProject, updateProject } from "./actions";
import { prisma } from "@/lib/prisma";

type SearchParams = Promise<{
  projectSort?: string;
  projectStatus?: string;
  projectHigh?: string;
}>;

type ProjectWithTasks = {
  id: number;
  name: string;
  description: string | null;
  createdAt: Date;
  _count: { subprojects: number };
  tasks: Task[];
  subprojects: { tasks: Task[] }[];
};

function priorityRank(priority: Priority): number {
  if (priority === Priority.HIGH) return 3;
  if (priority === Priority.MEDIUM) return 2;
  return 1;
}

function allProjectTasks(project: ProjectWithTasks): Task[] {
  return [...project.tasks, ...project.subprojects.flatMap((subproject) => subproject.tasks)];
}

function highestProjectPriority(project: ProjectWithTasks): Priority | null {
  const priorities = allProjectTasks(project).map((task) => task.priority);
  if (priorities.includes(Priority.HIGH)) return Priority.HIGH;
  if (priorities.includes(Priority.MEDIUM)) return Priority.MEDIUM;
  if (priorities.includes(Priority.LOW)) return Priority.LOW;
  return null;
}

function isOverdue(task: Task): boolean {
  return task.deadline !== null && task.deadline < new Date() && task.status !== Status.DONE;
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const projectSort = params.projectSort ?? "date_desc";
  const projectStatus = params.projectStatus ?? "ALL";
  const projectHighOnly = params.projectHigh === "true";

  const projects = await prisma.project.findMany({
    include: {
      _count: {
        select: { subprojects: true },
      },
      tasks: true,
      subprojects: {
        include: {
          tasks: true,
        },
      },
    },
  });

  const filteredProjects = projects
    .filter((project) => {
      const tasks = allProjectTasks(project);

      if (projectStatus !== "ALL") {
        const hasStatus = tasks.some((task) => task.status === projectStatus);
        if (!hasStatus) return false;
      }

      if (projectHighOnly) {
        const hasHigh = tasks.some((task) => task.priority === Priority.HIGH);
        if (!hasHigh) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (projectSort === "date_asc") {
        return a.createdAt.getTime() - b.createdAt.getTime();
      }

      if (projectSort === "priority_high") {
        return priorityRank(highestProjectPriority(b) ?? Priority.LOW) - priorityRank(highestProjectPriority(a) ?? Priority.LOW);
      }

      if (projectSort === "priority_low") {
        return priorityRank(highestProjectPriority(a) ?? Priority.LOW) - priorityRank(highestProjectPriority(b) ?? Priority.LOW);
      }

      return b.createdAt.getTime() - a.createdAt.getTime();
    });

  return (
    <main>
      <h1>Projekter</h1>

      <section>
        <h2>Sortering og filtrering</h2>
        <form className="stack" method="get">
          <div className="grid3">
            <label>
              Sortér projekter
              <select name="projectSort" defaultValue={projectSort}>
                <option value="date_desc">Dato (nyeste først)</option>
                <option value="date_asc">Dato (ældste først)</option>
                <option value="priority_high">Prioritet (høj først)</option>
                <option value="priority_low">Prioritet (lav først)</option>
              </select>
            </label>

            <label>
              Filtrér efter status
              <select name="projectStatus" defaultValue={projectStatus}>
                <option value="ALL">Alle</option>
                <option value="TODO">TODO</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="DONE">DONE</option>
              </select>
            </label>

            <label>
              Høj prioritet
              <select name="projectHigh" defaultValue={projectHighOnly ? "true" : "false"}>
                <option value="false">Alle prioriteringer</option>
                <option value="true">Kun med HIGH tasks</option>
              </select>
            </label>
          </div>

          <div className="actions">
            <button type="submit">Anvend</button>
            <Link href="/">Nulstil</Link>
          </div>
        </form>
      </section>

      <section>
        <h2>Opret nyt projekt</h2>
        <form action={createProject} className="stack">
          <label>
            Navn
            <input name="name" required />
          </label>

          <label>
            Beskrivelse
            <textarea name="description" rows={3} />
          </label>

          <button type="submit">Opret projekt</button>
        </form>
      </section>

      <section>
        <h2>Projektliste</h2>
        {filteredProjects.length === 0 ? <p>Ingen projekter matcher filteret.</p> : null}

        {filteredProjects.map((project) => {
          const tasks = allProjectTasks(project);
          const overdueCount = tasks.filter(isOverdue).length;
          const highestPriority = highestProjectPriority(project);

          return (
            <article key={project.id} className="projectCard">
              <div className="spaceBetween">
                <p className="meta">
                  Underprojekter: {project._count.subprojects} · Tasks: {tasks.length}
                </p>
                <Link href={`/projects/${project.id}`}>Gå til detaljeside</Link>
              </div>

              <p className="meta">
                Højeste task-prioritet: {highestPriority ?? "-"} · Overskredne deadlines: {overdueCount}
              </p>

              <form action={updateProject} className="stack">
                <input type="hidden" name="id" value={project.id} />

                <label>
                  Navn
                  <input name="name" defaultValue={project.name} required />
                </label>

                <label>
                  Beskrivelse
                  <textarea name="description" rows={3} defaultValue={project.description ?? ""} />
                </label>

                <div className="actions">
                  <button type="submit">Gem ændringer</button>
                </div>
              </form>

              <form action={deleteProject}>
                <input type="hidden" name="id" value={project.id} />
                <button type="submit" className="danger">
                  Slet projekt
                </button>
              </form>
            </article>
          );
        })}
      </section>
    </main>
  );
}
