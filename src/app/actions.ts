"use server";

import { Priority, Status } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

function readText(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readId(formData: FormData, key: string): number {
  return Number(formData.get(key));
}

function parsePriority(value: string): Priority {
  if (value === Priority.LOW || value === Priority.MEDIUM || value === Priority.HIGH) {
    return value;
  }
  return Priority.MEDIUM;
}

function parseStatus(value: string): Status {
  if (value === Status.TODO || value === Status.IN_PROGRESS || value === Status.DONE) {
    return value;
  }
  return Status.TODO;
}

function parseDate(value: string): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function refreshPaths(projectId?: number) {
  revalidatePath("/");
  if (projectId) {
    revalidatePath(`/projects/${projectId}`);
  }
}

export async function createProject(formData: FormData) {
  const name = readText(formData, "name");
  const description = readText(formData, "description");

  if (!name) return;

  await prisma.project.create({
    data: {
      name,
      description: description || null,
    },
  });

  refreshPaths();
}

export async function updateProject(formData: FormData) {
  const id = readId(formData, "id");
  const name = readText(formData, "name");
  const description = readText(formData, "description");

  if (!id || !name) return;

  await prisma.project.update({
    where: { id },
    data: {
      name,
      description: description || null,
    },
  });

  refreshPaths(id);
}

export async function deleteProject(formData: FormData) {
  const id = readId(formData, "id");
  if (!id) return;

  await prisma.project.delete({
    where: { id },
  });

  refreshPaths();
}

export async function createSubproject(formData: FormData) {
  const projectId = readId(formData, "projectId");
  const name = readText(formData, "name");
  const description = readText(formData, "description");

  if (!projectId || !name) return;

  await prisma.subproject.create({
    data: {
      projectId,
      name,
      description: description || null,
    },
  });

  refreshPaths(projectId);
}

export async function updateSubproject(formData: FormData) {
  const id = readId(formData, "id");
  const projectId = readId(formData, "projectId");
  const name = readText(formData, "name");
  const description = readText(formData, "description");

  if (!id || !projectId || !name) return;

  await prisma.subproject.update({
    where: { id },
    data: {
      name,
      description: description || null,
    },
  });

  refreshPaths(projectId);
}

export async function deleteSubproject(formData: FormData) {
  const id = readId(formData, "id");
  const projectId = readId(formData, "projectId");

  if (!id || !projectId) return;

  await prisma.subproject.delete({
    where: { id },
  });

  refreshPaths(projectId);
}

export async function createProjectTask(formData: FormData) {
  const projectId = readId(formData, "projectId");
  const title = readText(formData, "title");
  const description = readText(formData, "description");
  const deadline = parseDate(readText(formData, "deadline"));
  const priority = parsePriority(readText(formData, "priority"));
  const status = parseStatus(readText(formData, "status"));

  if (!projectId || !title) return;

  await prisma.task.create({
    data: {
      projectId,
      title,
      description: description || null,
      deadline,
      priority,
      status,
      completedAt: status === Status.DONE ? new Date() : null,
    },
  });

  refreshPaths(projectId);
}

export async function createSubprojectTask(formData: FormData) {
  const projectId = readId(formData, "projectId");
  const subprojectId = readId(formData, "subprojectId");
  const title = readText(formData, "title");
  const description = readText(formData, "description");
  const deadline = parseDate(readText(formData, "deadline"));
  const priority = parsePriority(readText(formData, "priority"));
  const status = parseStatus(readText(formData, "status"));

  if (!projectId || !subprojectId || !title) return;

  await prisma.task.create({
    data: {
      subprojectId,
      title,
      description: description || null,
      deadline,
      priority,
      status,
      completedAt: status === Status.DONE ? new Date() : null,
    },
  });

  refreshPaths(projectId);
}

export async function updateTask(formData: FormData) {
  const id = readId(formData, "id");
  const projectId = readId(formData, "projectId");
  const title = readText(formData, "title");
  const description = readText(formData, "description");
  const deadline = parseDate(readText(formData, "deadline"));
  const priority = parsePriority(readText(formData, "priority"));
  const status = parseStatus(readText(formData, "status"));

  if (!id || !projectId || !title) return;

  await prisma.task.update({
    where: { id },
    data: {
      title,
      description: description || null,
      deadline,
      priority,
      status,
      completedAt: status === Status.DONE ? new Date() : null,
    },
  });

  refreshPaths(projectId);
}

export async function toggleTaskDone(formData: FormData) {
  const id = readId(formData, "id");
  const projectId = readId(formData, "projectId");

  if (!id || !projectId) return;

  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) return;

  const isDone = task.status === Status.DONE;

  await prisma.task.update({
    where: { id },
    data: {
      status: isDone ? Status.TODO : Status.DONE,
      completedAt: isDone ? null : new Date(),
    },
  });

  refreshPaths(projectId);
}

export async function deleteTask(formData: FormData) {
  const id = readId(formData, "id");
  const projectId = readId(formData, "projectId");

  if (!id || !projectId) return;

  await prisma.task.delete({ where: { id } });

  refreshPaths(projectId);
}
