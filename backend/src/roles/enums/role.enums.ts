import { UserRole } from '../../users/enums/user.enums';

export { UserRole };

/**
 * Standard hierarchical level for system roles
 */
export const RoleLevels: Record<UserRole, number> = {
  [UserRole.SUPER_ADMIN]: 4,
  [UserRole.ADMIN]: 3,
  [UserRole.TEACHER]: 2,
  [UserRole.STUDENT]: 1,
};

