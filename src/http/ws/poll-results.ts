import { FastifyInstance } from "fastify";
import { voting } from "../../utils/voting-pub-sub";
import z from "zod";

export async function pollResults(app: FastifyInstance) {
    app.get('/polls/:pollId/results', { websocket: true }, (connection, request) => {
        const getPollParams = z.object({
            pollId: z.string().uuid(),
        })

        const { pollId } = getPollParams.parse(request.params)
        // Inscrever apenas nas mensagens publicadas no canal com o ID da enquete ('pollid')
        voting.subscribe(pollId, (message) => {
            connection.socket.send(JSON.stringify(message))
        })
    })
}

// Pub/Sub - Publish Subscribers

// '1' => 1, 2, 3, 4, 5