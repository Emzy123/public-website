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
import { ALL_APPLICATION_ROLES } from '@/lib/types/membership';

import { requireRole, AuthError, ForbiddenError } from '@/lib/auth/guards';
import { db, isPostgresConfigured } from '@/lib/db';
import { applications, campaigns, universities } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

function pathwayLabel(pathway: string): string {
  if (pathway in ROLE_LABELS) return ROLE_LABELS[pathway as ApplicationRole];
  if (pathway === 'investment') return 'Investment (legacy)';
  if (pathway === 'get-involved') return 'Get Involved (legacy)';
  if (pathway === 'student') return 'Student';
  return pathway.replace('_', ' ');
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(['super_admin', 'admin', 'chapter_lead'], request);
  } catch (authErr) {
    if (authErr instanceof AuthError) {
      return NextResponse.json({ error: authErr.message }, { status: authErr.statusCode });
    }
    if (authErr instanceof ForbiddenError) {
      return NextResponse.json({ error: authErr.message }, { status: authErr.statusCode });
    }
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Try MongoDB application first
    if (ObjectId.isValid(params.id)) {
      const dbMongo = await getMongoDb();
      const doc = await dbMongo.collection('applications').findOne({ _id: new ObjectId(params.id) });
      if (doc) {
        const data = (doc.data || {}) as Record<string, unknown>;
        const roleRaw = String(doc.role || doc.pathway || data.role || '');
        const isKnownRole = ALL_APPLICATION_ROLES.includes(roleRaw as ApplicationRole);
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
            reviewNote: typeof doc.reviewRemarks === 'string' ? doc.reviewRemarks : typeof doc.reviewNote === 'string' ? doc.reviewNote : '',
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
      }
    }

    // 2. Fall back to PostgreSQL applications
    if (isPostgresConfigured()) {
      try {
        const [pgApp] = await db
          .select({
            id: applications.id,
            fullName: applications.fullName,
            email: applications.email,
            phone: applications.phone,
            programme: applications.programme,
            level: applications.level,
            division: applications.division,
            contributionPitch: applications.contributionPitch,
            photoUrl: applications.photoUrl,
            status: applications.status,
            reviewedBy: applications.reviewedBy,
            reviewedAt: applications.reviewedAt,
            reviewRemarks: applications.reviewRemarks,
            createdAt: applications.createdAt,
            campaignName: campaigns.name,
            campaignSlug: campaigns.slug,
            universityName: universities.name,
          })
          .from(applications)
          .leftJoin(campaigns, eq(applications.campaignId, campaigns.id))
          .innerJoin(universities, eq(applications.universityId, universities.id))
          .where(eq(applications.id, params.id))
          .limit(1);

        if (pgApp) {
          const fields = [
            { key: 'fullName', label: 'Full Name', value: pgApp.fullName },
            { key: 'email', label: 'Email Address', value: pgApp.email },
            { key: 'phone', label: 'Phone Number', value: pgApp.phone },
            { key: 'university', label: 'Institution / Campus', value: pgApp.universityName },
            { key: 'programme', label: 'Academic Programme', value: pgApp.programme },
            { key: 'level', label: 'Level of Study', value: pgApp.level },
            { key: 'division', label: 'Student Division', value: pgApp.division.replace('_', ' ') },
            { key: 'contributionPitch', label: 'Statement / Pitch', value: pgApp.contributionPitch },
          ];

          const documents = pgApp.photoUrl ? [
            {
              key: 'photo',
              label: 'Applicant Passport Photo',
              id: 'photo',
              downloadUrl: pgApp.photoUrl,
            }
          ] : [];

          const response = NextResponse.json({
            application: {
              _id: pgApp.id,
              pathway: pgApp.division,
              pathwayLabel: pgApp.division.replace('_', ' ').toUpperCase(),
              role: pgApp.division,
              status: pgApp.status,
              reviewNote: pgApp.reviewRemarks || '',
              reviewedBy: pgApp.reviewedBy || '',
              sourceLinkName: pgApp.campaignName || 'Campus Admissions',
              sourceLinkSlug: pgApp.campaignSlug || '',
              submittedAt: pgApp.createdAt.toISOString(),
              updatedAt: pgApp.createdAt.toISOString(),
              agreementMeta: null,
              fields,
              documents,
              rawData: pgApp,
            },
          });
          await csrfProtect(request, response);
          return response;
        }
      } catch (err) {
        console.warn('[AdminApps] PostgreSQL detail query failed:', err);
      }
    }

    return NextResponse.json({ error: 'Application not found' }, { status: 404 });
  } catch (error) {
    console.error('Application detail error:', error);
    return NextResponse.json({ error: 'Unable to load application' }, { status: 503 });
  }
}
