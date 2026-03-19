import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import routes from "./routes";
import { errorHandler } from "./middlewares/error.middleware";
import { requestMiddleware } from "./middlewares/request.middleware";
import { responseInterceptor } from "./interceptors/response.interceptor";

const app = express();

app.use(helmet());
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(morgan("dev"));

app.use(requestMiddleware);
app.use(responseInterceptor);

app.use("/api", routes);

app.use(errorHandler);

export default app;
