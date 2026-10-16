import { NextRequest, NextResponse } from 'next/server';
import { ALL_APPLICATION_ROLES, type ApplicationRole } from '@/lib/types/membership';
import { getRoleDefinition } from '@/lib/applications/role-definitions';
import { uploadApplicationDocument } from '@/lib/applications/document-storage';
import { validateApplicationDocUpload } from '@/lib/applications/document-validation';
import { getMongoDb } from '@/lib/db/mongodb';
import { REGISTRATION_LINKS_COLLECTION, isLinkAcceptingApplications } from '@/lib/registration-links';
import { issueCsrfToken } from '@/lib/security/csrf-handler';
import { enforcePublicFormGuards } from '@/lib/security/public-form';

export async function GET(request: NextRequest) {
  return issueCsrfToken(request);
}

export async function POST(request: NextRequest, { params }: { params: { slug: string } }) {
  const blocked = await enforcePublicFormGuards(request, {
    routeKey: 'applications',
    rateLimitPrefix: 'join-documents',
    maxRequests: 10,
    windowSeconds: 15 * 60,
  });
  if (blocked) return blocked;

  try {
    const db = await getMongoDb();
    const link = await db.collection(REGISTRATION_LINKS_COLLECTION).findOne({ slug: params.slug });
    if (!link) return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    if (!isLinkAcceptingApplications(link)) {
      return NextResponse.json({ error: 'This application period has closed.' }, { status: 403 });
    }

    const form = await request.formData();
    const file = form.get('file');
    const role = String(form.get('role') || '');
    const docKey = String(form.get('docKey') || '');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'File is required.' }, { status: 400 });
    }
    if (!ALL_APPLICATION_ROLES.includes(role as ApplicationRole)) {
      return NextResponse.json({ error: 'Invalid role.' }, { status: 400 });
    }
    if (!link.roles.includes(role)) {
      return NextResponse.json({ error: 'This role is not accepted through this link.' }, { status: 400 });
    }

    const def = getRoleDefinition(role as ApplicationRole);
    const docDef = def.documents.find((d) => d.key === docKey);
    if (!docDef) {
      return NextResponse.json({ error: 'Unknown document type for this role.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const validation = validateApplicationDocUpload(
      file.type || 'application/octet-stream',
      buffer.length,
      file.name,
      new Uint8Array(buffer)
    );
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const id = await uploadApplicationDocument(buffer, file.name || `${docKey}.bin`, validation.mime, {
      slug: params.slug,
      role,
      docKey,
      temporary: true,
    });

    return NextResponse.json({
      success: true,
      id,
      docKey,
      filename: file.name,
      contentType: validation.mime,
      size: buffer.length,
    });
  } catch (error) {
    console.error('Application document upload error:', error);
    return NextResponse.json({ error: 'Unable to upload document. Please try again.' }, { status: 503 });
  }
}
