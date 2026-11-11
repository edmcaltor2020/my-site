// 한 번만 쓰는 표 만들기 통로 — 표가 생기면 이 파일은 지운다. 데이터는 읽지도 보내지도 않는다.
const { Client } = require('pg');
const SQL = `
create table if not exists public.inquiries (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  kind text not null default '문의' check (kind in ('신앙상담', '문의', '기도요청')),
  anonymous boolean not null default false,
  name text,
  contact text,
  message text,
  consent boolean not null default false,
  status text not null default '새 문의' check (status in ('새 문의', '연락함', '완료')),
  updated_at timestamptz
);
alter table public.inquiries enable row level security;
revoke all on public.inquiries from anon, authenticated;
`;
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST만 가능해요' });
  const url = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
  if (!url) return res.status(500).json({ error: '데이터베이스 연결 정보가 없어요. Vercel Storage에서 Supabase를 연결해 주세요.' });
  const client = new Client({ connectionString: url.replace(/[?&]sslmode=[^&]*/, ''), ssl: { rejectUnauthorized: false } });
  try { await client.connect(); await client.query(SQL); return res.status(200).json({ ok: true }); }
  catch (e) { return res.status(500).json({ error: '표를 만들지 못했어요', detail: String(e.message).slice(0, 200) }); }
  finally { await client.end().catch(() => {}); }
};
