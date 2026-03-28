# JSON Blog Demo

DB 없이, 서버 없이, JSON 파일 하나로 블로그를 운영하는 데모 프로젝트.
Notion을 CMS로 연결하여 글 수정 시 즉시 반영되는 구조까지 구현.

**Live:** https://json-blog-demo.vercel.app

---

## 1. 프로젝트 구조

```
json-blog-demo/
├── index.html          # 블로그 전체 UI (목록 + 상세 페이지)
├── posts.json          # 정적 콘텐츠 데이터 (fallback용)
├── package.json        # Notion SDK 의존성
├── api/
│   └── posts.js        # Vercel Serverless Function (Notion API 프록시)
├── images/
│   ├── thumb-1.png     # 썸네일 이미지
│   ├── thumb-2.png
│   └── thumb-3.png
└── .gitignore
```

---

## 2. 데이터 흐름

### Phase 1: JSON 직접 운영 (초기)

```
posts.json → index.html의 fetch() → JavaScript가 DOM 생성 → 화면
```

- `posts.json` 파일을 직접 수정하고 `git push`하면 Vercel이 자동 배포
- 가장 단순한 구조, 서버 비용 0원

### Phase 2: Notion CMS 연결 (현재)

```
Notion DB → /api/posts.js (Serverless) → index.html의 fetch() → 화면
```

- Notion 테이블에서 글을 수정하면 사이트 새로고침만으로 즉시 반영
- `git push` 불필요
- API 실패 시 `posts.json`으로 자동 fallback

---

## 3. 핵심 파일 설명

### 3-1. `index.html` - 블로그 UI 전체

하나의 HTML 파일에 목록 페이지와 상세 페이지가 모두 포함.

**사용된 기술:**

| 기술 | 용도 |
|---|---|
| Pretendard Variable | 한글 웹폰트 (CDN) |
| marked.js | Markdown → HTML 변환 (CDN) |
| CSS Grid | 카드 목록 3열/2열/1열 반응형 |
| CSS clamp() | 뷰포트 기반 유동 폰트 크기 |
| CSS transition + transform | 카드 호버, 페이지 전환 애니메이션 |

**페이지 구성:**

```
┌─────────────────────────────────┐
│  Header (sticky)                │
├─────────────────────────────────┤
│  Hero (타이틀 + 설명)            │
├─────────────────────────────────┤
│  Post Grid (카드 목록)           │
│  ┌────┐ ┌────┐ ┌────┐          │
│  │카드1│ │카드2│ │카드3│          │
│  └────┘ └────┘ └────┘          │
├─────────────────────────────────┤
│  Article Page (전체화면 오버레이)  │  ← 카드 클릭 시 표시
│  - 카테고리, 제목, 날짜           │
│  - 썸네일 이미지                  │
│  - 요약 박스                     │
│  - 본문 (Markdown 렌더링)        │
│  - 태그, 저자, CTA               │
└─────────────────────────────────┘
```

**데이터 로딩 로직:**

```javascript
// 1순위: Notion API에서 가져오기
fetch('/api/posts')
    .then(res => {
        if (!res.ok) throw new Error('API failed');
        return res.json();
    })
    // 2순위: 실패 시 정적 JSON 파일로 fallback
    .catch(() => fetch('posts.json').then(r => r.json()))
    .then(data => {
        // 카드 DOM 생성
    });
```

**상세 페이지 전환 방식:**

```
.article-page {
    position: fixed;            // 전체 화면 오버레이
    transform: translateY(100%); // 아래에 숨김
    transition: transform 0.4s;  // 슬라이드 애니메이션
}
.article-page.open {
    transform: translateY(0);    // 위로 올라옴
}
```

- SPA(Single Page Application)처럼 동작하지만 실제로는 CSS 전환
- `document.body.style.overflow = 'hidden'`으로 배경 스크롤 방지

**Markdown 렌더링:**

```javascript
// marked.js가 마크다운 문법을 HTML로 변환
body.innerHTML = marked.parse(post.content);
```

이를 통해 JSON의 content 필드에서 아래 문법 사용 가능:

| 마크다운 | 결과 |
|---|---|
| `## 소제목` | `<h2>소제목</h2>` |
| `**볼드**` | `<strong>볼드</strong>` |
| `![설명](url)` | `<img src="url">` |
| `- 항목` | `<li>항목</li>` |
| `> 인용` | `<blockquote>인용</blockquote>` |
| `` `코드` `` | `<code>코드</code>` |

**반응형 브레이크포인트:**

| 화면 | 카드 열 수 | 기준 |
|---|---|---|
| PC (1025px+) | 3열 | 기본값 |
| 태블릿 (769~1024px) | 2열 | `@media (max-width: 1024px)` |
| 모바일 (~768px) | 1열 | `@media (max-width: 768px)` |

---

### 3-2. `posts.json` - 콘텐츠 데이터

```json
{
  "blog": {
    "title": "Blog Tech",
    "description": "JSON 하나로 운영하는 블로그"
  },
  "posts": [
    {
      "id": 1,
      "title": "글 제목",
      "date": "2026-03-28",
      "category": "인사이트",
      "thumbnail": "images/thumb-1.png",
      "summary": "한 줄 요약",
      "content": "본문 텍스트. **마크다운** 사용 가능.\n\n## 소제목\n\n- 리스트"
    }
  ]
}
```

**수정 방법:**
1. `posts.json` 파일 열기
2. 따옴표 안의 텍스트 수정
3. 저장 → `git add . && git commit -m "update" && git push`
4. Vercel이 자동 배포 (10~20초)

**주의사항:**
- JSON은 쌍따옴표(`"`)만 허용. 홑따옴표(`'`) 사용 불가
- 줄바꿈은 `\n`, 문단 구분은 `\n\n`
- 마지막 항목 뒤에 콤마(`,`) 붙이면 에러

---

### 3-3. `api/posts.js` - Vercel Serverless Function

Notion API를 호출하고, 결과를 `posts.json`과 동일한 형태의 JSON으로 변환하여 반환.

```
브라우저 → /api/posts 요청 → Serverless Function 실행
                                    ↓
                            Notion API 호출
                            (환경변수로 인증)
                                    ↓
                            Notion DB 데이터 수신
                                    ↓
                            JSON 형태로 변환
                                    ↓
                            브라우저에 응답
```

**환경변수 (Vercel에 등록):**

| 변수명 | 용도 |
|---|---|
| `NOTION_API_KEY` | Notion Integration 인증 키 |
| `NOTION_DATABASE_ID` | 조회할 Notion 데이터베이스 ID |

**Notion 속성 → JSON 매핑:**

| Notion 컬럼 | 타입 | JSON 필드 |
|---|---|---|
| 제목 | Title | `title` |
| 카테고리 | Select | `category` |
| 날짜 | Date | `date` |
| 썸네일 | URL | `thumbnail` |
| 요약 | Rich Text | `summary` |
| 본문 | Rich Text | `content` |

**캐싱 전략:**

```javascript
res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=59');
```

- `s-maxage=10`: Vercel CDN이 10초간 캐시
- `stale-while-revalidate=59`: 캐시 만료 후 59초간은 이전 캐시를 보여주면서 백그라운드에서 갱신

---

## 4. 배포 구조

### GitHub → Vercel 자동 배포

```
코드 수정 → git push → GitHub 수신 → Vercel Webhook 트리거
                                            ↓
                                    자동 빌드 & 배포
                                            ↓
                                    라이브 사이트 갱신
```

**설정 과정:**
1. `gh repo create json-blog-demo --public --source=. --push` (GitHub 저장소 생성)
2. `npx vercel --yes --prod` (Vercel 프로젝트 연결 + GitHub 자동 배포 활성화)

이후 `git push`만 하면 자동으로 빌드 → 배포.

### Notion → 즉시 반영

```
Notion에서 글 수정 → 사이트 새로고침 → /api/posts 호출 → 최신 데이터 표시
```

- git push 불필요
- 캐시 주기(10초) 이후 새로고침하면 반영

---

## 5. 디자인 시스템

Toss 화이트 모드 스타일 기반.

### 컬러 팔레트

| 용도 | 색상 | 코드 |
|---|---|---|
| 배경 | 연한 회색 | `#F4F5F7` |
| 카드/헤더 배경 | 흰색 | `#FFFFFF` |
| 본문 텍스트 | 진한 회색 | `#333D4B` |
| 제목 텍스트 | 거의 검정 | `#191F28` |
| 보조 텍스트 | 중간 회색 | `#8B95A1` |
| 액센트 (링크, 버튼) | 토스 블루 | `#3182F6` |
| 구분선 | 연한 회색 | `#F0F1F4` |
| 코드 배경 | 밝은 회색 | `#F2F4F6` |
| 코드 블록 배경 | 다크 | `#1B1D21` |

### 타이포그래피

| 요소 | 크기 | 굵기 |
|---|---|---|
| 히어로 제목 | clamp(32px, 5vw, 48px) | 800 |
| 카드 제목 | 17px | 700 |
| 상세 제목 | clamp(26px, 4vw, 36px) | 800 |
| 본문 | 17px (모바일 16px) | 400 |
| 카테고리 | 12~13px | 700 |
| 날짜 | 13~14px | 500 |

### 간격 규칙

| 요소 | PC | 모바일 |
|---|---|---|
| 섹션 좌우 패딩 | 24px | 20px |
| 카드 간격 | 20px | 16px |
| 본문 문단 간격 | 28px | 28px |

---

## 6. 기술 비교

### JSON vs DB vs Notion

| | JSON 파일 | 데이터베이스 | Notion CMS |
|---|---|---|---|
| 저장소 | posts.json | PostgreSQL 등 | Notion 테이블 |
| 서버 | 불필요 | 필요 | Serverless |
| 비용 | 0원 | 월 수만~수십만 원 | 0원 |
| 수정 방법 | 파일 편집 + push | 관리자 페이지 | Notion에서 편집 |
| 반영 속도 | push 후 10~20초 | 즉시 | 새로고침 즉시 |
| 적합 규모 | ~수십 개 글 | 제한 없음 | ~수백 개 글 |

### 회사 프로젝트 vs 이 프로젝트

| | 회사 (일반적) | 이 프로젝트 |
|---|---|---|
| 프레임워크 | React / Next.js | 순수 HTML + JS |
| 저장소 | GitLab | GitHub |
| 데이터 | DB 또는 JSON | Notion → JSON |
| 배포 | Jenkins | Vercel (자동) |
| 원리 | 동일 | 동일 |

---

## 7. 주요 라이브러리

| 라이브러리 | 버전 | 용도 | 로딩 방식 |
|---|---|---|---|
| Pretendard Variable | v1.3.9 | 한글 웹폰트 | CDN |
| marked.js | latest | Markdown → HTML | CDN |
| @notionhq/client | ^2.2.0 | Notion API SDK | npm (서버사이드) |

---

## 8. 로컬 개발

```bash
# 로컬 서버 실행
npx http-server -p 8090

# 브라우저에서 확인
# http://localhost:8090
```

로컬에서는 `/api/posts` 엔드포인트가 없으므로 자동으로 `posts.json` fallback이 동작.

---

## 9. 커밋 히스토리

| 커밋 | 내용 |
|---|---|
| Initial commit | 블로그 UI + posts.json + 이미지 |
| test: auto-deploy | Vercel 자동 배포 동작 확인 |
| feat: connect Notion | Notion API Serverless Function 추가 |
| fix: trim env vars | 환경변수 공백 처리 |
| clean: remove debug | 디버그 정보 제거 |
| docs: add README | 이 문서 추가 |
