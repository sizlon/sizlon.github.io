# 컨택트 폼

> English: [README.md](README.md)

Sizlon 마케팅 사이트 컨택트 폼의 개발자 문서. 정적 폼이 제출을 **소유자의 Google
Workspace 안**으로 보낸다 — 제3자 폼 SaaS가 없어서 제출 데이터가 Sizlon이 통제하는
인프라를 절대 벗어나지 않는다.

## 아키텍처

```
sizlon.io/contact  (정적 Astro 폼)
        │  POST (application/x-www-form-urlencoded), 숨은 <iframe>를 타깃으로
        ▼
Google Apps Script 웹앱  (/exec)
        ├── 검증 + 인증 (아래 "방어" 참조)
        ├── Google Sheet에 행 추가        ← 제출 로그
        └── MailApp이 NOTIFY로 메일 발송   ← 알림
```

POST는 `fetch`가 아니라 숨은 `<iframe>`을 타깃으로 한다 — Apps Script 웹앱은 CORS
헤더를 안 주기 때문에 이렇게 하면 CORS/프리플라이트를 아예 우회한다. 클라이언트는
응답을 읽을 수 없어서, iframe 로드가 끝나면 성공을 낙관적으로 표시한다. 봇 방어는
Cloudflare Turnstile이 맡는다.

## 파일

| 파일 | 역할 |
|------|------|
| `src/sections/Contact.astro` | 폼 마크업·스타일·클라이언트 인핸스먼트 스크립트(경과시간 스탬프, 허니팟 가드, Turnstile 토큰 게이트, 성공 전환). |
| `src/config/site.ts` | `contactFormEndpoint`(`/exec` URL)와 `turnstileSiteKey`. 둘 다 클라이언트에 노출되는 값이며 비밀이 아니다. |
| `src/i18n/content.ts` | `contact.*` 문자열(labels, `sending`, `sentTitle`, `sentBody`, `verifyNeeded`) en + ko. |
| `contact-form/Code.gs` | 배포되는 Apps Script의 정본. Astro가 빌드하지 않으며 Apps Script 에디터에 손으로 복사해 넣는다. |

`Code.gs`는 레포에 있지만 **자동 배포되지 않는다.** 수정 후에는 Apps Script 에디터에
붙여넣고 재배포해야 한다(아래 참조).

## 설정

**`src/config/site.ts`** (커밋됨, 공개):
- `contactFormEndpoint` — Apps Script 웹앱 `/exec` URL. 비어 있으면 제출이 무동작하고
  mailto 폴백이 대신한다.
- `turnstileSiteKey` — Cloudflare Turnstile site key. 비어 있으면 위젯이 렌더되지 않고
  서버도 Turnstile 검사를 건너뛴다.

**`contact-form/Code.gs`** 상수:
- `NOTIFY` — 알림 수신 주소(`hello@sizlon.io`).
- `FROM_NAME` — 알림 메일의 발신자 표시 이름.
- `FROM_ALIAS` — 선택. 발신에 쓸 Gmail "다른 주소에서 메일 보내기(send-as)" 별칭. 비어
  있으면 소유자 계정으로 발송한다. `hello@`는 `admin@`의 별칭이라 소유자 발송 알림은
  Gmail에서 "me"(자기발송)로 표시된다 — 별도 send-as 별칭을 넣으면 바뀐다. 표시상의
  문제라 비워 두기로 결정함.
- `HOURLY_CAP` — 시간당 최대 알림 메일 수(쿼터 차단기).

**Apps Script → 프로젝트 설정 → 스크립트 속성** (비밀, 레포에 절대 넣지 않음):
- `TURNSTILE_SECRET` — Cloudflare Turnstile secret key. 설정되면 서버가 Turnstile을
  강제한다. 실행 시점에 읽히므로 값 변경은 **재배포 없이** 즉시 반영된다.
- `TURNSTILE_DEBUG` — 아무 값이나 넣으면 Turnstile *실패*를 시트에
  `TURNSTILE-FAIL: <error-codes>`로 기록해 진단에 쓴다. 평상시엔 제거할 것(안 그러면
  잘못된 토큰의 봇이 시트를 채운다).

## 방어 (순서대로, 전부 `Code.gs::doPost`)

1. **허니팟** — 숨은 `company_url` 필드. 채워져 있으면 드롭.
2. **최소 작성시간** — 폼이 `elapsed`(페이지 로드 후 ms)를 스탬프. `< 3000`이면 드롭
   (봇처럼 빠름). 없으면(no-JS) 통과.
3. **검증** — 필수 name/email/message, 이메일 형식.
4. **길이 제한** — 과대 필드 드롭(클라이언트 `maxlength`가 이를 미러링).
5. **Turnstile** — 서버측 `siteverify`. `TURNSTILE_SECRET`이 설정됐을 때만 강제.
6. **시간당 상한** — Gmail 쿼터를 보호하는 전역 발송 차단기. (Apps Script는 `doPost`에
   클라이언트 IP를 안 줘서 IP별 제한은 불가능.)
7. **수식 인젝션 차단** — `= + - @`로 시작하는 셀은 시트에 들어가기 전에 앞에 따옴표를
   붙인다(CSV/Sheets 인젝션).

드롭된 요청도 `ok`를 반환해서 봇이 걸러졌다는 걸 학습하지 못하게 한다.

## 배포 / 재배포

첫 배포: `Code.gs` 상단의 SETUP 블록 참조.

**`Code.gs` 수정 후:** 에디터에 복사(전부 교체) → **배포 → 배포 관리 → 연필(수정) →
버전: 새 버전 → 배포.** 이러면 `/exec` URL이 유지된다. 대신 **새 배포**를 쓰면 *새* URL이
생겨서 `contactFormEndpoint`를 갱신해야 한다.

새 API(예: Turnstile용 `UrlFetchApp`)를 추가하면 새 OAuth 스코프가 필요하다. 에디터에서
`authorizeExternalRequest()`를 한 번 실행하고 권한 창을 수락한 뒤 재배포한다.

## Turnstile 셋업

1. Cloudflare 대시보드에서 Turnstile 위젯 생성. **Hostnames**에 `sizlon.io`(및 테스트용
   호스트네임)를 추가. Mode: Managed.
2. Site key → `site.ts`의 `turnstileSiteKey`(커밋). Secret key → `TURNSTILE_SECRET`
   스크립트 속성.
3. secret에 의존하기 **전에** `UrlFetchApp`이 들어간 `Code.gs`를 배포하고
   `authorizeExternalRequest()`를 실행할 것. 안 그러면 모든 토큰 검증이 예외로 터진다.
4. 활성화엔 두 키가 **모두** 필요. site key만 있으면 위젯은 뜨지만 서버가 강제하지 않아
   (제출은 계속 통과) — 잠김 없음.

클라이언트 동작: 위젯이 `cf-turnstile-response` 토큰을 만들 때까지 제출 핸들러가
`verifyNeeded` 메시지로 막는다. Managed 위젯은 보통 1초 내에 풀리며, 방문자가 먼저
제출하면 기다렸다 재시도해야 한다.

## 엔드포인트 테스트 (curl)

스크립트가 *처리*하든 *조용히 드롭*하든 둘 다 `302` →
`script.googleusercontent.com/.../echo`를 반환한다. `doPost`가 **예외를 던지면**
`200`과 인라인 에러 페이지를 반환한다. 그래서:

```bash
URL=".../exec"
curl -s -o /dev/null -D - -X POST "$URL" \
  --data-urlencode "name=probe" --data-urlencode "email=a@b.co" \
  --data-urlencode "message=probe" --data-urlencode "elapsed=9000" \
  --data-urlencode "company_url=" | grep -i '^HTTP/'
# 302 → 클린 실행(처리 또는 드롭 — 어느 쪽인지는 시트 확인)
# 200 → doPost 예외(본문에서 예외 메시지 확인)
```

curl은 유효한 Turnstile 토큰을 만들 수 **없으므로**, `TURNSTILE_SECRET`이 설정되면 curl
제출은 항상 드롭된다. 해피패스는 실제 브라우저에서 검증할 것. `turnstileVerify_` 안의
`try/catch`가 에러를 삼키므로, 이를 드러내려면 `TURNSTILE_DEBUG`를 쓴다.

## 트러블슈팅

| 증상 | 원인 / 해결 |
|------|-------------|
| 시트엔 행 있는데 메일 없음 | "받은편지함 건너뛰기" Gmail 필터가 라벨로 돌림 + 자기발송 메일이 인박스에서 숨음. `웹 문의` 라벨 / 전체보관함 / 스팸 확인. |
| 제출이 조용히 드롭(행·메일 없음) | Turnstile 오설정. `TURNSTILE_DEBUG` 켜고 한 번 제출 → 시트의 `TURNSTILE-FAIL: <코드>` 확인. |
| `TURNSTILE-FAIL: fetch-error … external_request` | `UrlFetchApp` 스코프 미승인. `authorizeExternalRequest()` 실행·수락 후 재배포. |
| `TURNSTILE-FAIL: invalid-input-secret` | `TURNSTILE_SECRET`이 `turnstileSiteKey` 위젯과 짝이 아님. |
| `TURNSTILE-FAIL: hostname-mismatch` | 위젯 Hostnames에 테스트 도메인 추가. |
| `TURNSTILE-FAIL: timeout-or-duplicate` | 토큰 만료/재사용 — 새로 제출. |
| 제출 시 빨간 "확인이 끝날 때까지…" | 위젯이 아직 토큰을 안 만듦(너무 일찍 제출) 또는 안 풀림(hostname/렌더). 초록 체크 기다리거나 콘솔에서 Turnstile 에러 확인. |
| 작성 전인데 "Thanks…" 표시 | `display` 규칙이 UA `[hidden]` 규칙을 이김(스코프된 `[hidden]{display:none!important}`로 수정됨). |
| 발신자가 "me"로 표시 | 소유자가 같은 계정의 별칭으로 보낸 알림. 표시상의 문제. `FROM_ALIAS`(별도 send-as)로 변경 가능. |
| 코드 수정이 `/exec`에 반영 안 됨 | 저장만 하고 **새 버전** 배포 안 함(배포 관리), 또는 **새 배포**를 만듦(URL 바뀜). |

## 데이터 & 프라이버시

제출은 Google Sheet와 Gmail에 저장된다 — 소유자의 Workspace 안. 개인정보처리방침
(`content.ts` → `legal.privacy`)이 스팸 방지용 Cloudflare Turnstile을 고지한다. 백엔드를
제3자 폼 서비스로 옮기면 "제공·위탁" / "수집 항목" 항목을 그에 맞게 갱신할 것.
