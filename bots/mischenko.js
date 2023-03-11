// /**
//  * Блок подключения модулей
//  */
// const TelegramBot = require('node-telegram-bot-api');
//
// /**
//  * Telegram bot
//  */
// // const TOKEN = '1862212004:AAH_LdnhEyqq9Iyjh4Wvi76FKnbW7O23FbI';
// const TOKEN = '5543817620:AAEUQ8IrI8EmITF8Gzj_Jv-mrzXIq8yZZKU';
// const BOT = new TelegramBot(TOKEN, {polling: true});
//
// /**
//  * Блок определения констант
//  */
// const INLINE_FORMAT = true; // Формат кнопок. Если внутри сообщения то true
//
// /**
//  * Если сообщение /start
//  */
// BOT.onText(/\/start/, (msg, match) => {
//   const CHAT_ID = msg.chat.id;
//
//   if (INLINE_FORMAT) {
//     const TEXT = 'Здравствуйте. Пожалуйста, выберите из списка Ваш город:';
//     const OPTIONS = {
//       reply_markup: JSON.stringify({
//           inline_keyboard: [
//             [{text: 'Пятигорск', callback_data: 'Пятигорск'}],
//             [{text: 'Ессентуки', callback_data: 'Ессентуки'}],
//             [{text: 'Ростов-на-Дону', callback_data: 'Ростов-на-Дону'}]
//           ],
//         },
//       )
//     };
//     BOT.sendMessage(CHAT_ID, TEXT, OPTIONS);
//   } else {
//     const TEXT = 'Здравствуйте. Пожалуйста, выберите из списка Ваш город';
//     const OPTIONS = {
//       reply_markup: JSON.stringify({
//           keyboard: [
//             [{text: 'Пятигорск'}],
//             [{text: 'Ессентуки'}],
//             [{text: 'Ростов-на-Дону'}]
//           ],
//           resize_keyboard: true,
//           one_time_keyboard: true,
//           input_field_placeholder: 'Выберите город'
//         },
//       )
//     };
//     BOT.sendMessage(CHAT_ID, TEXT, OPTIONS);
//   }
// });
//
// if (!INLINE_FORMAT) {
//   BOT.on('message', (msg) => {
//     if (msg.text === 'Пятигорск' || msg.text === 'Ессентуки' || msg.text === 'Ростов-на-Дону') {
//       const OPTIONS = {
//         reply_markup: JSON.stringify({
//             remove_keyboard: true,
//           },
//         )
//       };
//       BOT.sendMessage(
//         msg.chat.id,
//         `Вы выбрали город ${msg.text}. Пожалуйста, ожидайте, оператор скоро Вам ответит`,
//         OPTIONS
//       );
//     }
//   });
// }
//
// BOT.on('callback_query', (callbackQuery) => {
//   const ACTION = callbackQuery.data;
//   const MESSAGE = callbackQuery.message;
//   const OPTIONS = {
//     chat_id: MESSAGE.chat.id,
//     message_id: MESSAGE.message_id,
//   };
//
//   BOT.editMessageText(`Город обращения — ${ACTION}`, OPTIONS);
//   BOT.sendMessage(
//     MESSAGE.chat.id,
//     'Пожалуйста, ожидайте, оператор скоро Вам ответит',
//   );
// });