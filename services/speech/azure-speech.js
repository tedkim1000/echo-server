// services/speech/azure-speech.js
const sdk = require('microsoft-cognitiveservices-speech-sdk');
const fs = require('fs');
const config = require('../../config/default');

async function transcribeAudio(audioFilePath, options = {}) {
  return new Promise((resolve, reject) => {
    // Azure 설정
    const speechConfig = sdk.SpeechConfig.fromSubscription(
      config.speech.azure.key,
      config.speech.azure.region
    );
    
    // 언어 설정
    speechConfig.speechRecognitionLanguage = 
      options.language || config.speech.azure.language;
    
    // 오디오 설정
    const audioConfig = sdk.AudioConfig.fromWavFileInput(
      fs.readFileSync(audioFilePath)
    );
    
    // 인식기 생성
    const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);
    
    // 인식 시작
    recognizer.recognizeOnceAsync(
      (result) => {
        recognizer.close();
        if (result.reason === sdk.ResultReason.RecognizedSpeech) {
          resolve({
            text: result.text,
            confidence: 1.0,
            provider: 'azure'
          });
        } else {
          reject(new Error(`Speech recognition failed: ${result.reason}`));
        }
      },
      (err) => {
        recognizer.close();
        reject(err);
      }
    );
  });
}

module.exports = {
  transcribeAudio
};