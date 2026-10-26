import nodemailer from "nodemailer";
import env from "../configs/env.js";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: env.emailHost,
    pass: env.emailPass, // The 16-character App Password
  },
});

export const sendMail = async (to, subject, text, html) =>{
    const mailOptions = {
        from: `GRD AMRITSAR <${env.emailHost}>`,
        to,
        subject,
        text,
        html
    }
    const info = await transporter.sendMail(mailOptions);
    return info;
}
