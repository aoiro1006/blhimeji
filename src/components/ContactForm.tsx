"use client";

import { useState } from "react";

interface ContactFormProps {
  toEmail: string;
}

export default function ContactForm({ toEmail }: ContactFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const mailSubject = encodeURIComponent(
      subject.trim() ? `【ボッチャリーグひめじ】${subject.trim()}` : `【ボッチャリーグひめじ】お問い合わせ（${name.trim()}）`
    );
    const body = encodeURIComponent(
      [
        `お名前: ${name.trim()}`,
        `返信先メール: ${email.trim()}`,
        "",
        message.trim(),
      ].join("\n")
    );
    window.location.href = `mailto:${toEmail}?subject=${mailSubject}&body=${body}`;
    setSent(true);
  }

  if (sent) {
    return (
      <div className="card bg-primary-pale/50 border border-primary/20">
        <p className="font-bold text-primary-dark mb-2">メールソフトを起動しました</p>
        <p className="text-sm text-gray-600">
          表示されたメールアプリで内容を確認し、送信してください。
          起動しない場合は{" "}
          <a href={`mailto:${toEmail}`} className="text-primary font-medium hover:underline">
            {toEmail}
          </a>{" "}
          へ直接ご連絡ください。
        </p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="btn-secondary text-sm mt-4"
        >
          フォームに戻る
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <div>
        <label className="text-xs text-gray-500 mb-1 block">
          お名前 <span className="text-accent">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input-field"
          required
          placeholder="山田 太郎"
        />
      </div>
      <div>
        <label className="text-xs text-gray-500 mb-1 block">
          返信先メールアドレス <span className="text-accent">*</span>
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-field"
          required
          placeholder="メールアドレス"
        />
      </div>
      <div>
        <label className="text-xs text-gray-500 mb-1 block">件名</label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="input-field"
          placeholder="参加について / 大会について など"
        />
      </div>
      <div>
        <label className="text-xs text-gray-500 mb-1 block">
          お問い合わせ内容 <span className="text-accent">*</span>
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="input-field min-h-[160px]"
          required
          placeholder="お問い合わせ内容をご記入ください"
        />
      </div>
      <p className="text-xs text-gray-400">
        送信ボタンを押すと、お使いのメールアプリが起動します。内容を確認して送信してください。
      </p>
      <button type="submit" className="btn-primary">
        メールで送信
      </button>
    </form>
  );
}
