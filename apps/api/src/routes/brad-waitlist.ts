import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "@cryb/database";
import { emailService } from "../services/email.service";

const bradWaitlistRoutes: FastifyPluginAsync = async (fastify) => {
  // Submit waitlist form
  fastify.post("/submit", async (request, reply) => {
    try {
      const { name, email, phone, interest } = request.body as {
        name: string;
        email: string;
        phone?: string;
        interest: string;
      };

      // Create waitlist entry
      const entry = await prisma.bradWaitlist.create({
        data: {
          name,
          email,
          phone: phone || null,
          interest,
          submittedAt: new Date()
        }
      });

      // Send confirmation email (don't block on it)
      emailService.sendWaitlistConfirmationEmail(email, name).catch(error => {
        fastify.log.error('Failed to send waitlist confirmation email:', error);
      });

      return reply.code(201).send({
        success: true,
        message: 'Successfully added to waitlist',
        id: entry.id
      });
    } catch (error: any) {
      fastify.log.error(error);

      // Handle duplicate email
      if (error.code === 'P2002') {
        return reply.code(400).send({
          success: false,
          error: 'This email is already on the waitlist'
        });
      }

      return reply.code(500).send({
        success: false,
        error: 'Failed to submit form'
      });
    }
  });

  // Get all waitlist entries (admin only - add auth later if needed)
  fastify.get("/entries", async (request, reply) => {
    try {
      const { limit, offset, interest } = request.query as {
        limit?: string;
        offset?: string;
        interest?: string;
      };

      const where = interest ? { interest } : {};

      const [entries, total] = await Promise.all([
        prisma.bradWaitlist.findMany({
          where,
          orderBy: { submittedAt: 'desc' },
          take: limit ? parseInt(limit) : 100,
          skip: offset ? parseInt(offset) : 0
        }),
        prisma.bradWaitlist.count({ where })
      ]);

      return reply.send({
        success: true,
        data: entries,
        total,
        limit: limit ? parseInt(limit) : 100,
        offset: offset ? parseInt(offset) : 0
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to fetch entries'
      });
    }
  });

  // Get stats
  fastify.get("/stats", async (request, reply) => {
    try {
      const [total, byInterest] = await Promise.all([
        prisma.bradWaitlist.count(),
        prisma.bradWaitlist.groupBy({
          by: ['interest'],
          _count: true
        })
      ]);

      return reply.send({
        success: true,
        total,
        byInterest: byInterest.map(item => ({
          interest: item.interest,
          count: item._count
        }))
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to fetch stats'
      });
    }
  });

  // Delete entry
  fastify.delete("/entries/:id", async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      await prisma.bradWaitlist.delete({
        where: { id }
      });

      return reply.send({
        success: true,
        message: 'Entry deleted successfully'
      });
    } catch (error: any) {
      fastify.log.error(error);

      if (error.code === 'P2025') {
        return reply.code(404).send({
          success: false,
          error: 'Entry not found'
        });
      }

      return reply.code(500).send({
        success: false,
        error: 'Failed to delete entry'
      });
    }
  });
};

export default bradWaitlistRoutes;
