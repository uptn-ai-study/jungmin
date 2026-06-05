# Figma MCP 연결 가이드

> Claude Code에서 Figma 파일을 직접 읽고 코드로 변환하기 위한 MCP 연결 방법

---

## 사전 준비

- [Claude Code](https://claude.ai/code) 설치 완료
- Figma 계정 (접근할 파일의 권한이 있는 계정)

---

## 1단계 — Figma MCP 서버 추가

Claude Code 터미널에서 `/mcp` 입력 후 **Add MCP Server** 선택.

아래 정보로 서버를 추가합니다:

| 항목 | 값 |
| :--- | :--- |
| Name | `figma` |
| Type | `http` |
| URL | `https://mcp.figma.com/mcp` |

> 이미 추가되어 있다면 이 단계는 건너뜁니다.

---

## 2단계 — Figma 계정 인증

1. `/mcp` → Figma 서버 선택 → **Re-authenticate** 클릭
2. 터미널에 아래와 같은 인증 URL이 출력됩니다:

```
https://www.figma.com/oauth/mcp?response_type=code&client_id=...
```

3. **브라우저에서 Figma에 먼저 원하는 계정으로 로그인** 되어 있는지 확인
4. 위 URL을 브라우저 주소창에 붙여넣어 열기
5. Figma 승인 화면에서 **Allow** 클릭
6. 브라우저가 `localhost` 페이지로 이동 (페이지가 안 열려도 정상)
7. 주소창의 URL(`http://localhost:xxxxx/callback?code=...`)을 Claude에게 붙여넣기

> **계정 주의**: 인증 시 브라우저에 로그인된 Figma 계정으로 연결됩니다.  
> 다른 계정으로 연결하려면 Figma에서 로그아웃 → 재로그인 후 Re-authenticate 진행.

---

## 3단계 — 연결 확인

Claude에게 아래와 같이 물어보면 연결된 계정을 확인할 수 있습니다:

```
지금 연결된 Figma 계정이 뭐야?
```

또는 Claude가 자동으로 `whoami`를 실행해 계정 이메일과 팀 목록을 보여줍니다.

---

## 4단계 — Figma 파일 활용

연결 후 Figma URL을 붙여넣으면 Claude가 직접 디자인을 읽어 코드로 변환해 줍니다.

**활용 예시:**

```
이 Figma 페이지에서 디자인 토큰(색상, 타이포그래피, 간격)을 추출하고
tokens.css 파일로 만들어줘.

Figma URL: https://www.figma.com/design/xxxxx?node-id=xxxx
```

```
이 컴포넌트를 Vue3 코드로 변환해줘.

Figma URL: https://www.figma.com/design/xxxxx?node-id=xxxx
```

---

## 자주 겪는 문제

| 증상 | 해결 방법 |
| :--- | :--- |
| 인증 URL이 터미널에 안 뜸 | `/mcp` → Figma → **Re-authenticate** 다시 시도 |
| 다른 계정으로 바꾸고 싶음 | 브라우저에서 Figma 계정 전환 후 Re-authenticate |
| "nothing selected" 오류 | Figma 데스크탑 앱에서 해당 레이어 선택 후 재시도 |
| Rate limit 오류 | Figma Starter 플랜은 MCP 호출 횟수 제한 있음 |

---

## 참고

- Figma MCP 공식 문서: [https://mcp.figma.com](https://mcp.figma.com)
- Claude Code MCP 설정: `/mcp` 명령어로 관리
