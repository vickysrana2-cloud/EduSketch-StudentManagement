import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsNotEmpty } from 'class-validator';
import {
  SubscriptionPlan,
  SubscriptionStatus,
} from '../enums/institution.enums';
import { IsAfterDate } from '../../common/decorators/is-after-date.decorator';

export class SubscriptionDto {
  @ApiProperty({
    enum: SubscriptionPlan,
    example: SubscriptionPlan.BASIC,
    description: 'Subscription tier for the institution',
  })
  @IsEnum(SubscriptionPlan)
  @IsNotEmpty()
  plan: SubscriptionPlan;

  @ApiProperty({
    enum: SubscriptionStatus,
    example: SubscriptionStatus.ACTIVE,
    description: 'Current status of the subscription',
  })
  @IsEnum(SubscriptionStatus)
  @IsNotEmpty()
  status: SubscriptionStatus;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-11-01T00:00:00.000Z',
    description: 'Subscription start date (ISO string)',
  })
  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  startDate: Date;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2027-10-31T23:59:59.000Z',
    description: 'Subscription end date (must be after start date)',
  })
  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  @IsAfterDate('startDate', {
    message: 'Subscription endDate must be after startDate',
  })
  endDate: Date;
}

