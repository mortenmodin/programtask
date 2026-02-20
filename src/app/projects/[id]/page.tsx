import Link from "next/link";
import { Priority, Status, type Task } from "@prisma/client";
import { notFound } from "next/navigation";
import {
  createSubproject,
  createProjectTask,
  createSubprojectTask,
  deleteSubproject,
  deleteTask,
  toggleTaskDone,
  updateSubproject,
  updateTask,
} from "@/app/actions";
import { prisma } from "@/lib/prisma";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    taskSort?: string;
    taskStatus?: string;
    taskHigh?: string;
  }>;
};

function dateValue(date: Date | null): string {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

function priorityRank(priority: Priority): number {
  if (priority === Priority.HIGH) return 3;
  if (priority === Priority.MEDIUM) return 2;
  return 1;
}

function isOverdue(task: Task): boolean {
  return task.deadline !== null && task.deadline < new Date() && task.status !== Status.DONE;
}

function applyTaskView(tasks: Task[], taskSort: string, taskStatus: string, taskHighOnly: boolean): Task[] {
  return tasks
    .filter((task) => {
      if (taskStatus !== "ALL" && task.status !== taskStatus) {
        return false;
      }

      if (taskHighOnly && task.priority !== Priority.HIGH) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (taskSort === "date_asc") {
        return a.createdAt.getTime() - b.createdAt.getTime();
      }

      if (taskSort === "deadline_asc") {
        return (a.deadline?.getTime() ?? Number.MAX_SAFE_INTEGER) - (b.deadline?.getTime() ?? Number.MAX_SAFE_INTEGER);
      }

      if (taskSort === "priority_high") {
        return priorityRank(b.priority) - priorityRank(a.priority);
      }

      if (taskSort === "priority_low") {
        return priorityRank(a.priority) - priorityRank(b.priority);
      }

      return b.createdAt.getTime() - a.createdAt.getTime();
    });
}

export default async function ProjectDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const view = await searchParams;

  const projectId = Number(id);
  if (!projectId) notFound();

  const taskSort = view.taskSort ?? "date_desc";
  const taskStatus = view.taskStatus ?? "ALL";
  const taskHighOnly = view.taskHigh === "true";

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      tasks: true,
      subprojects: {
        orderBy: { createdAt: "desc" },
        include: {
          tasks: true,
        },
      },
    },
  });

  if (!project) notFound();

  const visibleProjectTasks = applyTaskView(project.tasks, taskSort, taskStatus, taskHighOnly);

  return (
    <main>
      <p>
        <Link href="/">← Tilbage til projekter</Link>
      </p>

      <h1>{project.name}</h1>
      <p>{project.description || "Ingen beskrivelse."}</p>

      <section>
        <h2>Task-visning</h2>
        <form method="get" className="stack">
          <div className="grid3">
            <label>
              Sortér tasks
              <select name="taskSort" defaultValue={taskSort}>
                <option value="date_desc">Dato (nyeste først)</option>
                <option value="date_asc">Dato (ældste først)</option>
                <option value="deadline_asc">Deadline (tidligst først)</option>
                <option value="priority_high">Prioritet (høj først)</option>
                <option value="priority_low">Prioritet (lav først)</option>
              </select>
            </label>

            <label>
              Filtrér efter status
              <select name="taskStatus" defaultValue={taskStatus}>
                <option value="ALL">Alle</option>
                <option value="TODO">TODO</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="DONE">DONE</option>
              </select>
            </label>

            <label>
              Høj prioritet
              <select name="taskHigh" defaultValue={taskHighOnly ? "true" : "false"}>
                <option value="false">Alle prioriteringer</option>
                <option value="true">Kun HIGH</option>
              </select>
            </label>
          </div>

          <div className="actions">
            <button type="submit">Anvend</button>
            <Link href={`/projects/${project.id}`}>Nulstil</Link>
          </div>
        </form>
      </section>

      <section>
        <h2>Projekt-tasks</h2>

        <form action={createProjectTask} className="stack">
          <input type="hidden" name="projectId" value={project.id} />

          <label>
            Titel
            <input name="title" required />
          </label>

          <label>
            Beskrivelse
            <textarea name="description" rows={2} />
          </label>

          <div className="grid3">
            <label>
              Deadline
              <input type="date" name="deadline" />
            </label>

            <label>
              Prioritet
              <select name="priority" defaultValue="MEDIUM">
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
              </select>
            </label>

            <label>
              Status
              <select name="status" defaultValue="TODO">
                <option value="TODO">TODO</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="DONE">DONE</option>
              </select>
            </label>
          </div>

          <button type="submit">Opret task</button>
        </form>

        {visibleProjectTasks.length === 0 ? <p>Ingen projekt-tasks matcher filteret.</p> : null}

        {visibleProjectTasks.map((task) => (
          <article key={task.id} className="taskCard">
            <form action={updateTask} className="stack">
              <input type="hidden" name="id" value={task.id} />
              <input type="hidden" name="projectId" value={project.id} />

              <label>
                Titel
                <input name="title" defaultValue={task.title} required />
              </label>

              <label>
                Beskrivelse
                <textarea name="description" rows={2} defaultValue={task.description ?? ""} />
              </label>

              <div className="grid3">
                <label>
                  Deadline
                  <input type="date" name="deadline" defaultValue={dateValue(task.deadline)} />
                </label>

                <label>
                  Prioritet
                  <select name="priority" defaultValue={task.priority}>
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                  </select>
                </label>

                <label>
                  Status
                  <select name="status" defaultValue={task.status}>
                    <option value="TODO">TODO</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="DONE">DONE</option>
                  </select>
                </label>
              </div>

              <p className="meta">
                Deadline: {task.deadline ? new Intl.DateTimeFormat("da-DK").format(task.deadline) : "-"} | Færdig: {task.completedAt ? new Intl.DateTimeFormat("da-DK").format(task.completedAt) : "Nej"}
              </p>

              {isOverdue(task) ? <p className="overdue">⚠ Overskredet deadline</p> : null}

              <div className="actions">
                <button type="submit">Gem task</button>
              </div>
            </form>

            <div className="actions">
              <form action={toggleTaskDone}>
                <input type="hidden" name="id" value={task.id} />
                <input type="hidden" name="projectId" value={project.id} />
                <button type="submit">{task.status === "DONE" ? "Markér som ikke færdig" : "Markér som færdig"}</button>
              </form>

              <form action={deleteTask}>
                <input type="hidden" name="id" value={task.id} />
                <input type="hidden" name="projectId" value={project.id} />
                <button type="submit" className="danger">
                  Slet task
                </button>
              </form>
            </div>
          </article>
        ))}
      </section>

      <section>
        <h2>Opret underprojekt</h2>
        <form action={createSubproject} className="stack">
          <input type="hidden" name="projectId" value={project.id} />

          <label>
            Navn
            <input name="name" required />
          </label>

          <label>
            Beskrivelse
            <textarea name="description" rows={2} />
          </label>

          <button type="submit">Opret underprojekt</button>
        </form>
      </section>

      <section>
        <h2>Underprojekter</h2>
        {project.subprojects.length === 0 ? <p>Ingen underprojekter endnu.</p> : null}

        {project.subprojects.map((subproject) => {
          const visibleSubTasks = applyTaskView(subproject.tasks, taskSort, taskStatus, taskHighOnly);

          return (
            <article key={subproject.id} className="projectCard">
              <form action={updateSubproject} className="stack">
                <input type="hidden" name="id" value={subproject.id} />
                <input type="hidden" name="projectId" value={project.id} />

                <label>
                  Navn
                  <input name="name" defaultValue={subproject.name} required />
                </label>

                <label>
                  Beskrivelse
                  <textarea name="description" rows={2} defaultValue={subproject.description ?? ""} />
                </label>

                <button type="submit">Gem underprojekt</button>
              </form>

              <form action={deleteSubproject}>
                <input type="hidden" name="id" value={subproject.id} />
                <input type="hidden" name="projectId" value={project.id} />
                <button type="submit" className="danger">
                  Slet underprojekt
                </button>
              </form>

              <div className="subTaskBlock">
                <h3>Tasks for {subproject.name}</h3>

                <form action={createSubprojectTask} className="stack">
                  <input type="hidden" name="projectId" value={project.id} />
                  <input type="hidden" name="subprojectId" value={subproject.id} />

                  <label>
                    Titel
                    <input name="title" required />
                  </label>

                  <label>
                    Beskrivelse
                    <textarea name="description" rows={2} />
                  </label>

                  <div className="grid3">
                    <label>
                      Deadline
                      <input type="date" name="deadline" />
                    </label>

                    <label>
                      Prioritet
                      <select name="priority" defaultValue="MEDIUM">
                        <option value="LOW">LOW</option>
                        <option value="MEDIUM">MEDIUM</option>
                        <option value="HIGH">HIGH</option>
                      </select>
                    </label>

                    <label>
                      Status
                      <select name="status" defaultValue="TODO">
                        <option value="TODO">TODO</option>
                        <option value="IN_PROGRESS">IN_PROGRESS</option>
                        <option value="DONE">DONE</option>
                      </select>
                    </label>
                  </div>

                  <button type="submit">Opret task</button>
                </form>

                {visibleSubTasks.length === 0 ? <p>Ingen tasks matcher filteret.</p> : null}

                {visibleSubTasks.map((task) => (
                  <article key={task.id} className="taskCard">
                    <form action={updateTask} className="stack">
                      <input type="hidden" name="id" value={task.id} />
                      <input type="hidden" name="projectId" value={project.id} />

                      <label>
                        Titel
                        <input name="title" defaultValue={task.title} required />
                      </label>

                      <label>
                        Beskrivelse
                        <textarea name="description" rows={2} defaultValue={task.description ?? ""} />
                      </label>

                      <div className="grid3">
                        <label>
                          Deadline
                          <input type="date" name="deadline" defaultValue={dateValue(task.deadline)} />
                        </label>

                        <label>
                          Prioritet
                          <select name="priority" defaultValue={task.priority}>
                            <option value="LOW">LOW</option>
                            <option value="MEDIUM">MEDIUM</option>
                            <option value="HIGH">HIGH</option>
                          </select>
                        </label>

                        <label>
                          Status
                          <select name="status" defaultValue={task.status}>
                            <option value="TODO">TODO</option>
                            <option value="IN_PROGRESS">IN_PROGRESS</option>
                            <option value="DONE">DONE</option>
                          </select>
                        </label>
                      </div>

                      <p className="meta">
                        Deadline: {task.deadline ? new Intl.DateTimeFormat("da-DK").format(task.deadline) : "-"} | Færdig: {task.completedAt ? new Intl.DateTimeFormat("da-DK").format(task.completedAt) : "Nej"}
                      </p>

                      {isOverdue(task) ? <p className="overdue">⚠ Overskredet deadline</p> : null}

                      <button type="submit">Gem task</button>
                    </form>

                    <div className="actions">
                      <form action={toggleTaskDone}>
                        <input type="hidden" name="id" value={task.id} />
                        <input type="hidden" name="projectId" value={project.id} />
                        <button type="submit">
                          {task.status === "DONE" ? "Markér som ikke færdig" : "Markér som færdig"}
                        </button>
                      </form>

                      <form action={deleteTask}>
                        <input type="hidden" name="id" value={task.id} />
                        <input type="hidden" name="projectId" value={project.id} />
                        <button type="submit" className="danger">
                          Slet task
                        </button>
                      </form>
                    </div>
                  </article>
                ))}
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
