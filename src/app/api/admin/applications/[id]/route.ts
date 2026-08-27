import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getSession } from '@admin/lib/auth';
import { getMongoDb } from '@/lib/db/mongodb';
import { csrfProtect } from '@/lib/csrf';
import { ROLE_LABELS, type ApplicationRole } from '@/lib/types/membership';
import {
  fieldLabelFor,
  documentLabelFor,
  getRoleDefinition,
} from '@/lib/applications/role-definitions';
import { APPLICATION_ROLES } from '@/lib/types/membership';

function pathwayLabel(pathway: string): string {
  if (pathway in ROLE_LABELS) return ROLE_LABELS[pathway as ApplicationRole];
  if (pathway === 'investment') return 'Investment (legacy)';
  if (pathway === 'get-involved') return 'Get Involved (legacy)';
  if (pathway === 'student') return 'Student';
  return pathway;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!ObjectId.isValid(params.id)) {
    return NextResponse.json({ error: 'Invalid application id' }, { status: 400 });
  }

  try {
    const db = await getMongoDb();
    const doc = await db.collection('applications').findOne({ _id: new ObjectId(params.id) });
    if (!doc) return NextResponse.json({ error: 'Application not found' }, { status: 404 });

    const data = (doc.data || {}) as Record<string, unknown>;
    const roleRaw = String(doc.role || doc.pathway || data.role || '');
    const isKnownRole = APPLICATION_ROLES.includes(roleRaw as ApplicationRole);
    const role = isKnownRole ? (roleRaw as ApplicationRole) : null;

    const documents: { key: string; label: string; id: string; downloadUrl: string }[] = [];
    const docsMap =
      data.documents && typeof data.documents === 'object'
        ? (data.documents as Record<string, unknown>)
        : {};
    for (const [key, value] of Object.entries(docsMap)) {
      if (typeof value !== 'string' || !value) continue;
      documents.push({
        key,
        label: role ? documentLabelFor(role, key) : key,
        id: value,
        downloadUrl: `/api/admin/application-docs/${value}`,
      });
    }

    const fields: { key: string; label: string; value: string }[] = [];
    const skipKeys = new Set(['documents', 'codeOfConductAccepted', 'website', 'role']);
    for (const [key, value] of Object.entries(data)) {
      if (skipKeys.has(key)) continue;
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) continue;
      fields.push({
        key,
        label: role ? fieldLabelFor(role, key) : key.replace(/([A-Z])/g, ' $1'),
        value: Array.isArray(value) ? value.join(', ') : String(value ?? '—'),
      });
    }

    // Preferred field order from role definition when available
    if (role) {
      const def = getRoleDefinition(role);
      const order = ['fullName', 'email', 'phone', ...def.fields.map((f) => f.key)];
      fields.sort((a, b) => {
        const ai = order.indexOf(a.key);
        const bi = order.indexOf(b.key);
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
      });
    }

    const response = NextResponse.json({
      application: {
        _id: String(doc._id),
        pathway: String(doc.pathway || ''),
        pathwayLabel: pathwayLabel(String(doc.pathway || roleRaw)),
        role: roleRaw,
        status: String(doc.status || 'pending'),
        reviewNote: typeof doc.reviewNote === 'string' ? doc.reviewNote : '',
        reviewedBy: typeof doc.reviewedBy === 'string' ? doc.reviewedBy : '',
        sourceLinkName: typeof doc.sourceLinkName === 'string' ? doc.sourceLinkName : '',
        sourceLinkSlug: typeof doc.sourceLinkSlug === 'string' ? doc.sourceLinkSlug : '',
        submittedAt:
          doc.submittedAt instanceof Date ? doc.submittedAt.toISOString() : doc.submittedAt,
        updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : doc.updatedAt,
        agreementMeta: doc.agreementMeta || null,
        fields,
        documents,
        rawData: data,
      },
    });
    await csrfProtect(request, response);
    return response;
  } catch (error) {
    console.error('Application detail error:', error);
    return NextResponse.json({ error: 'Unable to load application' }, { status: 503 });
  }
}
