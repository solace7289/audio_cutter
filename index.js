const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer').default;

const inputDir = path.join(__dirname, 'input');
const outputDir = path.join(__dirname, 'output');

// Tạo folder nếu chưa có
if (!fs.existsSync(inputDir)) fs.mkdirSync(inputDir);
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

async function main() {
  const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.mp3') || f.endsWith('.mp4'));
  if (files.length === 0) {
    console.log('Không tìm thấy file nào trong thư mục "input/". Vui lòng thêm file vào.');
    return;
  }

  const { startTime, endTime } = await inquirer.prompt([
    {
      type: 'input',
      name: 'startTime',
      message: 'Nhập thời gian bắt đầu (hh:mm:ss):',
      validate: val => /^\d{2}:\d{2}:\d{2}$/.test(val) ? true : 'Định dạng phải là hh:mm:ss',
    },
    {
      type: 'input',
      name: 'endTime',
      message: 'Nhập thời gian kết thúc (hh:mm:ss):',
      validate: val => /^\d{2}:\d{2}:\d{2}$/.test(val) ? true : 'Định dạng phải là hh:mm:ss',
    }
  ]);

  for (const file of files) {
    const inputPath = path.join(inputDir, file);
    const ext = path.extname(file);
    const base = path.basename(file, ext);
    const outputPath = path.join(outputDir, `${base}_cut${ext}`);

    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .setStartTime(startTime)
        .setDuration(getDuration(startTime, endTime))
        .output(outputPath)
        .on('end', () => {
          console.log(`✅ Đã cắt xong: ${file} → ${outputPath}`);
          resolve();
        })
        .on('error', err => {
          console.error(`❌ Lỗi khi xử lý ${file}:`, err.message);
          reject(err);
        })
        .run();
    });
  }
}

// Tính khoảng thời gian giữa start và end
function getDuration(start, end) {
  const toSeconds = time => {
    const [h, m, s] = time.split(':').map(Number);
    return h * 3600 + m * 60 + s;
  };
  return toSeconds(end) - toSeconds(start);
}

main();



