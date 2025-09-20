const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log(`
  ██████╗ ███████╗ █████╗ ██╗      ██████╗ ███████╗ █████╗ ███╗   ██╗
  ██╔══██╗██╔════╝██╔══██╗██║     ██╔════╝ ██╔════╝██╔══██╗████╗  ██║
  ██████╔╝█████╗  ███████║██║     ██║  ███╗███████╗███████║██╔██╗ ██║
  ██╔══██╗██╔══╝  ██╔══██║██║     ██║   ██║╚════██║██╔══██║██║╚██╗██║
  ██║  ██║███████╗██║  ██║███████╗╚██████╔╝███████║██║  ██║██║ ╚████║
  ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝
`);

console.log('RealScan Premium Setup');
console.log('=====================');

// Periksa jika folder logs wujud
if (!fs.existsSync(path.join(__dirname, 'logs'))) {
  fs.mkdirSync(path.join(__dirname, 'logs'));
  console.log('Created logs directory');
}

// Periksa jika folder uploads wujud
if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
  fs.mkdirSync(path.join(__dirname, 'uploads'));
  console.log('Created uploads directory');
}

// Tanya soalan setup
rl.question('Do you want to create a default admin user? (y/n): ', (answer) => {
  if (answer.toLowerCase() === 'y') {
    createAdminUser();
  } else {
    console.log('Skipping admin user creation');
    rl.close();
    process.exit(0);
  }
});

function createAdminUser() {
  const User = require('./models/User');
  
  rl.question('Admin username: ', (username) => {
    rl.question('Admin password: ', (password) => {
      const newUser = new User({
        username,
        password,
        role: 'admin'
      });
      
      newUser.save()
        .then(() => {
          console.log('Admin user created successfully');
          rl.close();
          process.exit(0);
        })
        .catch(error => {
          console.error('Error creating admin user:', error);
          rl.close();
          process.exit(1);
        });
    });
  });
}
