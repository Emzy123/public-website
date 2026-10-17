/** @jest-environment node */

import { logPostgresFallbackWrite } from './fallback-log';
import * as fallbackLogModule from './fallback-log';
import { createPost } from '@/lib/posts/posts';
import { createEmailOtp } from '@/lib/auth/otp';
import { db } from '@/lib/db';

jest.mock('@/lib/db/mongodb', () => ({
  getMongoDb: jest.fn().mockResolvedValue({
    collection: jest.fn().mockReturnValue({
      insertOne: jest.fn().mockResolvedValue({ insertedId: 'mock-mongo-id-123' }),
      deleteMany: jest.fn().mockResolvedValue({ acknowledged: true }),
      updateOne: jest.fn().mockResolvedValue({ acknowledged: true }),
      findOne: jest.fn().mockResolvedValue(null),
    }),
  }),
}));

describe('P2 Data Integrity - Postgres Fallback Write Audit Logging', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('logPostgresFallbackWrite emits structured log with no PII or secrets', async () => {
    const consoleSpy = jest.spyOn(console, 'info').mockImplementation(() => {});

    const event = await logPostgresFallbackWrite('user', 'member-123');

    expect(event.event).toBe('postgres_fallback_write');
    expect(event.type).toBe('user');
    expect(event.id).toBe('member-123');
    expect(typeof event.timestamp).toBe('string');

    // Confirm JSON log output
    expect(consoleSpy).toHaveBeenCalledWith(
      JSON.stringify({
        event: 'postgres_fallback_write',
        type: 'user',
        id: 'member-123',
        timestamp: event.timestamp,
      })
    );

    // Verify no PII fields exist
    const rawKeys = Object.keys(event);
    expect(rawKeys).not.toContain('email');
    expect(rawKeys).not.toContain('phone');
    expect(rawKeys).not.toContain('name');
    expect(rawKeys).not.toContain('password');
    expect(rawKeys).not.toContain('token');
    expect(rawKeys).not.toContain('secret');
  });

  it('createPost emits fallback audit event when Postgres is down', async () => {
    const fallbackSpy = jest.spyOn(fallbackLogModule, 'logPostgresFallbackWrite');
    jest.spyOn(db, 'insert').mockImplementation(() => {
      throw new Error('connect ECONNREFUSED 127.0.0.1:5432');
    });

    const post = await createPost({
      title: 'Community Initiative Launch',
      contentHtml: '<p>Exciting community launch details.</p>',
      pillar: 'community',
      authorName: 'Ada Lovelace',
    });

    expect(post).toBeDefined();
    expect(fallbackSpy).toHaveBeenCalledWith('post', post.id);
  });

  it('createEmailOtp emits fallback audit event when Postgres is down', async () => {
    const fallbackSpy = jest.spyOn(fallbackLogModule, 'logPostgresFallbackWrite');
    jest.spyOn(db, 'delete').mockImplementation(() => {
      throw new Error('connect ECONNREFUSED 127.0.0.1:5432');
    });

    await createEmailOtp('user@example.com');

    expect(fallbackSpy).toHaveBeenCalledWith('verification_token', expect.any(String));
  });
});
