// echo-server.js
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');

const app = express();
app.use(cors());

// 간단한 상태 확인용 엔드포인트
app.get('/', (req, res) => {
  res.send('WebSocket Echo 서버가 실행 중입니다.');
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// 클라이언트 연결 관리
const clients = new Set();

// 연결 이벤트 처리
wss.on('connection', (ws) => {
  console.log('클라이언트 연결됨');
  clients.add(ws);
  
  // 연결 성공 메시지 전송
  ws.send(JSON.stringify({
    type: 'connection_established',
    message: '서버에 연결되었습니다',
    timestamp: new Date().toISOString()
  }));
  
  // 메시지 수신 처리
  ws.on('message', (message) => {
    console.log('수신된 메시지:', message.toString());
    
    try {
      // 메시지 파싱
      const parsedMsg = JSON.parse(message);
    
      // 오디오 데이터 처리 (switch 문 전에 처리)
      if (parsedMsg.type === 'audio_data') {
        console.log(`오디오 데이터 수신: ${parsedMsg.timestamp}`);
        console.log(`데이터 형식: ${parsedMsg.format}`);
        console.log(`데이터 크기: ~${Math.round(parsedMsg.data.length / 1024)} KB`);
      
        // 수신 확인 응답
        ws.send(JSON.stringify({
          type: 'audio_received',
          timestamp: new Date().toISOString(),
          size: parsedMsg.data.length
        }));
      
        // 여기에 추가 오디오 처리 코드를 넣을 수 있습니다
      }
      
      // 메시지 타입에 따른 처리
      switch(parsedMsg.type) {
        case 'ping':
          // Ping 메시지에 대한 응답
          ws.send(JSON.stringify({
            type: 'pong',
            timestamp: new Date().toISOString()
          }));
          break;
          
        case 'audio_data':
          // 오디오 데이터에 대한 가상 STT 응답
          // 실제로는 여기서 Google/Azure STT API를 호출할 예정
          setTimeout(() => {
            ws.send(JSON.stringify({
              type: 'stt_result',
              originalText: '음성 인식 결과 샘플 텍스트입니다.',
              confidence: 0.95,
              timestamp: new Date().toISOString()
            }));
          }, 1000); // 1초 지연으로 처리 시간 시뮬레이션
          break;
          
        case 'translate_request':
          // 번역 요청에 대한 가상 응답
          // 실제로는 여기서 Google/Azure Translate API를 호출할 예정
          setTimeout(() => {
            ws.send(JSON.stringify({
              type: 'translation_result',
              originalText: parsedMsg.text || '번역 요청 텍스트',
              translatedText: parsedMsg.text ? 
                (parsedMsg.targetLang === 'en' ? 'This is a sample translated text.' : 'これはサンプル翻訳テキストです。') : 
                'Sample translated text',
              sourceLang: 'ko',
              targetLang: parsedMsg.targetLang || 'en',
              timestamp: new Date().toISOString()
            }));
          }, 800);
          break;
          
        default:
          // 기본 Echo 응답
          ws.send(JSON.stringify({
            type: 'echo',
            originalMessage: parsedMsg,
            timestamp: new Date().toISOString()
          }));
      }
    } catch (e) {
      console.error('메시지 처리 오류:', e);
      // 오류 발생 시 오류 메시지 반환
      ws.send(JSON.stringify({
        type: 'error',
        message: '메시지 처리 중 오류가 발생했습니다',
        details: e.message,
        timestamp: new Date().toISOString()
      }));
    }
  });
  
  // 연결 종료 이벤트
  ws.on('close', () => {
    console.log('클라이언트 연결 종료됨');
    clients.delete(ws);
  });
  
  // 오류 이벤트
  ws.on('error', (error) => {
    console.error('WebSocket 오류:', error);
    clients.delete(ws);
  });
});

// 서버 시작
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`WebSocket Echo 서버가 http://localhost:${PORT} 에서 실행 중입니다`);
});

// 정상 종료 시 모든 연결 정리
process.on('SIGINT', () => {
  console.log('서버를 종료합니다...');
  
  // 모든 클라이언트에게 종료 메시지 전송
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'server_shutdown',
        message: '서버가 종료됩니다.',
        timestamp: new Date().toISOString()
      }));
      client.close();
    }
  }
  
  // 서버 종료
  server.close(() => {
    console.log('서버가 종료되었습니다.');
    process.exit(0);
  });
});