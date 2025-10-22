import { Telegraf } from "telegraf";
import fs from "fs";
import path from "path";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg"; // Локальный
import ffmpeg from "fluent-ffmpeg"; // FFmpeg
import axios from "axios";

// Указываем fluent-ffmpeg использовать локальный FFmpeg
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

// Замените 'YOUR_BOT_TOKEN' на токен вашего бота
const bot = new Telegraf(process.env.VTV_BOT_TOKEN);

// Путь для временного хранения файлов
const tempDir = "./temp";
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

// Обработка видеофайлов
bot.on("video", async (ctx) => {
  try {
    const videoFile = await ctx.telegram.getFileLink(ctx.message.video.file_id);
    const videoFilePath = path.join(tempDir, `${ctx.chat.id}.mp4`);
    const audioFilePath = path.join(tempDir, `${ctx.chat.id}.ogg`);

    // Скачиваем видео с помощью axios
    // ctx.reply('Скачиваю видео...');
    const response = await axios({
      method: "get",
      url: videoFile.href,
      responseType: "stream", // Устанавливаем тип ответа как поток
    });

    // Сохраняем файл
    const writer = fs.createWriteStream(videoFilePath);
    response.data.pipe(writer); // Передаём поток в файл
    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    // Извлекаем аудиодорожку с использованием fluent-ffmpeg
    ctx.reply("Обрабатываю видео...");
    await new Promise((resolve, reject) => {
      ffmpeg(videoFilePath)
        .noVideo() // Отключаем видео
        .audioCodec("libopus") // Устанавливаем кодек Opus
        .audioBitrate("64k") // Устанавливаем битрейт
        .audioFrequency(48000) // Устанавливаем частоту дискретизации
        .save(audioFilePath) // Сохраняем как OGG
        .on("end", resolve)
        .on("error", (err) => reject(err));
    });

    // Отправляем голосовое сообщение
    const voiceStream = fs.createReadStream(audioFilePath);
    await ctx.replyWithVoice({ source: voiceStream });
    // ctx.reply('Готово! Вот ваше голосовое сообщение');

    // Очистка временных файлов
    fs.unlinkSync(videoFilePath);
    fs.unlinkSync(audioFilePath);
  } catch (error) {
    console.error("Ошибка:", error.message);
    ctx.reply("Произошла ошибка при обработке видео");
  }
});

// Запуск бота
bot.launch().then(() => false);

// Готовим бот к завершению работы
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
