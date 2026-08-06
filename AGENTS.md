# Repository Guidelines

## Project Structure & Module Organization

This repository is a dependency-free static SPA. `index.html` defines the page shell and must remain at the repository root. Application behavior lives in `js/app.js`; curriculum content, question IDs, and session metadata live in `data/content.js`. All styling, including responsive and dark-theme rules, is in `css/app.css`. Photo exercises use `images/01.png` through `images/12.png`. `vendor/jszip.min.js` supports JSON/audio ZIP backup and restore. Change logs and validation notes are stored as root-level `.txt` files. There is currently no dedicated test directory or generated build output.

## Build, Test, and Development Commands

No build step or package installation is required.

```powershell
python -m http.server 8000 --bind 127.0.0.1
```

Run the app at `http://127.0.0.1:8000`. Do not open `index.html` with `file://`; microphone access may fail.

```powershell
node --check js/app.js
node --check data/content.js
```

These commands perform non-mutating JavaScript syntax checks. After UI changes, manually test desktop and widths `360`, `390`, `412`, and `430` px. Verify the browser console has no errors.

## Coding Style & Naming Conventions

Use two-space indentation in HTML, CSS, and JavaScript. Follow the existing plain JavaScript style: `const`/`let`, semicolons, single-quoted strings, camelCase functions and variables, and UPPER_SNAKE_CASE constants. Keep DOM IDs descriptive and unique. Preserve question/session IDs unless content changes; new or revised questions need new stable IDs to prevent old records from being overwritten. Add responsive overrides near the relevant existing media-query section and check for later rules that may override them.

## Testing Guidelines

There is no automated test framework or coverage target. At minimum, test course navigation, question reveal/TTS, draft and evaluation saving, session completion, theme changes, and JSON backup. On HTTPS or localhost, also test microphone permission, both recording takes, playback, deletion, and ZIP backup/restore. Back up browser data before destructive storage tests.

## Commit & Pull Request Guidelines

No Git history is included here, so no repository-specific commit convention can be inferred. Use short imperative messages such as `Fix mobile task navigation`. Pull requests should describe scope, affected files, manual test results, storage compatibility, and include screenshots for desktop/mobile visual changes. Explicitly call out any question-ID, storage-key, or backup-format change.

## Data & Compatibility Safeguards

Do not rename localStorage keys, IndexedDB database/store names, or change the script order `jszip.min.js` → `content.js` → `app.js`. Preserve the 12 protected photo assets and their grouped question ordering. Keep legacy-state migration and resource cleanup for speech, microphone tracks, and object URLs intact.

# 응답 스타일

- 사용자에게 친근하고 자연스러운 한국어로 말한다.
- 딱딱한 보고서체나 지나치게 짧은 개발자식 표현을 피한다.
- 사용자는 코딩 초보이므로 전문용어는 쉬운 말로 함께 설명한다.
- 결론을 먼저 말하고, 이후 필요한 절차를 순서대로 설명한다.
- 변경 결과는 다음 순서로 정리한다.
  1. 무엇을 바꿨는지
  2. 사용자가 확인할 부분
  3. 남아 있는 문제
- 불필요하게 장황하지 않되 중요한 내용은 생략하지 않는다.

# 작업 원칙

- 기존 기능과 데이터를 임의로 삭제하거나 변경하지 않는다.
- 수정 전 관련 코드를 충분히 분석한다.
- 요청 범위를 벗어난 리팩터링은 하지 않는다.
- 파일 삭제, 대규모 구조 변경, 배포 전에는 사용자에게 먼저 알린다.
- 수정 후 가능한 범위에서 직접 실행하고 테스트한다.
