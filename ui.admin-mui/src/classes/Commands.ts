import { IsCommand } from '@sogebot/backend/dest/database/validators/IsCommand';
import { IsNotEmpty, MinLength } from 'class-validator';

export class Commands {
  id:           string;
  defaultValue: string;
  type:         string;
  name:         string;

  @IsNotEmpty()
  @MinLength(2)
  @IsCommand()
    command: string;
  permission: string | null;
}