import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { askQuestion } from '../services/chat.js';

interface ChatBody {
  message: string;
  context: string;
}

export async function chatRoute(fastify: FastifyInstance) {
  fastify.post('/api/chat', async (req: FastifyRequest, reply: FastifyReply) => {
    const { message, context } = req.body as ChatBody;
    
    if (!message || !context) {
      return reply.code(400).send({ error: 'Message and context are required' });
    }

    try {
      const responseText = await askQuestion(message, context);
      return reply.send({ response: responseText });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({ 
        error: 'Failed to process chat query', 
        details: error.message,
        stack: error.stack 
      });
    }
  });
}
