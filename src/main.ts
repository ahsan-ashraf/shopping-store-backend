import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookieParser from "cookie-parser"; // default import

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const origins = [
    "http://localhost:5173", // Vite
    "https://yourdomain.com" // Production frontend
  ];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || origins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true // REQUIRED if using cookies (JWT refresh token)
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strips unknown fields
      forbidNonWhitelisted: false, // throws if unknown fields provided
      transform: true // transforms strings proper types (Date, number, etc)
    })
  );

  app.use(cookieParser()); // <-- enable cookie parsing

  // swagger configuration
  const swaggerConfig = new DocumentBuilder().setTitle("Shopping Store APIs").setDescription("API Documentation for Shopping Store").setVersion("1.0").addTag("Shopping Store").build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("api", app, document);

  await app.listen(process.env.PORT ?? 5000);
  console.log(`Server is up and running on port ${process.env.PORT ?? 5000}`);
  console.log("Swagger UI available at: http://localhost:5000/api");
}
bootstrap();
