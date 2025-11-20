import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strips unknown fields
      forbidNonWhitelisted: true, // throws if unknown fields provided
      transform: true, // transforms strings → proper types (Date, number, etc)
    }),
  );

  // swagger configuration
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Shopping Store APIs')
    .setDescription('API Documentation for Shopping Store')
    .setVersion('1.0')
    .addTag('Shopping Store')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
  console.log(`Server is up and running on port ${process.env.PORT ?? 3000}`);
  console.log('Swagger UI available at: http://localhost:3000/api');
}
bootstrap();
