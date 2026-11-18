import { NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/auth';
import {
  canAccessMaterialDiscussion,
  createDiscussionPost,
  listMaterialDiscussionsTree,
} from '@/lib/queries/discussions';
import { parsePositiveInt } from '@/lib/validators';

export async function GET(_request, context) {
  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    const { id } = await context.params;
    const materialId = parsePositiveInt(id);
    if (!materialId) {
      return NextResponse.json({ success: false, error: 'ID materi tidak valid.' }, { status: 400 });
    }

    const access = await canAccessMaterialDiscussion(materialId, user);
    if (!access.exists) {
      return NextResponse.json({ success: false, error: 'Materi tidak ditemukan.' }, { status: 404 });
    }
    if (!access.allowed) {
      return NextResponse.json(
        { success: false, error: 'Anda harus terdaftar di course ini untuk melihat diskusi.' },
        { status: 403 }
      );
    }

    const discussions = await listMaterialDiscussionsTree(materialId);
    return NextResponse.json({ success: true, data: { discussions } }, { status: 200 });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Gagal memuat forum diskusi.' },
      { status: 500 }
    );
  }
}

export async function POST(request, context) {
  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    const { id } = await context.params;
    const materialId = parsePositiveInt(id);
    if (!materialId) {
      return NextResponse.json({ success: false, error: 'ID materi tidak valid.' }, { status: 400 });
    }

    const access = await canAccessMaterialDiscussion(materialId, user);
    if (!access.exists) {
      return NextResponse.json({ success: false, error: 'Materi tidak ditemukan.' }, { status: 404 });
    }
    if (!access.allowed) {
      return NextResponse.json(
        { success: false, error: 'Anda tidak memiliki izin berdiskusi di materi ini.' },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => null);
    const content = String(body?.content || '').trim();
    const parentId = body?.parent_id ? parsePositiveInt(body.parent_id) : null;

    if (content.length < 3 || content.length > 2000) {
      return NextResponse.json(
        {
          success: false,
          error: 'Isi pesan harus antara 3 sampai 2000 karakter.',
          fieldErrors: { content: 'Isi pesan minimal 3 karakter.' },
        },
        { status: 400 }
      );
    }

    if (body?.parent_id && !parentId) {
      return NextResponse.json(
        { success: false, error: 'Parent diskusi tidak valid.' },
        { status: 400 }
      );
    }

    const post = await createDiscussionPost({
      materialId,
      userId: user.id,
      parentId,
      content,
    });

    return NextResponse.json(
      {
        success: true,
        data: { post },
        message: parentId ? 'Balasan berhasil dikirim.' : 'Pertanyaan berhasil dikirim.',
      },
      { status: 201 }
    );
  } catch (err) {
    if (err.code === 'PARENT_NOT_FOUND') {
      return NextResponse.json(
        { success: false, error: 'Pertanyaan induk tidak ditemukan pada materi ini.' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Gagal mengirim pesan diskusi.' },
      { status: 500 }
    );
  }
}
