import { Schema, Types, model } from "mongoose";

const portfolioScheme = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User" },
    title: { type: String, required: [true, "Title is required"] },
    description: { type: String },
    photos: [{ type: String }],
    info: {
      coords: { longitude: { type: Number }, latitude: { type: Number } },
      societyName: {
        type: String,
        required: [true, "Society Name is required"],
      },
      city: { type: String },
      province: { type: String },
      size: { type: String },
    },
    deleteFlag: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Portfolio = model("Portfolio", portfolioScheme);
export default Portfolio;
