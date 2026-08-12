# 키보드 소리 시뮬레이터 (Electron)

Windows에서 이 앱을 켜두면, 이어폰을 낀 채로 어떤 프로그램에서 타이핑하든 선택한
사운드팩의 키보드 클릭음이 재생됩니다. 실제 키 입력은 절대 막지 않습니다.

앱을 실행하면 마스코트, 사운드팩 목록, 볼륨 슬라이더가 있는 설정 창이 바로 뜹니다.
사운드팩은 "스위치 계열"/"브랜드" 두 탭으로 나뉘어 있고, 원하는 팩을 아무 탭에서나
골라 클릭하면 바로 적용됩니다. 창을 닫아도 트레이 아이콘을 더블클릭하면 다시 열 수
있고, 트레이 메뉴에서는 음소거/종료만 가능합니다.

Mechvibes(MIT License)의 오디오 재생 방식/사운드팩 포맷을 참고했습니다 — 자세한
내용은 `NOTICE.md` 참고.

## 시작하기

```bash
# 1. 의존성 설치
npm install

# 2. 개발 모드 실행
npm run dev

# 3. 린트 + 테스트
npm run lint && npm run test
```

> Windows 11은 새로 뜬 트레이 아이콘을 기본적으로 시계 옆 `^`(숨겨진 아이콘) 안에
> 넣습니다 — 앱이 실행됐는데 트레이에 아이콘이 안 보이면 `^`를 클릭해서 확인하세요.

`src/packConfig.js`, `src/settingsStore.js`, `src/keyHook.js`의 로직은 자동 테스트로
검증합니다. 트레이 메뉴 조작, 실제 오디오 출력, 연타 시 겹침 재생 여부는 `npm run dev`를
직접 실행해 사람이 확인해야 합니다.

## 사운드팩 교체/추가하기

각 사운드팩은 `packs/<팩이름>/` 폴더 안에 오디오 파일 하나(`sound.wav` 등)와
`config.json` 하나로 구성됩니다. 예시 (`packs/청축/config.json`):

```json
{
  "id": "청축",
  "name": "청축 (Cherry MX Blue 느낌)",
  "sound": "sound.wav",
  "variants": [[0, 90], [140, 70], [260, 95], [405, 95]],
  "category": "switch",
  "license": "Creative Commons 0 (CC0)",
  "attribution": "freesound.org - ... (출처 URL)"
}
```

- `id`: 팩 고유 식별자.
- `name`: 설정 창에 표시되는 이름.
- `sound`: 팩 폴더 안의 오디오 파일 이름.
- `variants`: `[시작ms, 길이ms]` 쌍의 배열. 키를 누를 때마다 이 목록 중 하나를
  무작위로(직전에 재생한 것과 겹치지 않게) 골라 재생합니다 — 특정 키에 특정 소리를
  매핑하는 방식이 아니라, 오디오 파일 안에 이어붙인 여러 타건 구간 중 하나를 매번
  랜덤 재생하는 방식입니다.
- `category`: `"switch"` 또는 `"brand"`. 설정 창의 어느 탭("스위치 계열"/"브랜드")에
  표시될지 결정합니다.
- `license`, `attribution`: 오디오 출처 표기(CC0 등 사용 시 참고용, `NOTICE.md`에도
  정리해두는 것을 권장).

### 새 팩 추가하기 (자동 — 오디오만 있으면 됨)

`variants`의 시작/길이(ms)를 직접 계산해서 손으로 쓸 필요 없습니다. 개별 타건음 클립만
준비하면 `scripts/addPack.js`가 이어붙이기 + 구간 계산까지 다 해줍니다 (ffmpeg 필요).

1. `raw-audio/<팩이름>/clips/` 폴더에 개별 타건음 클립(`.wav`)들을 넣는다 (파일명 순서대로
   이어붙여짐 — `c1.wav`, `c2.wav`, ... 식으로 이름 붙이는 걸 권장).
2. 실행: `npm run add-pack <팩이름>`
   — `packs/<팩이름>/sound.wav`와 `config.json`(variants 포함)이 자동 생성된다.
3. 앱을 재시작하면 설정 창의 해당 카테고리 탭에 새 팩이 자동으로 나타난다.

`name`/`category`/`license`/`attribution`처럼 오디오만으로는 알 수 없는 값은
`config.json`에 직접 채워 넣으면 되고, 이후 같은 팩에 `npm run add-pack`을 다시 돌려도
그 값들은 덮어쓰지 않고 유지됩니다(variants/sound만 재계산).

### 새 팩 추가하기 (수동)

스크립트 없이 직접 `config.json`을 작성해도 됩니다:

1. `packs/<팩이름>/` 폴더를 새로 만들고 오디오 파일을 넣는다.
2. 위 형식대로 `config.json`을 작성한다. `variants`는 반드시 비어있지 않은 배열이어야
   하며(`loadPackConfig`가 이를 강제함), 오디오 파일 안에서 실제 타건음이 있는 구간의
   시작/길이(ms)를 지정해야 한다.
3. 앱을 재시작하면 설정 창의 해당 카테고리 탭에 새 팩이 자동으로 나타난다.

## Windows 배포용 설치 파일 만들기

```bash
# 방법 1: 서명 없이 (테스트용)
npm run build:win

# 방법 2: 코드 사인 포함 (공식 배포)
SIGN_CERT_PASS="your_password" npm run build:win:signed

# 방법 3: GitHub Releases로 자동 배포
SIGN_CERT_PASS="your_password" npm run release
```

`dist/` 폴더에 NSIS 설치 파일이 생성됩니다. 방법 2/3은 `certs/certificate.pfx`와 서명
비밀번호(`SIGN_CERT_PASS`)가 있어야 합니다 — 자세한 서명 로직은 `scripts/sign.js` 참고.

## 알려진 제한 (MVP)

- 마우스 클릭 소리 없음
- Mac/Linux 미지원
- Mechvibes 커뮤니티 사운드팩은 그대로 드롭인되지 않음 — 원본은 `key_define_type`/
  `defines`(키코드 → 소리 매핑) 방식을 쓰지만 이 프로젝트는 `variants`(랜덤 재생 구간
  목록) 방식이라 스키마가 다름. 가져오려면 위 "사운드팩 교체/추가하기" 형식으로
  변환해야 한다.
