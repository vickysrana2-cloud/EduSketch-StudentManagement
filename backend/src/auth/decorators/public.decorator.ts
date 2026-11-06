import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key used to flag public endpoints.
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Custom decorator to mark endpoints or controllers as public.
 * When applied, the JwtAuthGuard permits unauthenticated access.
 *
 * Usage:
 *   @Public()
 *   @Get('health')
 *   getHealth() { return { status: 'ok' }; }
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

