import "server-only";
import { z } from "zod";
import { CONVERSATION_SUBJECTS, MEMBERSHIP_ROLES } from "@myos/core/collaboration";
import { protectedProcedure, router } from "../trpc";
import * as service from "./service";

/**
 * Collaboration router (Stage 7). The authenticated actor is always the OS owner in this
 * single-owner deployment, so the service is called with the default owner actor; the
 * pure authorization predicates (tested for collaborator actors) gate every shared read/
 * write inside the service. `tz` comes from the identity on the context.
 */
const subjectInput = z.object({
  subjectType: z.enum(CONVERSATION_SUBJECTS),
  subjectId: z.string().uuid(),
});
const roleSchema = z.enum(MEMBERSHIP_ROLES);

export const collaborationRouter = router({
  // people
  collaborators: protectedProcedure.query(({ ctx }) => service.listCollaborators(ctx.db)),
  addCollaborator: protectedProcedure
    .input(z.object({ name: z.string().min(1).max(120), email: z.string().email().optional() }))
    .mutation(({ ctx, input }) =>
      service.addCollaborator(ctx.db, { name: input.name, email: input.email ?? null }),
    ),
  removeCollaborator: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(({ ctx, input }) => service.removeCollaborator(ctx.db, input.id)),

  // sharing / membership
  shareProject: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .mutation(({ ctx, input }) => service.shareProject(ctx.db, input.projectId)),
  addMember: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        collaboratorId: z.string().uuid(),
        role: roleSchema,
      }),
    )
    .mutation(({ ctx, input }) =>
      service.addMember(
        ctx.db,
        input.projectId,
        input.collaboratorId,
        input.role,
        ctx.identity.preferences.timezone,
      ),
    ),
  removeMember: protectedProcedure
    .input(z.object({ projectId: z.string().uuid(), collaboratorId: z.string().uuid() }))
    .mutation(({ ctx, input }) =>
      service.removeMember(ctx.db, input.projectId, input.collaboratorId),
    ),
  members: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(({ ctx, input }) => service.listMembers(ctx.db, input.projectId)),

  // invitations
  invite: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        collaboratorId: z.string().uuid(),
        role: roleSchema,
      }),
    )
    .mutation(({ ctx, input }) =>
      service.invite(ctx.db, input.projectId, input.collaboratorId, input.role),
    ),
  acceptInvitation: protectedProcedure
    .input(z.object({ token: z.string() }))
    .mutation(({ ctx, input }) =>
      service.acceptInvitation(ctx.db, input.token, ctx.identity.preferences.timezone),
    ),
  rejectInvitation: protectedProcedure
    .input(z.object({ token: z.string() }))
    .mutation(({ ctx, input }) => service.rejectInvitation(ctx.db, input.token)),
  invitations: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(({ ctx, input }) => service.listInvitations(ctx.db, input.projectId)),

  // conversations + messages
  messages: protectedProcedure
    .input(subjectInput)
    .query(({ ctx, input }) => service.listMessages(ctx.db, input.subjectType, input.subjectId)),
  postMessage: protectedProcedure
    .input(
      subjectInput.extend({
        body: z.string().min(1).max(8000),
        parentMessageId: z.string().uuid().nullable().optional(),
        subjectLabel: z.string().max(200).optional(),
      }),
    )
    .mutation(({ ctx, input }) =>
      service.postMessage(
        ctx.db,
        {
          subjectType: input.subjectType,
          subjectId: input.subjectId,
          body: input.body,
          parentMessageId: input.parentMessageId ?? null,
          ...(input.subjectLabel ? { subjectLabel: input.subjectLabel } : {}),
        },
        ctx.identity.preferences.timezone,
      ),
    ),
  editMessage: protectedProcedure
    .input(z.object({ messageId: z.string().uuid(), body: z.string().min(1).max(8000) }))
    .mutation(({ ctx, input }) => service.editMessage(ctx.db, input.messageId, input.body)),
  deleteMessage: protectedProcedure
    .input(z.object({ messageId: z.string().uuid() }))
    .mutation(({ ctx, input }) => service.deleteMessage(ctx.db, input.messageId)),

  // task collaboration
  assignTask: protectedProcedure
    .input(z.object({ taskId: z.string().uuid(), collaboratorId: z.string().uuid().nullable() }))
    .mutation(({ ctx, input }) =>
      service.assignTask(
        ctx.db,
        input.taskId,
        input.collaboratorId,
        ctx.identity.preferences.timezone,
      ),
    ),
  addTaskCollaborator: protectedProcedure
    .input(z.object({ taskId: z.string().uuid(), collaboratorId: z.string().uuid() }))
    .mutation(({ ctx, input }) =>
      service.addTaskCollaborator(ctx.db, input.taskId, input.collaboratorId),
    ),
  removeTaskCollaborator: protectedProcedure
    .input(z.object({ taskId: z.string().uuid(), collaboratorId: z.string().uuid() }))
    .mutation(({ ctx, input }) =>
      service.removeTaskCollaborator(ctx.db, input.taskId, input.collaboratorId),
    ),
  taskCollaboration: protectedProcedure
    .input(z.object({ taskId: z.string().uuid() }))
    .query(({ ctx, input }) => service.taskCollaboration(ctx.db, input.taskId)),

  // decisions
  addDecisionParticipant: protectedProcedure
    .input(z.object({ decisionId: z.string().uuid(), collaboratorId: z.string().uuid() }))
    .mutation(({ ctx, input }) =>
      service.addDecisionParticipant(ctx.db, input.decisionId, input.collaboratorId),
    ),
  decisionCollaboration: protectedProcedure
    .input(z.object({ decisionId: z.string().uuid() }))
    .query(({ ctx, input }) => service.decisionCollaboration(ctx.db, input.decisionId)),
  resolveDecision: protectedProcedure
    .input(z.object({ decisionId: z.string().uuid(), decisionTitle: z.string().max(300) }))
    .mutation(({ ctx, input }) =>
      service.resolveDecision(
        ctx.db,
        input.decisionId,
        input.decisionTitle,
        ctx.identity.preferences.timezone,
      ),
    ),

  // hub
  hub: protectedProcedure.query(({ ctx }) => service.hub(ctx.db)),
});
