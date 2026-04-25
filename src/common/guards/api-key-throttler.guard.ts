import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class ApiKeyThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const auth = req.headers['authorization'];
    const xApiKey = req.headers['x-api-key'];

    let apiKey = xApiKey;
    if (auth && typeof auth === 'string' && auth.startsWith('Bearer ')) {
      apiKey = auth.substring(7);
    }

    const tracker = Array.isArray(apiKey) ? apiKey[0] : apiKey;
    return (tracker as string) || (req.ip as string);
  }
}
