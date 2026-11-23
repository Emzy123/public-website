import { NextRequest, NextResponse } from 'next/server';
import { getCampaignBySlug } from '@/lib/applications/campaigns';
import { ObjectId } from 'mongodb';
import { getMongoDb } from '@/lib/db/mongodb';
import {
  REGISTRATION_LINKS_COLLECTION,
  maybeAutoCloseLink,
} from '@/lib/registration-links';
import {
  isCampaignLinkOpen,
  getCampaignLinkDisplayStatus,
} from '@/lib/applications/link-status';
import { csrfProtect } from '@/lib/csrf';

export async function GET(request: NextRequest, props: { params: Promise<{ slug: string }> | { slug: string } }) {
  const params = await props.params;
  try {
    const slug = params.slug?.trim() || '';
    if (!slug) {
      return NextResponse.json({ error: 'Registration campaign not found' }, { status: 404 });
    }

    // 1. Check PostgreSQL campaigns first (Phase 1 source of truth)
    try {
      const campaignInfo = await getCampaignBySlug(slug);
      if (campaignInfo) {
        const { campaign, isAccepting, statusReason, seatsRemaining } = campaignInfo;
        const displayStatus = campaignInfo.displayStatus ?? getCampaignLinkDisplayStatus(campaign);
        const response = NextResponse.json({
          campaign: {
            id: campaign.id,
            name: campaign.name,
            slug: campaign.slug,
            description: campaign.description,
            targetRole: campaign.targetRole,
            isAccepting,
            statusReason,
            seatsRemaining,
            applicationCount: campaign.applicationCount,
          },
          link: {
            name: campaign.name,
            slug: campaign.slug,
            roles: [campaign.targetRole],
            accepting: isAccepting,
            status: displayStatus,
          },
        });
        await csrfProtect(request, response);
        return response;
      }
    } catch (pgErr) {
      console.warn('[API/Join] Postgres campaign lookup failed, attempting MongoDB fallback:', pgErr);
    }

    // 2. Fall back to legacy MongoDB registration links if present
    try {
      const db = await getMongoDb();
      const escaped = slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const link = await db.collection(REGISTRATION_LINKS_COLLECTION).findOne({
        $or: [
          { slug },
          { slug: { $regex: new RegExp(`^${escaped}$`, 'i') } },
        ],
      });
      if (link) {
        if (link.isOpen) await maybeAutoCloseLink(db, link as typeof link & { _id: ObjectId });
        const refreshed = await db.collection(REGISTRATION_LINKS_COLLECTION).findOne({ _id: link._id });
        const target = refreshed || link;
        const accepting = isCampaignLinkOpen(target);
        const status = getCampaignLinkDisplayStatus(target);

        const response = NextResponse.json({
          link: {
            name: target.name,
            slug: target.slug,
            roles: target.roles,
            accepting,
            status,
          },
        });
        await csrfProtect(request, response);
        return response;
      }
    } catch (mongoErr) {
      console.warn('[API/Join] Mongo lookup error:', mongoErr);
    }

    return NextResponse.json({ error: 'Registration campaign not found' }, { status: 404 });
  } catch (error) {
    console.error('Public campaign lookup error:', error);
    return NextResponse.json({ error: 'Unable to load registration campaign' }, { status: 500 });
  }
}
