/**
 * Vercel Serverless Function — WMS 프록시
 * 브이월드 API 키를 서버에서 주입하여 클라이언트에 노출되지 않도록 합니다.
 * 
 * Vercel 환경변수 설정 필요:
 *   VWORLD_KEY = 브이월드 API 키 (평문)
 */

export default async function handler(req, res) {
  const key = process.env.VWORLD_KEY;

  if (!key) {
    return res.status(500).json({ error: 'VWORLD_KEY 환경변수가 설정되지 않았습니다.' });
  }

  // 클라이언트가 보낸 파라미터에서 key/domain 제거 후 서버 키 주입
  const params = new URLSearchParams(req.query);
  params.delete('key');    // 클라이언트 키 제거
  params.delete('domain'); // domain은 서버에서 설정

  params.set('key', key);
  params.set('domain', 'urban-planning-test.vercel.app');

  const vworldUrl = `https://api.vworld.kr/req/wms?${params.toString()}`;

  try {
    const response = await fetch(vworldUrl);

    if (!response.ok) {
      return res.status(response.status).send('WMS 서버 오류');
    }

    // 브이월드 응답 헤더 중 필요한 것만 전달
    const contentType = response.headers.get('content-type') || 'image/png';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    // 이미지 스트림 전달
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));

  } catch (err) {
    res.status(500).send('프록시 오류: ' + err.message);
  }
}
