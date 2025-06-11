
const bcrypt = require('bcrypt');
const db = require('../models/db');
const { exec } = require('child_process');
const path = require('path');
const axios = require('axios');

exports.getLanding = (req, res) => {
  res.render('landing');
};

exports.getRegister = (req, res) => {
  res.render('register');
};

exports.postRegister = async (req, res) => {
  const { name, dob, college, year, email, password, experience } = req.body;
  const resume = req.file.filename;
  const hashedPassword = await bcrypt.hash(password, 10);
  const resumePath = path.join(__dirname, '../uploads', resume);

  // Parse resume using Python script
  exec(`python3 resume_parser.py "${resumePath}"`, (err, stdout, stderr) => {
    if (err) {
      console.error('Error parsing resume:', stderr);
      return res.send('Resume parsing failed');
    }

    try {
      const parsed = JSON.parse(stdout);
      const extractedSkills = parsed.skills ? parsed.skills.join(', ') : '';
      const sql = 'INSERT INTO users (name, dob, college, year, email, password, experience, resume, skills) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
      db.query(sql, [name, dob, college, year, email, hashedPassword, experience, resume, extractedSkills], (err) => {
        if (err) throw err;
        res.redirect('/login');
      });
    } catch (parseErr) {
      console.error('Parsing error:', parseErr);
      return res.send('Failed to process resume data');
    }
  });
};

exports.getLogin = (req, res) => {
  res.render('login');
};

exports.postLogin = (req, res) => {
  const { email, password } = req.body;
  db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
    if (err) throw err;
    if (results.length === 0 || !(await bcrypt.compare(password, results[0].password))) {
      return res.send('Invalid credentials');
    }
    req.session.user = results[0];
    res.redirect('/dashboard');
  });
};

exports.logout = (req, res) => {
  req.session.destroy(() => res.redirect('/'));
};

exports.getDashboard = async (req, res) => {
    const user = req.session.user;
    if (!user) return res.redirect('/login');
  
    const userSkills = user.skills ? user.skills.split(', ') : [];
  
    try {
      const query = `jobs for ${userSkills.join(' ')}`;
      const response = await axios.get('https://jsearch.p.rapidapi.com/search', {
        params: {
          query: query,
          page: 1,
          num_pages: 1
        },
        headers: {
          'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
        }
      });
  
      const matchedJobs = response.data.data.map(job => ({
        title: job.job_title,
        company: job.employer_name,
        location: job.job_city || job.job_country,
        description: job.job_description?.slice(0, 100) + '...',
        url: job.job_apply_link
      }));
  
      res.render('dashboard', { user, jobs: matchedJobs });
    } catch (err) {
      console.error("Dashboard API error:", err);
      res.render('dashboard', { user, jobs: [] });
    }
  };
  

exports.searchJobs = async (req, res) => {
  const { query, area } = req.query;

  try {
    const response = await axios.get('https://jsearch.p.rapidapi.com/search', {
      params: {
        query: `${query} in ${area}`,
        page: 1,
        num_pages: 1
      },
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
      }
    });

    const jobs = response.data.data.map(job => ({
      title: job.job_title,
      company: job.employer_name,
      location: job.job_city || job.job_country,
      description: job.job_description?.slice(0, 100) + '...',
      url: job.job_apply_link
    }));

    res.render('available_jobs', { jobs });
  } catch (error) {
    console.error(error);
    res.render('available_jobs', { jobs: [] });
  }
};
