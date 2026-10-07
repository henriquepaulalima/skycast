import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Railway's edge is the one proxy in front of the API, so rate limits see each visitor's address.
  app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS ?? 1));

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:4200'
  });

  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3000);
}

void bootstrap();
