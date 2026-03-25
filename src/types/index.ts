import type { WaitlistFormData } from '@/lib/validation';

export type ApiErrorResponse = { error?: string; errors?: Record<string, string> };
export type ApiSuccessResponse = { success: true; message: string };
export type WaitlistPayload = WaitlistFormData;

export type EmpireSubSector = {
  name: string;
  description: string;
  minInvestment: number;
};
export type SubSector = EmpireSubSector;

export type Empire = {
  id: string;
  name: string;
  icon: string;
  description: string;
  subSectors: EmpireSubSector[];
};

export type Rep = {
  id: string;
  name: string;
  region: string;
  photoUrl: string;
  altText: string;
};

export type TeamMember = {
  id: string;
  name: string;
  title: string;
  photoUrl: string | null;
};
