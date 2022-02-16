import { NextFunction, Request, Response } from "express";
import isEmail from "validator/lib/isemail";
import { isPhoneNumber, userExists } from "../validators/auth.validator";
/**
 * Validates data sent from frontend
 * @param {Request} req - request object
 * @param {Response} res - response object
 * @param {NextFunction} next - Next Function
 */
export const validateAuth = async (req, res, next) => {
  try {
    const { login, password, fullName } = req.body;
    /**
     * Parsing End Point of the Request URL
     * @const
     * @type {string}
     */
    const URL = req.url.replaceAll("/", "");
    const errors = [];
    switch (URL) {
      case "signup":
        fullName || errors.push("Please Enter Your Full Name");
      case "login":
      case "signup":
        login || errors.push("Email/PhoneNumber Required");
        password || errors.push("Password Field is required");
        break;
      default:
        break;
    }
    errors.length > 0 ? res.status(400).json({ message: errors }) : next();
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Validates data sent from frontend
 * @param {Request} req - request object
 * @param {Response} res - response object
 * @param {NextFunction} next - Next Function
 */

export const validateLoginType = async (req, res, next) => {
  try {
    const { login = "" } = req.body;
    let type = null;
    type =
      (isPhoneNumber(login) && "phoneNumber") || (isEmail(login) && "email");
    if (!type) {
      return res.status(300).json({ message: "Invalid PhoneNumber / Email" });
    }
    req.body.loginType = type;
    next();
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Validates data sent from frontend
 * @param {Request} req - request object
 * @param {Response} res - response object
 * @param {NextFunction} next - Next Function
 */

export const findUser = async (req, res, next) => {
  const user = await userExists(req.body.loginType, req.body.login);
  if (!user)
    return res
      .status(400)
      .json({ message: `User Not found on this ${req.body.loginType}` });
  next();
};