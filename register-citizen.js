const axios = require('axios');

async function registerCitizen() {
  try {
    const res = await axios.post('http://localhost:5000/api/auth/register', {
      name: 'Citizen User',
      email: '23eg107e39@anurag.edu.in',
      password: '123456',
      role: 'citizen'
    });
    console.log('Status:', res.status);
    console.log('Response:', res.data);
  } catch (err) {
    if (err.response) {
      console.log('Status:', err.response.status);
      console.log('Error:', err.response.data);
    } else {
      console.log('Error:', err.message);
    }
  }
}

registerCitizen();
