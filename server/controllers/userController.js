// controllers/userController.js
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const userController = {
  // Registrazione di un nuovo utente
  register: async (req, res) => {
    try {
      const { email, username, password } = req.body;

      // Verifica se l'utente esiste già
      const existingUser = await User.findOne({ $or: [{ email }, { username }] });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists with this email or username' });
      }

      // Crea una nuova istanza dell'utente
      const newUser = new User({ email, username, password });

      // Hash della password prima di salvarla nel database
      const salt = await bcrypt.genSalt(10);
      newUser.password = await bcrypt.hash(password, salt);

      // Salva l'utente nel database
      await newUser.save();

      res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  // Login dell'utente
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // Verifica se l'utente esiste
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: 'Invalid email or password' });
      }

      // Verifica della password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({ message: 'Invalid email or password' });
      }

      // Genera il token JWT
      const token = jwt.sign({ userId: user._id }, process.env.SECRET_KEY, { expiresIn: '8h' });

      res.status(200).json({ token, userId: user._id, expiresIn: 3600 }); // expiresIn in secondi
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  // Aggiorna il profilo dell'utente
  updateProfile: async (req, res) => {
    try {
      const userId = req.user.userId; // Ottenere l'ID dell'utente dal token JWT

      // Verificare se l'utente esiste
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Effettuare l'aggiornamento del profilo
      user.address = req.body.address || user.address;
      user.phoneNumber = req.body.phoneNumber || user.phoneNumber;

      // Salvare le modifiche nel database
      await user.save();

      res.status(200).json({ message: 'Profile updated successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },
};

module.exports = userController;
