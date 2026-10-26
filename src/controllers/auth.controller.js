import User from '../models/user.model.js'
import { generateHash, verifyHash } from "../utils/bcrypt.utils.js";
import { generateToken } from "../utils/jwt.utils.js";
import crypto from "node:crypto"
import { sendMail } from '../utils/mailer.utils.js';

/**
 * validates the password based on the following criteria:
 * - Minimum length of 8 characters
 * - At least one uppercase letter and one digit
 * @param {String} password 
 * @returns 
 */
const validatePassword = (password) => {
    if (!password || password.trim().length < 8) {
        return false;
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;
    const isValid = passwordRegex.test(password);
    return isValid;

}

export const registerUser = async (req, res) => {
    const { name, uid, email } = req.body;
    const password = String(req.body.password);

    //input validation
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email and password are required' });
    }
    if (password.length < 8 || !validatePassword(password)) {
        return res.status(400).json({ error: "Invalid password" })
    }

    //fetching user from db to check if user exist
    if (uid) {
        const user = await User.findOne({ uid }).lean();
        if (user) {
            return res.status(400).json({ error: 'User already exists with same uid' });
        }
    }
    const emailUser = await User.findOne({ email }).lean();
    if (emailUser) {
        return res.status(400).json({ error: 'User already exists with same email' });
    }

    //hashing password and saving to db
    const hashedPassword = await generateHash(password);
    const newUser = await User.create({
        name,
        uid,
        email,
        password: hashedPassword,
        role: 'USER'
    });

    //generate JWT token for the user and save as cookie
    const token = generateToken({ id: newUser._id, role: newUser.role });
    res.cookie('alpha', token,
        {
            httpOnly: true,
            sameSite: 'none', // Allows cross-origin cookie sharing
            secure: true,     // Required for sameSite: 'none'
            maxAge: 2 * 24 * 60 * 60 * 1000    //2d timeout
        });

    return res.status(201).json({
        user: {
            id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            uid: newUser.uid,
            role: newUser.role,
        }
    });

}

export const loginUser = async (req, res) => {

    const { uid, email } = req.body;
    const password = req.body.password ? String(req.body.password) : "";
    if (!uid && !email) {
        return res.status(400).json({ message: 'all credentials are required' });
    }
    if (!password) {
        return res.status(400).json({ message: 'all credentials are required' });
    }

    //no password validation here because we are not creating a new password, just checking if the password is correct
    const user = uid ? await User.findOne({ uid }).select('+password').lean() : await User.findOne({ email }).select('+password').lean();
    if (!user) {
        return res.status(400).json({ error: 'invalid Credentials' });
    }

    //verify password
    const isPasswordValid = await verifyHash(password, user.password);
    if (!isPasswordValid) {
        return res.status(400).json({ error: 'invalid Credentials' });
    }

    //generate JWT token for the user and save as cookie
    const token = generateToken({ id: user._id, role: user.role });
    res.cookie('alpha', token, {
        httpOnly: true,
        sameSite: 'none', // Allows cross-origin cookie sharing
        secure: true,     // Required for sameSite: 'none'
        maxAge: 2 * 24 * 60 * 60 * 1000   //2d timeout
    });


    return res.status(200).json({
        user: {
            id: user._id,
            name: user.name,
            uid: user.uid,
            role: user.role,
            email: user.email,
            streetAddress: user.address?.streetAddress,
            city: user.address?.city,
            state: user.address?.state,
            postalCode: user.address?.postalCode,
            country: user.address?.country
        }
    });

}

export const logoutUser = async (req, res) => {
    res.clearCookie('alpha', {
        httpOnly: true,
        sameSite: 'none',
        secure: true
    });
    return res.status(200).json({ success: true });
}

/**
 * auto login user if token exists
 * @param {} req 
 * @param {*} res 
 * @returns 
 */
export const autoLoginUser = async (req, res) => {

    const decoded = req.user;
    if (!decoded) {
        return res.status(401).json({ error: "unauthorized" });
    }

    //fetch user from database using decoded token
    const user = await User.findById(decoded.id).lean();
    if (!user) {
        return res.status(401).json({ error: "unauthorized" });
    }

    //attach user to request object
    res.status(200).json({
        user: {
            id: user._id,
            name: user.name,
            role: user.role,
            uid: user.uid,
            email: user.email,
            streetAddress: user.address?.streetAddress,
            city: user.address?.city,
            state: user.address?.state,
            postalCode: user.address?.postalCode,
            country: user.address?.country
        }
    });

}

// send the otp on forgot
export const forgotUser = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({
                success: false,
                error: "user not found"
            });
        }

        //generate otp
        const otpCode = crypto.randomInt(100000, 1000000).toString();

        //updating db if email matches and storing otp in db with 10min expiry
        const result = await User.updateOne(
            { email: email },
            {
                $set: {
                    'otpDetails.code': otpCode.trim(), 'otpDetails.expiresAt': new Date(Date.now() + 10 * 60 * 1000)
                }
            }
        )
        if (!result.matchedCount) {
            return res.status(200).json({ success: false, error: "user not found" });
        }

        //mail ui to send
        const mailHtml = `
        <div style="font-family: 'Times New Roman', Times, serif; background-color: #FCF9F3; max-width: 600px; margin: 0 auto; padding: 40px 20px; text-align: center; border: 1px solid #EAE2D5;">
      
      <!-- Top Accent Bar -->
      <div style="font-family: Arial, sans-serif; font-size: 10px; letter-spacing: 2px; color: #9E7E44; text-transform: uppercase; margin-bottom: 30px;">
        Heritage in Every Weave • Distinction in Every Detail
      </div>

      <!-- Website Styled Header / Logo -->
      <h1 style="font-size: 28px; font-weight: 400; letter-spacing: 4px; color: #222222; margin: 0 0 5px 0; text-transform: uppercase;">
        G R D
      </h1>
      <p style="font-size: 11px; letter-spacing: 5px; color: #666666; margin: 0 0 40px 0; text-transform: uppercase;">
        Amritsar
      </p>

      <hr style="border: 0; border-top: 1px solid #EAE2D5; margin-bottom: 40px;" />

      <!-- Main Body Content -->
      <h2 style="font-size: 22px; font-weight: 400; letter-spacing: 1px; color: #222222; margin-bottom: 20px;">
        Password Reset Request
      </h2>
      
      <p style="font-family: Arial, sans-serif; color: #555555; font-size: 14px; line-height: 1.6; max-width: 480px; margin: 0 auto 30px auto;">
        We received a request to reset the password for your account. Please use the verification security code below to proceed with your reset.
      </p>

      <!-- Premium Styled OTP Box -->
      <div style="background-color: #FFFFFF; border: 1px solid #EAE2D5; display: inline-block; padding: 15px 40px; border-radius: 2px; margin-bottom: 30px; box-shadow: 0px 2px 4px rgba(0,0,0,0.02);">
        <span style="font-family: Arial, sans-serif; font-size: 34px; font-weight: bold; letter-spacing: 6px; color: #222222;">${otpCode}</span>
      </div>

      <!-- Expiration Note -->
      <p style="font-family: Arial, sans-serif; color: #888888; font-size: 13px; margin-bottom: 40px;">
        This temporary security code is valid for <strong>10 minutes</strong>.
      </p>

      <hr style="border: 0; border-top: 1px solid #EAE2D5; margin-bottom: 30px;" />

      <!-- Footer Policy / Assistance Links -->
      <p style="font-family: Arial, sans-serif; color: #999999; font-size: 11px; line-height: 1.5; max-width: 450px; margin: 0 auto;">
        If you did not make this request, your account credentials are secure and you can safely ignore this automated message.
      </p>
      
    </div>
    `

        //send the otp via mail
        sendMail(email,
            "Reset Your Password - GRD Amritsar",
            `Your One-Time Password (OTP) to reset your password at GRD Amritsar is: ${otpCode}. This code is valid for 10 minutes. If you did not request this, please ignore this email.`,
            mailHtml

        )
        return res.status(200).json({ success: true, message: "otp sent" });

    } catch (e) {
        console.log(e);
        return res.status(500).json({ error: "internal server error" });
    }
}

//verify the otp and reset user password
export const resetPassword = async (req, res) => {
    try {
        const { email, otp, password } = req.body;
        if (!email || !otp || !password || !validatePassword(password)) {
            return res.status(400).json({ error: "invalid credentials" });
        }

        const user = await User.findOne({ email, 'otpDetails.code': String(otp).trim() });
        if (!user || !user.otpDetails?.expiresAt || user.otpDetails.expiresAt.getTime() <= Date.now()) {
            return res.status(400).json({ error: "invalid or expired otp" });
        }

        const hashedPassword = await generateHash(String(password));
        await User.updateOne(
            { _id: user._id },
            {
                $set: { password: hashedPassword },
                $unset: { otpDetails: "" }
            }
        );

        return res.status(200).json({ success: true, message: "password reset successfully" });
    } catch (e) {
        console.log(e);
        return res.status(500).json({ error: "internal server error" });
    }
}

