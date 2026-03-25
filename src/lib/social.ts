const fallback = {
  x: 'https://x.com/SINet_Africa',
  linkedIn: 'https://www.linkedin.com/company/sinet-africa',
  facebook: 'https://www.facebook.com/SINetAfrica',
};

export const socialLinks = {
  x: process.env.NEXT_PUBLIC_SOCIAL_X_URL || fallback.x,
  linkedIn: process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN_URL || fallback.linkedIn,
  facebook: process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK_URL || fallback.facebook,
};

