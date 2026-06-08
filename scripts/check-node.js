const major = Number(process.versions.node.split('.')[0]);

if (major < 18) {
  console.error('\n❌ Node.js 18 이상이 필요합니다. (현재: ' + process.version + ')');
  console.error('\n아래 명령으로 Node 20을 활성화한 뒤 다시 실행하세요:\n');
  console.error('  nodebrew use v20.18.0');
  console.error('  # 또는');
  console.error('  export PATH="$HOME/.nodebrew/node/v20.18.0/bin:$PATH"\n');
  process.exit(1);
}
