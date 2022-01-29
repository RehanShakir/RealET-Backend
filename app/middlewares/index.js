import express from "express";
import morgan from "morgan";
import cors from "cors";
const app = express();
export default function () {
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cors());
  app.use(morgan("dev"));
}
