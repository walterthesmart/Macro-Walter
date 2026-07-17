import { IsDateString } from 'class-validator';

export class DateQueryDto {
  @IsDateString()
  date: string;
}
