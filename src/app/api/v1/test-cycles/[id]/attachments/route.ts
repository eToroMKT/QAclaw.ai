import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { auth } from "@/lib/auth";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const hasApiKey = req.headers.get("authorization")?.startsWith("Bearer ");
  if (hasApiKey) {
    const { response } = await requireAuth(req);
    if (response) return response;
  } else {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const { id } = await params;
  const cycle = await prisma.testCycle.findUnique({ where: { id }, select: { id: true } });
  if (!cycle) {
    return NextResponse.json({ error: "Test cycle not found" }, { status: 404 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  const type = String(formData.get("type") || "file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }

  const fileName = sanitizeFileName(file.name || "attachment.csv");
  const mimeType = file.type || "application/octet-stream";
  const isCsv = mimeType === "text/csv" || fileName.toLowerCase().endsWith(".csv");

  if (!isCsv) {
    return NextResponse.json({ error: "Only CSV uploads are supported" }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  if (!bytes.length) {
    return NextResponse.json({ error: "Uploaded file is empty" }, { status: 400 });
  }

  const relativeDir = path.join("uploads", "cycle-attachments", id);
  const absoluteDir = path.join(process.cwd(), relativeDir);
  await mkdir(absoluteDir, { recursive: true });

  const storedFileName = `${Date.now()}-${fileName}`;
  const relativePath = path.join(relativeDir, storedFileName);
  const absolutePath = path.join(process.cwd(), relativePath);
  await writeFile(absolutePath, bytes);

  const attachment = await prisma.cycleAttachment.create({
    data: {
      cycleId: id,
      type,
      fileName,
      mimeType,
      filePath: absolutePath,
      fileSize: bytes.length,
    },
  });

  return NextResponse.json(attachment, { status: 201 });
}
