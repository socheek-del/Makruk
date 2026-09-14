/** Transactional email: account confirmation and password reset. */
import type { Env } from '../env';

export type EmailKind = 'verify' | 'reset';
export type Lang = 'th' | 'en';

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
}

/** Real delivery via Resend, or the development outbox (DEV_EMAIL_OUTBOX=1). */
export const emailAvailable = (env: Env) => !!(env.RESEND_API_KEY && env.EMAIL_FROM) || env.DEV_EMAIL_OUTBOX === '1';

const COPY: Record<EmailKind, Record<Lang, { subject: string; heading: string; body: string; cta: string; note: string }>> = {
  verify: {
    th: {
      subject: 'ยืนยันอีเมลสำหรับบัญชีหมากรุกไทย',
      heading: 'ยินดีต้อนรับสู่หมากรุกไทย!',
      body: 'กดปุ่มด้านล่างเพื่อยืนยันอีเมลและเปิดใช้บัญชีของคุณ',
      cta: 'ยืนยันอีเมล',
      note: 'ลิงก์นี้ใช้ได้ครั้งเดียวและหมดอายุใน 24 ชั่วโมง',
    },
    en: {
      subject: 'Confirm your Makruk account',
      heading: 'Welcome to Makruk!',
      body: 'Tap the button below to confirm your email and activate your account.',
      cta: 'Confirm email',
      note: 'This link works once and expires in 24 hours.',
    },
  },
  reset: {
    th: {
      subject: 'ตั้งรหัสผ่านใหม่สำหรับบัญชีหมากรุกไทย',
      heading: 'ตั้งรหัสผ่านใหม่',
      body: 'มีคำขอตั้งรหัสผ่านใหม่สำหรับบัญชีของคุณ ถ้าไม่ได้ขอ ไม่ต้องทำอะไร',
      cta: 'ตั้งรหัสผ่านใหม่',
      note: 'ลิงก์นี้ใช้ได้ครั้งเดียวและหมดอายุใน 1 ชั่วโมง',
    },
    en: {
      subject: 'Reset your Makruk password',
      heading: 'Reset your password',
      body: "Someone asked to reset your password. If it wasn't you, you can ignore this email.",
      cta: 'Choose a new password',
      note: 'This link works once and expires in 1 hour.',
    },
  },
};

export function renderEmail(kind: EmailKind, to: string, link: string, lang: Lang): EmailMessage {
  const c = COPY[kind][lang];
  return {
    to,
    subject: c.subject,
    html: `<div style="font-family:sans-serif;max-width:440px;margin:auto;text-align:center">
<h1 style="color:#58cc02">${c.heading}</h1>
<p>${c.body}</p>
<p><a href="${link}" style="display:inline-block;background:#58cc02;color:#fff;padding:14px 28px;border-radius:16px;text-decoration:none;font-weight:bold">${c.cta}</a></p>
<p style="color:#777">${c.note}</p></div>`,
  };
}

export async function sendEmail(env: Env, message: EmailMessage): Promise<boolean> {
  if (env.RESEND_API_KEY && env.EMAIL_FROM) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from: env.EMAIL_FROM, to: [message.to], subject: message.subject, html: message.html }),
    });
    return res.ok;
  }
  if (env.DEV_EMAIL_OUTBOX === '1') {
    await env.DB.prepare('INSERT INTO dev_outbox (to_email, subject, html, created_at) VALUES (?, ?, ?, ?)')
      .bind(message.to, message.subject, message.html, Date.now())
      .run();
    return true;
  }
  return false;
}
