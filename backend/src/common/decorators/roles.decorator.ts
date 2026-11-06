import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../enums/user-role.enum';

/**
 * Metadata key used by Reflector to inspect role requirements.
 */
export const ROLES_KEY = 'roles';

/**
 * Decorator to attach permitted UserRoles to a route handler or class.
 *
 * Example Usage:
 *   @Roles(UserRole.SUPER_ADMIN)
 *   @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
 *   @UseGuards(JwtAuthGuard, RolesGuard)
 *   @Get('institutions')
 *   findAll() { ... }
 *
 * @param roles Permitted UserRole enums
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

