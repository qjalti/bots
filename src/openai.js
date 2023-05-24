import {Configuration, OpenAIApi} from 'openai';
import {createReadStream} from 'fs';
import * as dotenv from 'dotenv';
import moment from 'moment';

dotenv.config();

class OpenAI {
  roles = {
    ASSISTANT: 'assistant',
    USER: 'user',
    SYSTEM: 'system',
  };

  constructor(apiKey) {
    const CONFIGURATION = new Configuration({
      apiKey,
    });
    this.OPEN_AI = new OpenAIApi(CONFIGURATION);
  }

  async chat(messages) {
    try {
      const RESPONSE = await this.OPEN_AI.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages,
      });
      return RESPONSE.data.choices[0].message;
    } catch (err) {
      console.log('Error! While trying GPT-chat', err.message);
    }
  }

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
      console.log('Error while trying transcription! ', err.message);
      return {
        ok: false,
        data: err.message,
      };
    }
  }
}

export const OPEN_AI = new OpenAI(process.env.OPEN_AI_TOKEN);
