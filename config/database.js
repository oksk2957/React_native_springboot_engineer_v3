const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('database', 'username', 'password', {
  host: 'localhost',
  dialect: 'postgres', // 또는 사용하시는 DB
  logging: (sql) => {
    console.log('--------------------------------------------------');
    console.log('Executing Query:');
    console.log(sql);
    console.log('--------------------------------------------------');
  },
});

module.exports = sequelize;
