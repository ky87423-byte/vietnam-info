import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  try {
    const { email, code, name } = await req.json() as {
      email: string;
      code: string;
      name?: string;
    };

    if (!email || !code) {
      return NextResponse.json({ ok: false, error: "필수 파라미터 누락" }, { status: 400 });
    }

    const host = process.env.EMAIL_SMTP_HOST;
    const port = Number(process.env.EMAIL_SMTP_PORT ?? "587");
    const user = process.env.EMAIL_SMTP_USER;
    const pass = process.env.EMAIL_SMTP_PASS;
    const from = process.env.EMAIL_FROM ?? user;

    if (!host || !user || !pass) {
      // 이메일 설정이 없으면 개발 모드: 콘솔에 출력
      console.log(`\n[비밀번호 찾기] 인증번호\n  이메일: ${email}\n  코드: ${code}\n`);
      return NextResponse.json({ ok: true, dev: true });
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: `"베트남인포" <${from}>`,
      to: email,
      subject: "[베트남인포] 비밀번호 재설정 인증번호",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
          <div style="text-align:center;margin-bottom:24px;">
            <div style="display:inline-block;background:#b91c1c;color:#fff;font-weight:700;font-size:20px;padding:8px 16px;border-radius:8px;">
              베트남인포
            </div>
          </div>
          <h2 style="font-size:18px;color:#111827;margin:0 0 8px;">비밀번호 재설정 인증번호</h2>
          <p style="color:#6b7280;font-size:14px;margin:0 0 24px;">
            ${name ? `<strong>${name}</strong>님, ` : ""}안녕하세요.<br>
            아래 6자리 인증번호를 입력해 비밀번호를 재설정하세요.
          </p>
          <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;text-align:center;margin-bottom:24px;">
            <span style="font-size:36px;font-weight:800;letter-spacing:8px;color:#b91c1c;">${code}</span>
          </div>
          <p style="color:#9ca3af;font-size:12px;margin:0;">
            이 인증번호는 <strong>10분</strong> 동안 유효합니다.<br>
            본인이 요청하지 않은 경우 이 메일을 무시하세요.
          </p>
        </div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[send-reset-code]", err);
    return NextResponse.json(
      { ok: false, error: "이메일 발송 실패. 잠시 후 다시 시도해주세요." },
      { status: 500 }
    );
  }
}
