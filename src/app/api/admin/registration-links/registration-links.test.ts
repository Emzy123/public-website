/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { ObjectId } from 'mongodb';
import { POST, PATCH } from './route';
import * as adminAuth from '@admin/lib/auth';
import * as csrfHandler from '@/lib/security/csrf-handler';
import * as rateLimitUnified from '@/lib/security/rate-limit-unified';
import * as auditLog from '@/lib/audit/log';
import * as mongodb from '@/lib/db/mongodb';
import {
  createRegistrationLinkSchema,
  updateRegistrationLinkSchema,
} from '@/lib/schemas/registration-link.schema';

jest.mock('@admin/lib/auth', () => ({
  getSession: jest.fn(),
}));

jest.mock('@/lib/security/csrf-handler', () => ({
  verifyCsrfToken: jest.fn(),
}));

jest.mock('@/lib/security/rate-limit-unified', () => ({
  enforceRateLimit: jest.fn(),
  getClientIp: jest.fn().mockReturnValue('127.0.0.1'),
}));

jest.mock('@/lib/audit/log', () => ({
  writeAuditLog: jest.fn().mockResolvedValue(true),
}));

jest.mock('@/lib/db/mongodb', () => ({
  getMongoDb: jest.fn(),
}));

describe('Item 1.4: Link Roles & Staff Invite-Only Enforcement', () => {
  describe('Zod Schema validation', () => {
    it('rejects createRegistrationLinkSchema when roles contain staff but isInviteOnly is not true', () => {
      const resultWithoutInviteOnly = createRegistrationLinkSchema.safeParse({
        name: 'Staff Public Link',
        roles: ['staff'],
      });
      expect(resultWithoutInviteOnly.success).toBe(false);
      if (!resultWithoutInviteOnly.success) {
        expect(resultWithoutInviteOnly.error.issues[0].message).toMatch(
          /Staff role can only be assigned to links marked as invite-only/i
        );
      }

      const resultWithFalseInviteOnly = createRegistrationLinkSchema.safeParse({
        name: 'Staff Public Link',
        roles: ['staff'],
        isInviteOnly: false,
      });
      expect(resultWithFalseInviteOnly.success).toBe(false);
    });

    it('accepts createRegistrationLinkSchema when roles contain staff and isInviteOnly is true', () => {
      const result = createRegistrationLinkSchema.safeParse({
        name: 'Staff Private Link',
        roles: ['staff'],
        isInviteOnly: true,
      });
      expect(result.success).toBe(true);
    });

    it('rejects updateRegistrationLinkSchema when roles contain staff and isInviteOnly is false', () => {
      const result = updateRegistrationLinkSchema.safeParse({
        id: new ObjectId().toHexString(),
        roles: ['staff'],
        isInviteOnly: false,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('API endpoints', () => {
    let mockCollection: any;
    let mockDb: any;

    beforeEach(() => {
      jest.clearAllMocks();
      (adminAuth.getSession as jest.Mock).mockResolvedValue({ email: 'admin@sinet.africa' });
      (csrfHandler.verifyCsrfToken as jest.Mock).mockResolvedValue({ ok: true });
      (rateLimitUnified.enforceRateLimit as jest.Mock).mockResolvedValue({ ok: true });

      mockCollection = {
        findOne: jest.fn(),
        insertOne: jest.fn(),
        updateOne: jest.fn(),
        find: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            toArray: jest.fn().mockResolvedValue([]),
          }),
        }),
      };

      mockDb = {
        collection: jest.fn().mockReturnValue(mockCollection),
      };

      (mongodb.getMongoDb as jest.Mock).mockResolvedValue(mockDb);
    });

    describe('POST /api/admin/registration-links', () => {
      it('returns 401 when session is not authenticated', async () => {
        (adminAuth.getSession as jest.Mock).mockResolvedValue(null);

        const req = new NextRequest('http://localhost:3000/api/admin/registration-links', {
          method: 'POST',
          body: JSON.stringify({ name: 'Test', roles: ['community-member'] }),
        });

        const res = await POST(req);
        expect(res.status).toBe(401);
      });

      it('rejects with 400 when creating a link with staff role without invite-only', async () => {
        const req = new NextRequest('http://localhost:3000/api/admin/registration-links', {
          method: 'POST',
          body: JSON.stringify({
            name: 'Public Staff Link',
            roles: ['staff'],
            isInviteOnly: false,
          }),
        });

        const res = await POST(req);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toMatch(/Staff role can only be assigned to links marked as invite-only/i);
        expect(mockCollection.insertOne).not.toHaveBeenCalled();
      });

      it('creates staff link successfully when marked as invite-only and writes audit log', async () => {
        const fakeId = new ObjectId();
        mockCollection.insertOne.mockResolvedValue({ insertedId: fakeId });

        const req = new NextRequest('http://localhost:3000/api/admin/registration-links', {
          method: 'POST',
          body: JSON.stringify({
            name: 'Staff Internal Drive 2026',
            roles: ['staff'],
            isInviteOnly: true,
          }),
        });

        const res = await POST(req);
        expect(res.status).toBe(201);
        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.link.isInviteOnly).toBe(true);

        expect(mockCollection.insertOne).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Staff Internal Drive 2026',
            roles: ['staff'],
            isInviteOnly: true,
          })
        );

        expect(auditLog.writeAuditLog).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'registration_link.create',
            actor: 'admin@sinet.africa',
            metadata: expect.objectContaining({
              roles: ['staff'],
              isInviteOnly: true,
            }),
          })
        );
      });
    });

    describe('PATCH /api/admin/registration-links', () => {
      it('returns 401 when session is not authenticated', async () => {
        (adminAuth.getSession as jest.Mock).mockResolvedValue(null);

        const req = new NextRequest('http://localhost:3000/api/admin/registration-links', {
          method: 'PATCH',
          body: JSON.stringify({ id: new ObjectId().toHexString(), roles: ['community-member'] }),
        });

        const res = await PATCH(req);
        expect(res.status).toBe(401);
      });

      it('rejects with 400 when attempting to add staff role to a public link', async () => {
        const linkId = new ObjectId();
        mockCollection.findOne.mockResolvedValue({
          _id: linkId,
          name: 'Global Application',
          slug: 'global-app',
          roles: ['community-member', 'ambassador'],
          isInviteOnly: false,
        });

        const req = new NextRequest('http://localhost:3000/api/admin/registration-links', {
          method: 'PATCH',
          body: JSON.stringify({
            id: linkId.toHexString(),
            roles: ['community-member', 'staff'],
            // isInviteOnly not passed, defaults to existing: false
          }),
        });

        const res = await PATCH(req);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toMatch(/Staff role can only be assigned to links marked as invite-only/i);
        expect(mockCollection.updateOne).not.toHaveBeenCalled();
      });

      it('rejects with 400 when attempting to unmark isInviteOnly while staff role remains', async () => {
        const linkId = new ObjectId();
        mockCollection.findOne.mockResolvedValue({
          _id: linkId,
          name: 'Staff Link',
          slug: 'staff-link',
          roles: ['staff'],
          isInviteOnly: true,
        });

        const req = new NextRequest('http://localhost:3000/api/admin/registration-links', {
          method: 'PATCH',
          body: JSON.stringify({
            id: linkId.toHexString(),
            isInviteOnly: false,
          }),
        });

        const res = await PATCH(req);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toMatch(/Staff role can only be assigned to links marked as invite-only/i);
        expect(mockCollection.updateOne).not.toHaveBeenCalled();
      });

      it('updates roles and writes audit log with changedFields and previousValue', async () => {
        const linkId = new ObjectId();
        const existingLink = {
          _id: linkId,
          name: 'Sinetworking Global Application 2026',
          slug: 'sinetworking-global-application-2026',
          roles: ['community-member', 'ambassador', 'staff'],
          isInviteOnly: false,
          isOpen: true,
          status: 'open',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const updatedLink = {
          ...existingLink,
          roles: ['community-member', 'ambassador'],
          updatedAt: new Date(),
        };

        mockCollection.findOne
          .mockResolvedValueOnce(existingLink)
          .mockResolvedValueOnce(updatedLink);
        mockCollection.updateOne.mockResolvedValue({ modifiedCount: 1 });

        // Removing staff from the public link:
        const req = new NextRequest('http://localhost:3000/api/admin/registration-links', {
          method: 'PATCH',
          body: JSON.stringify({
            id: linkId.toHexString(),
            roles: ['community-member', 'ambassador'],
          }),
        });

        const res = await PATCH(req);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.link.roles).toEqual(['community-member', 'ambassador']);

        expect(mockCollection.updateOne).toHaveBeenCalledWith(
          { _id: linkId },
          {
            $set: expect.objectContaining({
              roles: ['community-member', 'ambassador'],
            }),
          }
        );

        expect(auditLog.writeAuditLog).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'registration_link.update',
            actor: 'admin@sinet.africa',
            resource: `registration_link:${linkId.toHexString()}`,
            metadata: expect.objectContaining({
              roles: ['community-member', 'ambassador'],
              changedFields: ['roles'],
            }),
            previousValue: expect.objectContaining({
              roles: ['community-member', 'ambassador', 'staff'],
            }),
          })
        );
      });
    });
  });
});
