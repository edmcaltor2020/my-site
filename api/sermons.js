// 토론토 갈릴리 장로교회 유튜브 채널의 최신 설교 영상 목록을 읽어 온다.
// 키나 비밀번호는 쓰지 않는다. 공개된 채널 페이지만 읽는다.
const CHANNEL_VIDEOS = 'https://www.youtube.com/@TorontoGalileeChurch/videos';

function parse(html) {
  const out = [];
  const seen = new Set();
  for (const chunk of html.split('"lockupViewModel"').slice(1)) {
    const id = (chunk.match(/\/vi\/([\w-]{11})\//) || [])[1];
    const raw = (chunk.match(/"lockupMetadataViewModel":\{"title":\{"content":"((?:[^"\\]|\\.)*)"/) || [])[1];
    if (!id || !raw || seen.has(id)) continue;
    let title;
    try { title = JSON.parse('"' + raw + '"'); } catch { continue; }
    seen.add(id);
    out.push({ id, title });
    if (out.length >= 6) break;
  }
  return out;
}

module.exports = async (req, res) => {
  try {
    const r = await fetch(CHANNEL_VIDEOS, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36',
        'Accept-Language': 'ko-KR,ko;q=0.9',
      },
    });
    if (!r.ok) throw new Error('status ' + r.status);
    const videos = parse(await r.text());
    if (!videos.length) throw new Error('empty');
    // 한 시간 동안 저장해 두고, 그 뒤 하루까지는 저장본을 보여 주며 새로 읽는다
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).json({ videos });
  } catch (e) {
    res.setHeader('Cache-Control', 's-maxage=300');
    return res.status(200).json({ videos: [] });
  }
};
