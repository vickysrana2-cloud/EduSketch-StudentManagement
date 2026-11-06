import { UserRole, UserStatus } from '../../users/enums/user.enums';
import { InstitutionStatus } from '../../institutions/enums/institution.enums';

export interface AuthenticatedInstitution {
  id: string;
  name: string;
  code: string;
  status: InstitutionStatus;
}

/**
 * Safe authenticated user payload attached to Request.user by JwtStrategy
 */
export interface AuthenticatedUser {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  institutionId: string | null;
  institution: AuthenticatedInstitution | null;
  isEmailVerified: boolean;
  profileImage?: string | null;
}

