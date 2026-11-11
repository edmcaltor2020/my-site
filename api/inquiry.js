// 문의 받기 — Supabase 키는 환경변수 이름으로만 읽는다. 값은 코드에 적지 않는다.
const SB_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
const KINDS = ['신앙상담', '문의', '기도요청'];
const clip = (v, n) => String(v ?? '').trim().slice(0, n);
const sbHeaders = () => ({
  apikey: SB_KEY,
  ...(String(SB_KEY).startsWith('eyJ') ? { Authorization: `Bearer ${SB_KEY}` } : {}),
  'Content-Type': 'application/json',
});

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST만 가능해요' });
  if (!SB_URL || !SB_KEY) return res.status(500).json({ error: '저장소 연결 정보가 없어요. 잠시 뒤 다시 시도해 주세요.' });
  let b = req.body || {};
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch { b = {}; } }
  if (b.website) return res.status(200).json({ ok: true }); // 스팸 함정 칸(사람에게는 안 보임)

  const anonymous = b.anonymous === true;
  const row = {
    kind: KINDS.includes(b.kind) ? b.kind : '문의',
    anonymous,
    name: anonymous ? null : clip(b.name, 50),
    contact: anonymous ? null : clip(b.contact, 100),
    message: clip(b.message, 1000),
    consent: anonymous ? false : b.consent === true,
  };
  if (!row.message) return res.status(400).json({ error: '내용을 적어 주세요.' });
  if (!anonymous) {
    if (!row.name || !row.contact) return res.status(400).json({ error: '이름과 연락처를 적어 주세요.' });
    if (!row.consent) return res.status(400).json({ error: '개인정보 수집·이용에 동의해 주세요.' });
  }

  const r = await fetch(`${SB_URL}/rest/v1/inquiries`, {
    method: 'POST',
    headers: { ...sbHeaders(), Prefer: 'return=minimal' },
    body: JSON.stringify(row),
  });
  if (!r.ok) return res.status(500).json({ error: '저장하지 못했어요. 잠시 뒤 다시 시도해 주세요.' });
  return res.status(200).json({ ok: true });
};
