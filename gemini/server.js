const express = require('express');
const http = require('http');
const WebSocket = require('ws');

let pipeline;

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Initialize the AI model pipeline
let generator;
(async () => {
    const { pipeline: dynamicPipeline } = await import('@xenova/transformers');
    pipeline = dynamicPipeline;
    generator = await pipeline('text-generation', 'HuggingFaceTB/SmolLM-135M');
    console.log('AI model loaded successfully');
})();

app.use(express.static('public'));

wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', async (message) => {
    console.log(`Received message: ${message}`);

    // Generate AI response
    if (generator) {
        const output = await generator(message.toString(), { max_new_tokens: 50 });
        const aiResponse = output[0].generated_text;
        console.log(`AI Response: ${aiResponse}`);

        // Send AI response to the client that sent the message
        ws.send(`AI: ${aiResponse}`);
    }

    // Broadcast the original message to all other clients
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(`User: ${message}`);
      }
    });
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
