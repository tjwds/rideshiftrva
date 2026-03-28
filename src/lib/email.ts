import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport(process.env.EMAIL_SERVER);

export const EMAIL_FROM = process.env.EMAIL_FROM || "noreply@rideshiftrva.com";
