import User from '../models/user.model.js'
import { generateHash, verifyHash } from "../utils/bcrypt.utils.js";
import { generateToken } from "../utils/jwt.utils.js";

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
    if (!name || !uid || !email || !password) {
        return res.status(400).json({ error: 'Name, UID, email and password are required' });
    }
    if (password.length < 8 || !validatePassword(password)) {
        return res.status(400).json({ error: "Invalid password" })
    }

    //fetching user from db to check if user exist
    const user = await User.findOne({ uid }).lean();
    if (user) {
        return res.status(400).json({ error: 'User already exists with same uid' });
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

    //fetch user from database using decoded token
    const user = await User.findById(decoded.id).lean();
    if (!user) {
        return res.status(200).json({ user: {} });
    }

    //attach user to request object
    res.status(200).json({
        user: {
            id: user._id,
            name: user.name,
            role: user.role,
            uid: user.uid,
            streetAddress: user.address?.streetAddress,
            city: user.address?.city,
            state: user.address?.state,
            postalCode: user.address?.postalCode,
            country: user.address?.country
        }
    });

}

export const forgotUser = async (req, res) => {
    try {
        const { name, uid } = req.body;
        const password = String(req.body.password);

        if (!name || !uid || !password) {
            return res.status(400).json({ error: 'Name, uid and password are required' });
        }

        if (password.trim().length < 8) {
            return res.status(400).json({ error: "short password" })
        }

        //user validation if it even exists
        const user = await User.findOne({ uid }).lean();
        if (!user) {
            return res.status(400).json({ message: "Invalid uid or user name" });
        }

        //updating db if name and uid number matches
        if (String(name || "").toLowerCase().trim() === String(user?.name).toLowerCase().trim()) {
            const hashedPassword = await generateHash(password);
            const r = await User.updateOne(
                { uid: uid },
                { $set: { password: hashedPassword } }
            );
            if (!r || !r.matchedCount) {
                return res.status(400).json({ message: "Invalid uid or user name" });
                console.log(r);
            }
            return res.status(200).json({ message: "successfully forget" });
        }
        return res.status(400).json({ message: "Invalid uid or user name" });
    } catch (e) {
        console.log(e);
        return res.status(500).json({ error: "internal server error" });
    }
}

export const setUserAddress = async (req, res) => {
    try {

        const { streetAddress, city, state, postalCode } = req.body;
        if (!streetAddress || !city || !state || !postalCode) {
            return res.status(400).json({ error: "address details are required" });
        }
        if (!req.user?.id) {
            return res.status(400).json({
                error: "Login required"
            })
        }
        const addressObj = { streetAddress, city, state, postalCode }
        const user = await User.findByIdAndUpdate(req.user?.id, {
            $set: { address: addressObj }
        });
        return res.status(200).json({
            success: true,
            user
        })
    } catch (e) {
        console.log(e);
        return res.status(500).json({ error: "internal server error" })
    }
}
