import { UserRole } from '../../users/enums/user.enums';

/**
 * Re-export UserRole to serve as the unified, single-source-of-truth
 * enum across common decorators, guards, and domain schemas.
 *
 * Supported system roles:
 * - SUPER_ADMIN: Universal platform governance
 * - ADMIN: Institution / school management
 * - TEACHER: Academic & attendance operations
 * - STUDENT: Self-service & academic records
 */
export { UserRole };

