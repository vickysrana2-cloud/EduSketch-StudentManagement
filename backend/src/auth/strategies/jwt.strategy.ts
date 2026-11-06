import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Types } from 'mongoose';
import { UsersService } from '../../users/users.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { UserRole, UserStatus } from '../../users/enums/user.enums';
import { InstitutionStatus } from '../../institutions/enums/institution.enums';
import {
  AuthenticatedInstitution,
  AuthenticatedUser,
} from '../interfaces/authenticated-user.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    const accessSecret = configService.get<string>('JWT_ACCESS_SECRET');
    if (!accessSecret) {
      throw new Error(
        'JWT_ACCESS_SECRET environment variable is missing or empty.',
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: accessSecret,
      issuer:
        configService.get<string>('JWT_ISSUER') ||
        'education-management-system',
      audience:
        configService.get<string>('JWT_AUDIENCE') ||
        'education-management-users',
      algorithms: ['HS256'],
    });
  }

  /**
   * Validates the decoded JWT payload and ensures complete authorization integrity:
   * 1. Validates subject claim (MongoDB ObjectId).
   * 2. Loads authoritative user document from MongoDB.
   * 3. Rejects inactive or suspended user accounts.
   * 4. Enforces cryptographic consistency: rejects stale roles and invalid institution contexts.
   * 5. Validates tenant institution status.
   * 6. Returns a safe AuthenticatedUser object attached to req.user (excluding passwordHash).
   */
  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    if (!payload || !payload.sub || !Types.ObjectId.isValid(payload.sub)) {
      throw new UnauthorizedException(
        'Invalid access token: subject claim (sub) is missing or malformed.',
      );
    }

    // 1. Authoritative lookup from MongoDB
    let user: any = null;
    try {
      user = await this.usersService.findUserById(payload.sub);
    } catch (err: any) {
      if (err instanceof NotFoundException) {
        throw new UnauthorizedException(
          'User account referenced by this token no longer exists.',
        );
      }
      throw err;
    }

    if (!user) {
      throw new UnauthorizedException(
        'User account referenced by this token no longer exists.',
      );
    }

    // 2. Account status verification
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException(
        `User account is ${user.status.toLowerCase()}. Access denied.`,
      );
    }

    // 3. Role consistency check: Token role must match database role
    if (payload.role !== user.role) {
      throw new UnauthorizedException(
        'Token role claim is stale or invalid. Please log in again.',
      );
    }

    // 4. Institution context consistency check
    let authenticatedInstitution: AuthenticatedInstitution | null = null;

    if (user.role === UserRole.SUPER_ADMIN) {
      if (payload.institutionId !== null && payload.institutionId !== undefined) {
        throw new UnauthorizedException(
          'Invalid token: SUPER_ADMIN must not possess an institutionId context.',
        );
      }
      if (user.institutionId) {
        throw new UnauthorizedException(
          'Data integrity error: SUPER_ADMIN user cannot be assigned to an institution.',
        );
      }
    } else {
      // Non-SUPER_ADMIN roles (ADMIN, TEACHER, STUDENT) must belong to an institution
      if (!user.institutionId) {
        throw new UnauthorizedException(
          `User with role '${user.role}' is not associated with any institution.`,
        );
      }

      const currentInstId = (
        user.institutionId._id || user.institutionId
      ).toString();

      if (payload.institutionId !== currentInstId) {
        throw new UnauthorizedException(
          'Token institution context does not match user account. Please log in again.',
        );
      }

      // Check institution status if populated
      if (
        typeof user.institutionId === 'object' &&
        user.institutionId !== null &&
        user.institutionId.status
      ) {
        if (user.institutionId.status !== InstitutionStatus.ACTIVE) {
          throw new UnauthorizedException(
            `User institution is ${user.institutionId.status.toLowerCase()}. Access denied.`,
          );
        }

        authenticatedInstitution = {
          id: (user.institutionId._id || user.institutionId.id).toString(),
          name: user.institutionId.name,
          code: user.institutionId.code,
          status: user.institutionId.status,
        };
      }
    }

    // 5. Construct safe user object attached to req.user (Never attach passwordHash)
    return {
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      institutionId: user.institutionId
        ? (user.institutionId._id || user.institutionId).toString()
        : null,
      institution: authenticatedInstitution,
      isEmailVerified: user.isEmailVerified,
      profileImage: user.profileImage || null,
    };
  }
}
