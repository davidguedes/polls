import z from "zod"
import { randomUUID } from "node:crypto"
import { prisma } from "../../lib/prisma"
import { FastifyInstance } from "fastify"

export async function voteOnPoll(app: FastifyInstance) {
    app.post('/polls/:pollId/votes', async (request, reply) => {
        const voteOnPollBody = z.object({
            pollOptionId: z.string().uuid(),
        })

        const votePollParams = z.object({
            pollId: z.string().uuid(),
        })

        const { pollOptionId } = voteOnPollBody.parse(request.body)
        const { pollId } = votePollParams.parse(request.params)

        let { sessionId } = request.cookies

        if(sessionId) {
            const userPreviousVoteOnPoll = await prisma.vote.findUnique({
                where: {
                    sessionId_pollId: {
                        sessionId,
                        pollId
                    }
                }
            })

            if(userPreviousVoteOnPoll && userPreviousVoteOnPoll.pollOptionId !== pollOptionId) {
                // Apagar voto anterior
                //Criar um novo

                await prisma.vote.delete({
                    where: {
                        id: userPreviousVoteOnPoll.id
                    }
                })
            } else if(userPreviousVoteOnPoll) {
                return reply.status(400).send({ message: 'You already voted on this poll.' })
            }
        }

        if(!sessionId) {
            sessionId = randomUUID();

            reply.setCookie('sessionId', sessionId, {
                path: '/',
                maxAge: 60  * 60 * 24 * 30,
                signed: true,
                httpOnly: true,
            })
        }

        await prisma.vote.create({
            data: {
                sessionId,
                pollId,
                pollOptionId
            }
        })

        return reply.status(201).send()
    })
}