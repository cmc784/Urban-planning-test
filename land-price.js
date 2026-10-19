// Vercel 서버리스 함수 — VWorld 개별공시지가속성조회 프록시
// 경로: /api/land-price?pnu=19자리&stdrYear=2026(선택)&key=(선택)&domain=(선택)
// 브라우저에서 api.vworld.kr 직접 호출이 CORS로 막힐 때 project.html이 자동으로 이 경로를 사용합니다.
// 키 우선순위: Vercel 환경변수 VWORLD_API_KEY → 요청의 key 파라미터
export default async function handler(req, res) {
  const { pnu = '', stdrYear = '', key = '', domain = '' } = req.query || {};
  if (!/^\d{19}$/.test(String(pnu))) {
    res.status(400).json({ error: { code: 'BAD_PNU', text: 'PNU는 19자리 숫자여야 합니다.' } });
    return;
  }
  const apiKey = process.env.VWORLD_API_KEY || key;
  if (!apiKey) {
    res.status(400).json({ error: { code: 'NO_KEY', text: 'VWorld API 키가 없습니다.' } });
    return;
  }
  const q = new URLSearchParams({
    key: apiKey, pnu: String(pnu), format: 'json', numOfRows: '100', pageNo: '1',
    domain: process.env.VWORLD_API_DOMAIN || String(domain || ''),
  });
  if (/^\d{4}$/.test(String(stdrYear))) q.set('stdrYear', String(stdrYear));
  try {
    const r = await fetch(`https://api.vworld.kr/ned/data/getIndvdLandPriceAttr?${q}`);
    const text = await r.text();
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.status(r.ok ? 200 : r.status).send(text);
  } catch (e) {
    res.status(502).json({ error: { code: 'UPSTREAM', text: String(e && e.message || e) } });
  }
}
