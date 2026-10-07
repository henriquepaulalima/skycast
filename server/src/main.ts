import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:4200'
  });

  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3000);
}

void bootstrap();
