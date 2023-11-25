import { command } from '@sogebot/backend/src/database/validators/IsCommand';
import { z } from 'zod';

export const schema = z.object({
  id:           z.string(),
  defaultValue: z.string(),
  type:         z.string(),
  name:         z.string(),
  permission:   z.string().nullable(),
  command:      command(),
});

export type Commands = z.infer<typeof schema>;