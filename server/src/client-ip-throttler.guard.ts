import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Request } from 'express';
import { clientIp } from './client-ip';

@Injectable()
export class ClientIpThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(request: Request): Promise<string> {
    return clientIp(request);
  }
}
