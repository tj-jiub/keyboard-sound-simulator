module.exports = {
  appId: 'com.jiub.keyboard-sound-simulator',
  productName: '키보드 음향 시뮬레이터',
  artifactName: '${productName}-Setup-${version}-${arch}.${ext}',
  npmRebuild: false,
  asar: true,
  asarUnpack: ['node_modules/uiohook-napi/**/*'],

  files: ['src/**/*', 'package.json', 'NOTICE.md', 'README.md'],

  extraResources: [
    { from: 'packs', to: 'packs' },
  ],

  icon: 'src/assets/cat-icon.ico',

  win: {
    target: [
      { target: 'nsis', arch: ['x64'] },
      { target: 'portable', arch: ['x64'] },
    ],
    // CERT_PASS 없이 빌드하면(테스트용) 서명 설정 자체를 넣지 않는다 —
    // electron-builder는 certificateFile이 설정돼 있으면 파일 존재 여부와
    // 무관하게 리소스 서명 단계를 시도해서, 인증서가 아직 없는 상태에서도
    // 무서명 빌드가 깨진다.
    ...(process.env.CERT_PASS
      ? {
          signtoolOptions: {
            certificateFile: 'certs/certificate.pfx',
            certificatePassword: process.env.CERT_PASS,
            signingHashAlgorithms: ['sha256'],
            sign: './scripts/sign.js',
          },
        }
      : {}),
  },

  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    allowElevation: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: '키보드 음향 시뮬레이터',
  },

  portable: {
    artifactName: '${productName}-${version}-portable-${arch}.exe',
  },

  publish: {
    provider: 'github',
    owner: 'tj-jiub',
    repo: 'keyboard-sound-simulator',
    releaseType: 'release',
    publishAutoUpdate: true,
  },
};
