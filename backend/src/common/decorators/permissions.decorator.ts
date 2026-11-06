import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key used by Reflector to inspect required permissions.
 */
export const PERMISSIONS_KEY = 'permissions';

/**
 * Decorator to attach required permission strings to an endpoint or controller class.
 *
 * Example Usage:
 *   @Permissions('STUDENT_CREATE')
 *   @Permissions('STUDENT_CREATE', 'STUDENT_UPDATE')
 *   @UseGuards(JwtAuthGuard, PermissionsGuard)
 *   @Post('students')
 *   createStudent() {
 *     return this.studentsService.create();
 *   }
 *
 * @param permissions One or more permission names (e.g. 'STUDENT_CREATE')
 */
export const Permissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

