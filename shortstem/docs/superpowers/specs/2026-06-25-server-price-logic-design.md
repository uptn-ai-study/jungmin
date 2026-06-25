# 서버 가격 로직 개선 설계

날짜: 2026-06-25

---

## 목표

Gemini 프롬프트의 price 필드 정의를 구체화하여 가격 추출 정확도를 높인다.
description 잘림 한도를 늘려 더 많은 컨텍스트를 Gemini에 제공한다.

---

## 범위

| 변경 | 파일 | 위치 |
|------|------|------|
| description 슬라이스 2000 → 4000 | `server.js` | `analyzeWithGemini` 함수 내 프롬프트 |
| Gemini price 필드 재정의 | `server.js` | `analyzeWithGemini` 함수 내 프롬프트 |

변경 파일: **`server.js` 하나.**

---

## 변경 1: description 4000자

### 현재
```js
${description.slice(0, 2000)}
```

### 변경 후
```js
${description.slice(0, 4000)}
```

---

## 변경 2: Gemini price 필드 재정의

### 현재 프롬프트 (price / priceSource 관련 부분)
```
- price: 원 단위 정수. 설명/자막/댓글에 가격이 명시되면 그 값. 없으면 학습 데이터 기반 시세 추정. 0이면 안 됨.
- priceSource: "description"(설명/자막 명시), "comment"(댓글 언급), "known"(AI 시세 파악), "estimated"(추정)
```

### 변경 후
```
- price: 원 단위 정수. 아래 우선순위대로 결정:
  1순위: 설명 또는 자막에 가격이 명시된 경우 → priceSource: "description"
  2순위: 댓글에 가격이 언급된 경우 → priceSource: "comment"
  3순위: AI가 확실히 알고 있는 공식 판매가 (다이소 균일가, 올리브영 정가 등 변하지 않는 가격) → priceSource: "known"
  4순위: 유사 상품 시세 기반 추정 (상품은 특정되나 정확한 가격 모를 때) → priceSource: "estimated"
  가격이 0이면 안 됨.
- priceSource: 위 우선순위에 따라 "description" / "comment" / "known" / "estimated" 중 하나
```

### 변경 의도
- 기존 `known`과 `estimated` 구분이 모호해 Gemini가 혼용함
- `known` = AI가 확실히 아는 공식 가격, `estimated` = 추정치로 명확히 분리
- 우선순위 명시로 출처가 있을 때 추정을 쓰지 않도록 유도

---

## 검증 방법

서버 재시작 후 아래 영상 유형으로 분석 테스트:
1. 설명에 가격 명시된 영상 → priceSource: "description" 반환 확인
2. 다이소 영상 → priceSource: "known", 가격 1000/2000/3000원 확인
3. 가격 정보 없는 영상 → priceSource: "estimated" 반환 확인
