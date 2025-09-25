import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const repoDataDir = path.join(process.cwd(), 'data');
const runtimeDataDir = process.env.VERCEL ? path.join('/tmp', 'data') : repoDataDir;
const PW_FILE = path.join(runtimeDataDir, 'generated_passwords.json');

function readPasswords(): Array<{ email: string; plainPassword: string; generatedAt: string }> {
  if (!fs.existsSync(PW_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(PW_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function writePasswords(list: Array<{ email: string; plainPassword: string; generatedAt: string }>) {
  fs.writeFileSync(PW_FILE, JSON.stringify(list, null, 2));
}

export async function GET() {
  try {
    const list = readPasswords();
    return NextResponse.json({ success: true, passwords: list });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to read passwords' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email) return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    const list = readPasswords().filter(p => p.email !== email);
    writePasswords(list);
    return NextResponse.json({ success: true, passwords: list });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to delete entry' }, { status: 500 });
  }
}


