const http = require('http');

// Example GET request
http.get('http://localhost:5000/users', (res) => {
  let data = '';

  // A chunk of data has been received.
  res.on('data', (chunk) => {
    data += chunk;
  });

  // The whole response has been received.
  res.on('end', () => {
    console.log(JSON.parse(data));
  });
}).on('error', (err) => {
  console.log('Error: ', err.message);
});

// Example POST request
const postData = JSON.stringify({
  name: 'john',
  password: 'newpassword',
  profession: 'developer',
  id: 4
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/users',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': postData.length
  }
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(data);
  });
});

req.on('error', (err) => {
  console.error(err);
});

req.write(postData);
req.end();
