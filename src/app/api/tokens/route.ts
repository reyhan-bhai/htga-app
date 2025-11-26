import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const TOKENS_FILE = path.join(process.cwd(), "data", "tokens.json");

// Pastikan folder data ada
function ensureDataDir() {
  const dir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Baca semua tokens
function getTokens(): string[] {
  ensureDataDir();
  if (!fs.existsSync(TOKENS_FILE)) {
    return [];
  }
  const data = fs.readFileSync(TOKENS_FILE, "utf-8");
  return JSON.parse(data);
}

// Simpan tokens
function saveTokens(tokens: string[]) {
  ensureDataDir();
  fs.writeFileSync(TOKENS_FILE, JSON.stringify(tokens, null, 2));
}

// GET - Ambil semua tokens
export async function GET() {
  try {
    const tokens = getTokens();
    return NextResponse.json({ tokens, count: tokens.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Tambah token baru
export async function POST(request: Request) {
  try {
    const { token } = await request.json();
    if (!token) throw new Error("Token is required");

    const tokens = getTokens();

    // Cek jika token sudah ada
    if (!tokens.includes(token)) {
      tokens.push(token);
      saveTokens(tokens);
    }

    return NextResponse.json({
      message: "Token saved",
      totalTokens: tokens.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Hapus token
export async function DELETE(request: Request) {
  try {
    const { token } = await request.json();
    if (!token) throw new Error("Token is required");

    let tokens = getTokens();
    tokens = tokens.filter((t) => t !== token);
    saveTokens(tokens);

    return NextResponse.json({
      message: "Token removed",
      totalTokens: tokens.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
