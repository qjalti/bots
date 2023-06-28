import {Configuration, OpenAIApi} from 'openai';
import {createReadStream} from 'fs';
import {ERROR_MESSAGE} from './constants.js';
import * as dotenv from 'dotenv';

/**
 * Modules settings
 */
dotenv.config();

/**
 * Send requests to OpenAI API
 */
class OpenAI {
  roles = {
    ASSISTANT: 'assistant',
    USER: 'user',
    SYSTEM: 'system',
  };

  /**
   * Class init
   * @param {string} apiKey Open AI API token
   */
  constructor(apiKey) {
    const CONFIGURATION = new Configuration({
      apiKey,
    });
    this.OPEN_AI = new OpenAIApi(CONFIGURATION);
  }

  /**
   * Requst to Open AI chat model
   * @param {Object} messages Object with messages history between user and chat
   * @return {Promise<{success: boolean, content: string}|*>}
   */
  async chat(messages) {
    try {
      const RESPONSE = await this.OPEN_AI.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages,
      });
      return {
        success: true,
        code: 0,
        data: RESPONSE.data.choices[0].message,
      };
    } catch (err) {
      console.log('Error in chat() method', err.message);
      console.log(err, 'err');
      console.log(err.response.status, 'err.response.status');
      console.log(typeof err.response.status, 'typeof err.response.status');
      return {
        success: false,
        code: err.response.status,
        data: ERROR_MESSAGE,
      };
    }
  }

  /**
   * Voice-to-text (transcription)
   * @param {string} filepath Path to voice .mp3 file
   * @return {Promise<{success: boolean, content: string}|{data, success: boolean}>}
   */
  async transcription(filepath) {
    try {
      const REPONSE = await this.OPEN_AI.createTranscription(
          createReadStream(filepath),
          'whisper-1',
      );
      return {
        success: true,
        data: REPONSE.data.text,
      };
    } catch (err) {
      console.log('Error in transcription() method', err.message, err);
      return {
        success: false,
        content: ERROR_MESSAGE,
      };
    }
  }
}

export const OPEN_AI = new OpenAI(process.env.OPEN_AI_TOKEN);
