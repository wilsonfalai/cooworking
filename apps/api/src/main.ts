import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: configService.get('FRONTEND_URL', 'http://localhost:3000'),
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  if (configService.get('DISABLE_API_DOCS') !== 'true') {
    const config = new DocumentBuilder()
      .setTitle('Cooworking API')
      .setDescription('API documentation for the Cooworking SaaS platform')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    app.use(
      '/api/docs',
      apiReference({
        sources: [{ content: JSON.stringify(document) }],
      }),
    );
  }

  await app.listen(configService.get('PORT', '3001'));
}
bootstrap();
