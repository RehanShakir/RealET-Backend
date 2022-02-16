import { NextFunction, Request, Response } from "express";
import roles from "../../config/roles";
import { sendConfirmEmail } from "../../libraries/sendMail";
import sendVerificationCode from "../../libraries/sendMessage";
import { User } from "../../models";
import { randomOTP } from "../../utils";
import { findUser, getType, userExists } from "../../validators/auth.validator";
/**
 * This Function allows User to login To his respective Dashboard based on Role
 * @param {Request} req - request object
 * @param {Response} res - response object
 */
export const userLogin = async (req, res) => {
  try {
    const { password, login } = req?.body;
    const user = await findUser(getType(login), login);
    if (!user) {
      return res
        .status(404)
        .json({ message: "User Not exists, please Signup First" });
    }
    if (!(await user?.comparePassword(password))) {
      return res.status(401).json({
        status: "Unauthorized",
        message: `${[getType(login)]}/Password does not match`,
      });
    }
    res.status(200).json({
      message: "Logged In",
      token: user.getJwtToken(),
      role: user.role,
    });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

/**
 * Creates new instance of User in database
 * @param {Request} req - request object
 * @param {Response} res - response object
 * @param {NextFunction} next - Next Function
 */
export const userSignup = async (req, res, next) => {
  try {
    const { fullName, login, password, role = "Consumer" } = req?.body;
    const type = getType(login);
    if (await userExists(type, login)) {
      return res
        .status(400)
        .json({ message: `User already exists on this ${type}, please Login` });
    }
    const user = await User.create({
      fullName,
      [type]: login,
      password,
      role,
    });
    user.otp = { code: await randomOTP(), status: false };
    user.save();
    req.user = user;
    next();
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

/**
 * Creates new instance of Each respective role in database
 * @param {Request} req - request object
 * @param {Response} res - response object
 */
export const roleSignup = async (req, res) => {
  try {
    const { role, _id } = req?.user;
    roles[role].create({ userId: _id });
    res.status(200).json({ message: "Signed Up" });
  } catch (error) {
    User.findOneAndDelete({ _id: req?.user?._id });
    res.status(400).json({ message: error.message });
  }
};

/**
 * Generates a OTP and sends to user for resetting password
 * @param {Request} req - request object
 * @param {Response} res - response object
 */

export const forgotPassword = async (req, res) => {
  try {
    const { loginType, login } = req.body;
    const OTP = await randomOTP();
    switch (loginType) {
      case "email":
        await sendConfirmEmail({
          email: login,
          subject: "Reset Password",
          text: `The OTP for your reset password is ${OTP}`,
        });
        break;
      case "phoneNumber":
        await sendVerificationCode(login, OTP);
        break;
      default:
        break;
    }
    await User.findOneAndUpdate(
      { [loginType]: login },
      { $set: { "otp.code": OTP, "otp.status": false } }
    );

    res.status(200).json({
      message: `OTP successfully sent to ${login}`,
    });
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
};

/**
 * Verifies OTP entered by user
 * @param {Request} req - request object
 * @param {Response} res - response object
 */

export const verifyOTP = async (req, res) => {
  try {
    const { login, loginType, otp } = req.body;
    const user = await User.findOne({
      $and: [{ [loginType]: login }, { "otp.code": otp }],
    });
    if (!user) {
      return res.status(401).json({ message: "OTP not valid", status: false });
    }
    await User.findOneAndUpdate(
      { _id: user._id },
      { $unset: { "otp.code": "" }, $set: { "otp.status": true } },
      { new: true }
    );
    res.status(200).json({ message: "OTP Verified", status: true });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Sets New password for the user
 * @param {Request} req - request object
 * @param {Response} res - response object
 */
export const resetPassword = async (req, res) => {
  try {
    const { password, login, loginType } = req.body;
    const user = await User.findOneAndUpdate(
      { $and: [{ [loginType]: login }, { "otp.status": true }] },
      { $unset: { otp: "" } },
      { new: true }
    );
    if (!user) {
      return res.status(400).json({ message: "OTP not Verified" });
    }
    user.password = password;
    await user.save();
    res.status(200).json({ message: "Password Reset Done, Login to continue" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};