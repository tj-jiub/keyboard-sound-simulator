const { execSync } = require('child_process');
const path = require('path');

module.exports = async (configuration) => {
  const { path: filePath } = configuration;
  const certPassword = process.env.CERT_PASS;
  const certPath = path.join(__dirname, '../certs/certificate.pfx');

  if (!certPassword) {
    console.warn('⚠️ CERT_PASS 환경변수 미설정. 서명 스킵');
    return;
  }

  try {
    console.log(`📝 서명 중: ${filePath}`);

    execSync(
      `signtool sign /f "${certPath}" /p "${certPassword}" /fd SHA256 "${filePath}"`,
      { encoding: 'utf-8' }
    );

    console.log('✅ 서명 완료');
  } catch (error) {
    console.error('❌ 서명 실패:', error.message);
    throw error;
  }
};
