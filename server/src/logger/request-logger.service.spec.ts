import { EventEmitter } from 'node:events';
import { Logger } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { RequestLoggerService } from './request-logger.service';

describe('RequestLoggerService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('logs method, URL, status, client address and user agent when the response finishes', () => {
    const log = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    const request = {
      method: 'GET',
      originalUrl: '/api/health',
      headers: { 'x-real-ip': '203.0.113.7' },
      ip: '100.64.0.2',
      socket: {},
      get: (name: string) => (name === 'user-agent' ? 'jest' : undefined)
    } as unknown as Request;
    const response = Object.assign(new EventEmitter(), { statusCode: 200 }) as unknown as Response;
    const next = jest.fn() as NextFunction;

    new RequestLoggerService().use(request, response, next);
    expect(next).toHaveBeenCalled();
    expect(log).not.toHaveBeenCalled();

    response.emit('finish');
    expect(log).toHaveBeenCalledWith(expect.stringMatching(/^GET \/api\/health 200 \d+ms - 203\.0\.113\.7 - jest$/));
  });
});
