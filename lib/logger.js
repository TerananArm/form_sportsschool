import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

/**
 * Log an audit event to the database
 * 
 * @param {Object} options
 * @param {string} options.action - Action type (CREATE, UPDATE, DELETE, LOGIN)
 * @param {string} options.resource - Resource type (Applicant, User, System)
 * @param {string|number} options.resourceId - ID of the resource (optional)
 * @param {string|Object} options.details - Details or changes (optional)
 * @param {string} options.performedBy - User who performed the action (username or 'System')
 * @param {string} options.ipAddress - IP address of the user (optional)
 * @returns {Promise<Object>} Created log entry
 */
export async function logAction({
    action,
    resource,
    resourceId = null,
    details = null,
    performedBy = 'System',
    ipAddress = null
}) {
    try {
        // Ensure details is a string if it's an object
        const detailsStr = typeof details === 'object' ? JSON.stringify(details) : details;
        const resIdStr = resourceId ? String(resourceId) : null;

        const log = await prisma.auditLog.create({
            data: {
                action,
                resource,
                resourceId: resIdStr,
                details: detailsStr,
                performedBy,
                ipAddress
            }
        });
        return log;
    } catch (error) {
        console.error("Failed to create audit log:", error);
        // We probably don't want to throw here to prevent blocking the main action
        // but depending on security requirements, you might want to.
        return null;
    }
}
