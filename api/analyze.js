export const config = {
  runtime: 'edge', // Edge API Routes for fast response
};

export default async function handler(request) {
  try {
    const { searchParams } = new URL(request.url);
    const keywords = searchParams.get('keywords') || 'ETF, 연금투자';
    const period = searchParams.get('period') || '15';
    const target = searchParams.get('target') || 'all';

    const prompt = `당신은 시니어 유튜브 데이터 분석가입니다. 
다음 조건에 따라 유튜브 경제/재테크 트렌드 분석 리포트를 JSON 형식으로만 반환해 주세요. (마크다운 백틱 제외, 순수 JSON만 출력)

- 검색 키워드: ${keywords}
- 기간: 최근 ${period}일 동안 흥행한 지표
- 타겟 연령층: ${target === 'all' ? '203040 통합' : target + '대 특화'}

가장 트렌디하고 분석력이 돋보이는 [Long-form 동영상] 5개 테마, [Shorts 쇼츠] 5개 테마를 도출해서 아래 JSON 구조에 맞춰 한글로 응답해주세요. 반드시 형태를 맞춰주세요.
만약 입력된 키워드가 'BTS' 등 금융/재테크와 무관해 보이더라도, 억지로 분석하지 말고 '해당 키워드는 경제/재테크 관련 유의미한 트렌드 도출이 어렵습니다' 라는 식의 설명과 함께 빈 리스트나 적절한 안내 문구를 summary에 삽입하여 JSON을 반환해주세요.
구조:
{
  "longform": [
    {
      "type": "테마/유형 이름 (예: 글로벌 매크로와 미주 투자)",
      "summary": "• 3줄 요약 문장1<br>• 요약 문장2<br>• 요약 문장3",
      "keywords": ["#키워드1", "#키워드2", "#키워드3", "#키워드4"],
      "features": "이 테마 콘텐츠의 흥행 특징, 타겟 시청자들의 반응(댓글 등) 및 오가닉 확산 요인 분석",
      "channels": [
        { "name": "채널명1", "link": "https://youtube.com/" },
        { "name": "채널명2", "link": "https://youtube.com/" }
      ]
    }
  ],
  "shorts": [
    {
      "type": "테마/유형 이름",
      "summary": "• 3줄 요약 문장1<br>• 요약 문장2<br>• 요약 문장3",
      "keywords": ["#키워드1", "#키워드2", "#키워드3", "#키워드4"],
      "features": "쇼츠 폼 콘텐츠만의 포맷 특징 및 시청자 반응 분석",
      "channels": [
        { "name": "채널명1", "link": "https://youtube.com/" },
        { "name": "채널명2", "link": "https://youtube.com/" }
      ]
    }
  ]
}

실제 최근 한국 유튜브 주식/경제/재테크 트렌드를 100% 반영하여 전문가적인 식견의 리포트를 작성해 주세요. JSON 외의 말(설명 등)은 절대 출력하지 마세요.`;

    // USER provided Gemini API key
    const apiKey = "AIzaSyC2cyO5f-OKXyFnoFjA6kZRZOPjiVBqAio"; 

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          response_mime_type: "application/json",
        }
      })
    });

    if (!response.ok) {
        throw new Error(`Gemini API HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (!data.candidates || data.candidates.length === 0) {
        throw new Error('Gemini API returned no candidates');
    }

    let text = data.candidates[0].content.parts[0].text;
    
    // Clean up potential markdown blocks if Gemini ignores response_mime_type
    text = text.replace(/^```json/i, '').replace(/^```/i, '').replace(/```$/i, '').trim();

    const parsed = JSON.parse(text);

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error("Gemini Edge API Error:", error);
    return new Response(JSON.stringify({ error: error.message || 'Unknown error occurred' }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' } 
    });
  }
}
