// Final version (ready to paste)
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

router.get('/', userController.getLanding);
router.get('/register', userController.getRegister);
router.post('/register', upload.single('resume'), userController.postRegister);
router.get('/login', userController.getLogin);
router.post('/login', userController.postLogin);
router.get('/dashboard', userController.getDashboard);
router.get('/logout', userController.logout);
router.get('/search-jobs', userController.searchJobs);

module.exports = router;
