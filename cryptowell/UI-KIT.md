# 🎨 UPTNStation UI Kit
> 실제 서비스 화면 분석 기반 · 최종 업데이트 2026.06.05  
> 폰트: **SUIT Variable** · 앱: 웹뷰 풀스크린 (100vw × 100vh)

---

## 📌 목차

1. [Color Palette](#1-color-palette)
2. [Typography](#2-typography)
3. [Spacing & Layout](#3-spacing--layout)
4. [Border Radius](#4-border-radius)
5. [Shadow](#5-shadow)
6. [Button](#6-button)
7. [Input Field](#7-input-field)
8. [Card](#8-card)
9. [Bottom Sheet](#9-bottom-sheet)
10. [Tab Bar](#10-tab-bar)
11. [Badge & Chip](#11-badge--chip)
12. [Attendance Oval](#12-attendance-oval)
13. [List Item](#13-list-item)
14. [Empty State](#14-empty-state)
15. [FAB](#15-fab)
16. [UP 아이콘 사용 규칙](#16-up-아이콘-사용-규칙)
17. [디자인 원칙](#17-디자인-원칙)

---

## 1. Color Palette

### Primary

| 역할 | 토큰 | HEX | 미리보기 |
| :--- | :--- | :--- | :--- |
| Primary | `--primary` | `#5F46FF` | 🟣 |
| Primary Dark (Pressed) | `--primary-dark` | `#4A35E0` | 🟣 |
| Primary Light (BG) | `--primary-light` | `#EEEAFF` | 🔵 |
| Primary 200 (Secondary BG) | `--primary-200` | `#F2F0FF` | 🔵 |
| Primary Dim (10%) | `--primary-dim` | `rgba(95,70,255,0.10)` | — |

### Background

| 역할 | 토큰 | HEX | 사용처 |
| :--- | :--- | :--- | :--- |
| App Background | `--app-bg` | `#F4F3FF` | 전체 앱 배경 **시그니처 컬러** |
| Card Background | `--card-bg` | `#FFFFFF` | 카드, 바텀시트 |
| Muted Background | `--muted-bg` | `#F5F5F8` | 비활성 영역, Gray 버튼 배경 |

### Text

| 역할 | 토큰 | HEX | 사용처 |
| :--- | :--- | :--- | :--- |
| Text Primary | `--text-1` | `#111827` | 제목, 주요 본문, 숫자 |
| Text Secondary | `--text-2` | `#6B7280` | 부제목, 설명, 날짜 |
| Text Muted | `--text-3` | `#9CA3AF` | 비활성 탭, placeholder |
| Text Link | — | `#5F46FF` | 링크, 강조 텍스트 (Primary 동일) |

### Semantic

| 역할 | HEX | 사용처 |
| :--- | :--- | :--- |
| Success | `#10B981` | "응모 완료" 뱃지, 완료 상태 |
| Error | `#EF4444` | 오류, 상승 시세 (한국 증권 관례) |
| Border | `#E5E7EB` | 카드·인풋 기본 테두리 |
| Border Focus | `#5F46FF` | 인풋 포커스 테두리 |
| Overlay | `rgba(0,0,0,0.50)` | 바텀시트 딤 레이어 |

### CSS 변수 선언

```css
:root {
  --primary:       #5F46FF;
  --primary-dark:  #4A35E0;
  --primary-light: #EEEAFF;
  --primary-200:   #F2F0FF;
  --primary-dim:   rgba(95,70,255,0.10);
  --app-bg:        #F4F3FF;
  --card-bg:       #FFFFFF;
  --muted-bg:      #F5F5F8;
  --border:        #E5E7EB;
  --text-1:        #111827;
  --text-2:        #6B7280;
  --text-3:        #9CA3AF;
  --success:       #10B981;
  --error:         #EF4444;
}
```

---

## 2. Typography

> 폰트 로드: `https://cdn.jsdelivr.net/gh/sunn-us/SUIT/fonts/variable/SUIT-Variable.min.css`

```css
body {
  font-family: 'SUIT Variable', 'SUIT', -apple-system, sans-serif;
}
```

### Type Scale

| 스타일 | Size | Weight | Letter-spacing | 색상 | 용도 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Display** | 36px | 700 | -0.5px | `#111827` | 지갑 잔액 숫자 |
| **Title 1** | 28px | 700 | -0.3px | `#111827` | 화면 대표 숫자 |
| **Title 2** | 22px | 700 | -0.3px | `#111827` | 바텀시트 제목 |
| **Title 3** | 18px | 700 | -0.3px | `#111827` | 바텀시트 헤더, 섹션 헤더 |
| **Title 4** | 16px | 700 | -0.3px | `#111827` | 카드 제목, 버튼 텍스트 |
| **Body 1** | 15px | 400 | 0 | `#111827` | 일반 본문 |
| **Body 2** | 14px | 400 | 0 | `#6B7280` | 서브 본문, 설명 |
| **Caption 1** | 13px | 400 | -0.2px | `#6B7280` | 작은 설명, 날짜 |
| **Caption 2** | 12px | 400 | -0.2px | `#9CA3AF` | 최소 레이블 |

---

## 3. Spacing & Layout

> **4px Base Grid** 사용

| 토큰 | 값 | 사용처 |
| :--- | :--- | :--- |
| `space-1` | 4px | 최소 간격 |
| `space-2` | 8px | 뱃지 패딩, 인접 요소 간격 |
| `space-3` | 12px | 카드 내부 요소 간격 |
| `space-4` | 16px | 카드 패딩 |
| `space-5` | 20px | 화면 좌우 여백 |
| `space-6` | 24px | 섹션 간격, 바텀시트 패딩 |
| `space-8` | 32px | 큰 섹션 구분 |

### App Shell 레이아웃 (웹뷰 풀스크린)

```
┌──────────────────────────┐
│   Header (56px)          │  bg: #FFFFFF, border-bottom: 1px #E5E7EB
├──────────────────────────┤
│   Top Tab Bar (46px)     │  bg: #FFFFFF, border-bottom: 1px #E5E7EB
├──────────────────────────┤
│                          │
│   Tab Content            │  flex: 1, overflow-y: auto
│   (스크롤 영역)           │  bg: #F4F3FF
│                          │
│   ┌──────────────────┐   │
│   │  Bottom CTA      │   │  position: absolute; bottom: 0
│   │  (48px + safe)   │   │  padding: 12px 24px + safe-area-inset-bottom
│   └──────────────────┘   │
└──────────────────────────┘
```

> **웹뷰**: `#app { position: fixed; inset: 0; width: 100%; height: 100%; }`  
> **iOS safe area**: `viewport-fit=cover` + `env(safe-area-inset-bottom)` 적용

---

## 4. Border Radius

| 토큰 | 값 | 사용처 |
| :--- | :--- | :--- |
| `radius-sm` | 8px | 작은 뱃지 |
| `radius-md` | 12px | **버튼**, 인풋 필드, 정보 행 카드 |
| `radius-lg` | 16px | **카드** |
| `radius-xl` | 20px | 큰 카드 |
| `radius-2xl` | 24px | **바텀시트** 상단 |
| `radius-full` | 9999px | pill 버튼, 뱃지, 아이콘 |

---

## 5. Shadow

| 레벨 | CSS | 사용처 |
| :--- | :--- | :--- |
| **Level 0** | `none` | 기본 |
| **Level 1** | `0 1px 4px rgba(0,0,0,0.06)` | **카드**, 리스트 아이템 |
| **Level 2** | `0 4px 16px rgba(0,0,0,0.10)` | 드롭다운 |
| **Level 3** | `0 -4px 24px rgba(0,0,0,0.10)` | **바텀시트** |
| **FAB** | `0 4px 20px rgba(0,0,0,0.25)` | 플로팅 액션 버튼 |

---

## 6. Button

### 6-1. Primary — Full Width CTA

> 화면의 주요 행동(CTA). 항상 Full Width.

```
배경:    #5F46FF
텍스트:  #FFFFFF · 16px · 700
높이:    56px
Radius:  12px
Width:   100%
Pressed: background → #4A35E0
Hover:   색상 변경 없음 (웹뷰에서 hover 효과 사용 안 함)
```

```css
.btn-primary {
  width: 100%; height: 56px;
  background: #5F46FF; color: #FFFFFF;
  font-size: 16px; font-weight: 700; letter-spacing: -0.3px;
  border-radius: 12px; border: none; cursor: pointer;
}
.btn-primary:active { background: #4A35E0; }
```

---

### 6-2. Primary Medium — 나란히 배치형

> 두 개 버튼이 나란히 놓일 때.

```
배경:    #5F46FF
텍스트:  #FFFFFF · 15px · 600
높이:    48px
Radius:  12px
Width:   flex: 1 (gap: 10px)
```

```css
.btn-row { display: flex; gap: 10px; }

.btn-primary-md {
  flex: 1; height: 48px;
  background: #5F46FF; color: #FFFFFF;
  font-size: 15px; font-weight: 600; letter-spacing: -0.3px;
  border-radius: 12px; border: none; cursor: pointer;
}
```

---

### 6-3. Secondary — Primary200 배경

> Result CTA 좌측 버튼 등 Primary와 나란히 배치되는 보조 버튼.

```
배경:    #F2F0FF  (--primary-200)
텍스트:  #5F46FF  (--primary)
높이:    48px
Radius:  12px
Width:   flex: 1
```

```css
.btn-secondary {
  flex: 1; height: 48px;
  background: #F2F0FF; color: #5F46FF;
  font-size: 15px; font-weight: 700; letter-spacing: -0.3px;
  border-radius: 12px; border: none; cursor: pointer;
}
```

**Result CTA 패턴 예시 (다시 뽑기 / 확인)**
```html
<div class="btn-row">
  <button class="btn-secondary">다시 뽑기</button>
  <button class="btn-primary-md">확인</button>
</div>
```

---

### 6-4. Gray — 보조 액션

> 사진 저장, 공유하기 등 낮은 위계의 액션 버튼.

```
배경:    #F5F5F8  (--muted-bg)
텍스트:  #6B7280  (--text-2)
테두리:  1px solid #E5E7EB
높이:    44px
Radius:  12px
Width:   flex: 1
```

```css
.btn-gray {
  flex: 1; height: 44px;
  background: #F5F5F8; color: #6B7280;
  border: 1px solid #E5E7EB;
  font-size: 13px; font-weight: 600; letter-spacing: -0.3px;
  border-radius: 12px; cursor: pointer;
}
```

```html
<div class="btn-row">
  <button class="btn-gray">📥 사진 저장</button>
  <button class="btn-gray">📤 공유하기</button>
</div>
```

---

### 6-5. Outline Pill — 소형

```
배경:    #F5F5F8
테두리:  1px solid #E5E7EB
텍스트:  #374151 · 14px · 500
높이:    40px
Radius:  9999px
Padding: 0 20px
```

```css
.btn-outline-pill {
  height: 40px; padding: 0 20px;
  background: #F5F5F8; border: 1px solid #E5E7EB;
  color: #374151; font-size: 14px; font-weight: 500;
  border-radius: 9999px; cursor: pointer;
}
```

---

### 6-6. Text Button

```
배경:    transparent
텍스트:  #5F46FF · 15px · 500
```

```css
.btn-text {
  background: none; border: none;
  color: #5F46FF; font-size: 15px; font-weight: 500;
  cursor: pointer; padding: 0 4px;
}
```

---

### 버튼 높이 요약

| 종류 | 높이 | 용도 |
| :--- | :--- | :--- |
| Primary CTA | 56px | 화면 단독 주요 액션 |
| Primary Medium / Secondary | 48px | 나란히 배치 CTA |
| Gray | 44px | 저위계 보조 액션 |
| Outline Pill | 40px | 소형 보조 액션 |

---

## 7. Input Field

```
배경:         #FFFFFF
테두리:       1.5px solid #E5E7EB
Radius:       12px
높이:         52px
Padding:      0 44px 0 16px
Font:         15px · 400 · #111827
Placeholder:  #9CA3AF
Focus 테두리: 2px solid #5F46FF
```

```css
.input-field {
  width: 100%; height: 52px;
  padding: 0 44px 0 16px;
  background: #FFFFFF; border: 1.5px solid #E5E7EB;
  border-radius: 12px; font-size: 15px; color: #111827; outline: none;
}
.input-field:focus { border: 2px solid #5F46FF; }
.input-field::placeholder { color: #9CA3AF; }
```

---

## 8. Card

### 8-1. Standard Card

```
배경:     #FFFFFF
Radius:   16px
Padding:  16px
Shadow:   Level 1
```

```css
.card {
  background: #FFFFFF; border-radius: 16px;
  padding: 16px; box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
```

---

### 8-2. Info Row Card

```
배경:     #FFFFFF
테두리:   1px solid #E5E7EB
Radius:   12px
Padding:  14px 16px
레이아웃: 좌측 레이블 + 우측 값 (space-between)
```

```css
.info-row-card {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 16px; background: #FFFFFF;
  border: 1px solid #E5E7EB; border-radius: 12px;
}
.info-row-label { font-size: 14px; color: #6B7280; }
.info-row-value { font-size: 14px; font-weight: 600; color: #111827; }
```

---

## 9. Bottom Sheet

> 화면 하단에서 슬라이드업으로 올라오는 시트.

```
오버레이:      rgba(0,0,0,0.50)
시트 배경:     #FFFFFF
상단 Radius:   24px 24px 0 0
Width:         100%
Padding:       12px 12px 28px
Shadow:        0 -4px 24px rgba(0,0,0,0.10)
Handle:        36×4px · #E5E7EB · 상단 중앙
헤더:          타이틀(18px·700) + 우측 X 닫기 버튼 (30×30px 원형)
애니메이션:    translateY(100%) → translateY(0), 0.3s cubic-bezier(.32,1,.55,1)
```

```css
/* 딤 오버레이 */
.bs-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.50);
  display: flex; align-items: flex-end;
  z-index: 200;
}

/* 시트 */
.bs-sheet {
  width: 100%;
  background: #FFFFFF;
  border-radius: 24px 24px 0 0;
  padding: 12px 12px 28px;
  box-shadow: 0 -4px 24px rgba(0,0,0,0.10);
  display: flex; flex-direction: column; align-items: center; gap: 16px;
  transform: translateY(100%);
  transition: transform .3s cubic-bezier(.32,1,.55,1);
}
.bs-sheet.open { transform: translateY(0); }

/* 핸들 */
.bs-handle {
  width: 36px; height: 4px;
  background: #E5E7EB; border-radius: 2px;
}

/* 헤더 행 */
.bs-header {
  display: flex; align-items: center; justify-content: space-between;
  width: 100%; padding: 0 8px;
}
.bs-title { font-size: 18px; font-weight: 700; letter-spacing: -0.3px; }
.bs-close {
  width: 30px; height: 30px; border-radius: 50%;
  background: #F5F5F8; border: 1px solid #E5E7EB;
  font-size: 13px; color: #6B7280; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
```

```html
<div class="bs-overlay">
  <div class="bs-sheet open">
    <div class="bs-handle"></div>
    <div class="bs-header">
      <span class="bs-title">📜 부적 상세</span>
      <button class="bs-close">✕</button>
    </div>
    <!-- 시트 콘텐츠 -->
    <button class="btn-primary">확인</button>
  </div>
</div>
```

> Vue 구현 시 마운트 후 `requestAnimationFrame`으로 `.open` 클래스를 추가해 슬라이드업 트리거

---

## 10. Tab Bar

### 10-1. Top Tab Bar (앱 상단 탭)

> 앱 헤더 바로 아래 위치. 화면 전환용.

```
전체 높이:      46px
배경:           #FFFFFF
하단 구분선:    1px solid #E5E7EB
활성 텍스트:    #111827 · 15px · 700
활성 인디케이터: 하단 2px solid #111827
비활성 텍스트:  #9CA3AF · 15px · 400
```

```css
.top-tabs {
  height: 46px; display: flex;
  background: #FFFFFF; border-bottom: 1px solid #E5E7EB; flex-shrink: 0;
}
.top-tab {
  flex: 1; border: none; background: none;
  font-size: 15px; font-weight: 400; color: #9CA3AF; cursor: pointer; position: relative;
}
.top-tab.active { font-weight: 700; color: #111827; }
.top-tab.active::after {
  content: ''; position: absolute; bottom: 0; left: 10%; right: 10%;
  height: 2px; background: #111827; border-radius: 2px 2px 0 0;
}
```

---

### 10-2. Content Tab Bar (화면 내 탭)

```
전체 높이:    48px
활성:         #111827 · 16px · 700 + 하단 2px 인디케이터
비활성:       #9CA3AF · 16px · 400
```

```css
.tab-bar { display: flex; border-bottom: 1px solid #F3F4F6; background: #FFFFFF; }
.tab-item {
  flex: 1; height: 48px; background: none; border: none;
  font-size: 16px; font-weight: 400; color: #9CA3AF; cursor: pointer; position: relative;
}
.tab-item.active { font-weight: 700; color: #111827; }
.tab-item.active::after {
  content: ''; position: absolute; bottom: 0; left: 10%; right: 10%;
  height: 2px; background: #111827; border-radius: 2px;
}
```

---

## 11. Badge & Chip

### Badge

| 종류 | 배경 | 텍스트 | Radius | 용도 |
| :--- | :--- | :--- | :--- | :--- |
| **Success** | `#10B981` | `#FFFFFF` · 12px · 600 | 6px | "응모 완료" |
| **Primary** | `#5F46FF` | `#FFFFFF` · 11px · 600 | 6px | "추천" |
| **Count** | `rgba(0,0,0,0.35)` | `#FFFFFF` · 12px · 600 | 9999px | "+51" |
| **Error** | `#EF4444` | `#FFFFFF` · 12px · 600 | 6px | 오류 |

```css
.badge-success { background: #10B981; color: #fff; font-size: 12px; padding: 3px 9px; border-radius: 6px; }
.badge-primary { background: #5F46FF; color: #fff; font-size: 11px; padding: 3px 9px; border-radius: 6px; }
.badge-count   { background: rgba(0,0,0,0.35); color: #fff; font-size: 12px; padding: 3px 10px; border-radius: 9999px; }
.badge-error   { background: #EF4444; color: #fff; font-size: 12px; padding: 3px 9px; border-radius: 6px; }
```

---

### Chip (필터)

```
기본:   border 1.5px solid #5F46FF · 텍스트 #5F46FF · bg transparent
활성:   bg #5F46FF · 텍스트 #FFFFFF
크기:   13px · 500 · padding 6px 14px · radius 9999px
```

```css
.chip { border: 1.5px solid #5F46FF; color: #5F46FF; font-size: 13px; font-weight: 500; border-radius: 9999px; padding: 6px 14px; background: transparent; cursor: pointer; }
.chip.active { background: #5F46FF; color: #FFFFFF; }
```

---

## 12. Attendance Oval

```css
.oval { border-radius: 9999px; padding: 14px 18px; min-width: 66px; text-align: center; }

.oval-active { background: linear-gradient(135deg, #A78BFF, #5F46FF); border: none; }
.oval-active .oval-label { font-size: 12px; font-weight: 700; color: #5F46FF; }
.oval-active .oval-num   { font-size: 22px; font-weight: 800; color: #5F46FF; }
.oval-active .oval-unit  { font-size: 11px; font-weight: 600; color: #5F46FF; }

.oval-inactive { background: transparent; border: 1.5px dashed #D1D5DB; }
.oval-inactive .oval-label { font-size: 12px; font-weight: 500; color: #9CA3AF; }
.oval-inactive .oval-num   { font-size: 22px; font-weight: 700; color: #111827; }
.oval-inactive .oval-unit  { font-size: 11px; color: #9CA3AF; }
```

---

## 13. List Item

```
배경:     #FFFFFF · Radius 16px · Padding 16px · Shadow Level 1
썸네일:   48×48px · radius 12px · bg #EEEAFF
```

```css
.list-item { display: flex; align-items: center; gap: 12px; background: #FFFFFF; border-radius: 16px; padding: 16px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
.list-thumb { width: 48px; height: 48px; border-radius: 12px; background: #EEEAFF; display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0; }
.list-info  { flex: 1; min-width: 0; }
.list-title { font-size: 15px; font-weight: 600; letter-spacing: -0.2px; color: #111827; }
.list-sub   { font-size: 13px; color: #6B7280; margin-top: 2px; }
.list-arrow { font-size: 14px; color: #9CA3AF; }
```

---

## 14. Empty State

```
레이아웃:  flex column · center · padding 40px 20px
아이콘:    48px · opacity 0.35
제목:      16px · 700 · #6B7280
설명:      14px · 400 · #9CA3AF
```

```css
.empty-state { display: flex; flex-direction: column; align-items: center; padding: 40px 20px; gap: 10px; }
.empty-icon  { font-size: 48px; opacity: .35; }
.empty-text  { font-size: 16px; font-weight: 700; color: #6B7280; }
```

---

## 15. FAB

```
배경:    #1F2937
크기:    52×52px · radius 9999px
Shadow:  0 4px 20px rgba(0,0,0,0.25)
```

```css
.fab {
  background: #1F2937; width: 52px; height: 52px;
  border-radius: 9999px; box-shadow: 0 4px 20px rgba(0,0,0,.25);
  display: flex; align-items: center; justify-content: center; border: none; cursor: pointer;
}
```

---

## 16. UP 아이콘 사용 규칙

> UP 포인트를 표시하는 **모든 곳**에 `/public/up-icon.png` 파일을 사용합니다.

| 적용 위치 | 크기 | 비고 |
| :--- | :--- | :--- |
| 헤더 잔액 표시 | 18×18px | 숫자 좌측 |
| 던지기 버튼 내 아이콘 | 22×22px | 버튼 텍스트 좌측 |
| 동전 투척 애니메이션 | 28×28px | 우물 위 코인 요소 |

**규칙**
- 텍스트 `"UP"` 단독 사용 **금지** — 반드시 이미지 + 숫자 조합으로 표시
- `object-fit: contain` 적용 필수
- 배경이 있는 영역에서는 `--primary-200` 컨테이너 안에 배치

```html
<!-- 헤더 잔액 -->
<div style="display:flex;align-items:center;gap:4px;background:#F2F0FF;border-radius:20px;padding:4px 10px">
  <img src="/up-icon.png" style="width:18px;height:18px;object-fit:contain" alt="UP" />
  <span style="font-size:14px;font-weight:700;color:#5F46FF">1,000</span>
</div>

<!-- 버튼 내 아이콘 -->
<button class="btn-primary">
  <img src="/up-icon.png" style="width:22px;height:22px;object-fit:contain" alt="UP" />
  10 UP 던지기
</button>
```

---

## 17. 디자인 원칙

| # | 원칙 | 내용 |
| :--- | :--- | :--- |
| 1 | **앱 배경** | `#F4F3FF` 라벤더 그레이 — 서비스 고유 아이덴티티, 절대 변경 금지 |
| 2 | **Primary** | `#5F46FF` 단일 컬러 — 버튼·포커스·링크·강조 전반 통일 |
| 3 | **Hover 없음** | 웹뷰 특성상 버튼 hover 색 변경 사용 안 함. active(pressed)만 적용 |
| 4 | **카드 분리** | 흰 카드 + Level 1 그림자로 배경에서 분리, 별도 테두리 불필요 |
| 5 | **버튼 높이** | CTA `56px` · Medium/Secondary `48px` · Gray `44px` · Pill `40px` — 고정값 준수 |
| 6 | **Secondary 버튼** | `#F2F0FF` 배경 + `#5F46FF` 텍스트 — Primary와 나란히 배치 시 사용 |
| 7 | **UP 아이콘** | 텍스트 "UP" 단독 금지. `/public/up-icon.png` 이미지 필수 사용 |
| 8 | **바텀시트** | `border-radius: 24px 24px 0 0` · 슬라이드업 애니메이션 필수 |
| 9 | **웹뷰 레이아웃** | `#app` 풀스크린 + `viewport-fit=cover` + `safe-area-inset-bottom` 대응 |
| 10 | **화면 여백** | 좌우 `24px` Screen Margin |

---

## 참고 파일

| 파일 | 설명 |
| :--- | :--- |
| `ui-kit.html` | 모든 컴포넌트 실제 렌더링 확인 (브라우저에서 열기) |

---

*디자인 변경 시 본 문서(`UI-KIT.md`)와 `ui-kit.html`을 함께 업데이트 해주세요.*
