import User from '../models/User.js';
import { generateToken } from '../utils/jwt.js';

const signup = async (req, res) => {
  try {
    const { name, mobileNumber, password } = req.body;

    if (!name || !mobileNumber || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const userExists = await User.findOne({ mobileNumber });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'Mobile number already registered' });
    }

    const user = await User.create({ name, mobileNumber, password });
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        mobileNumber: user.mobileNumber,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
        token,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { mobileNumber, password } = req.body;

    if (!mobileNumber || !password) {
      return res.status(400).json({ success: false, message: 'Please provide mobile number and password' });
    }

    const user = await User.findOne({ mobileNumber }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        mobileNumber: user.mobileNumber,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
        token,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export { signup, login, getMe };
