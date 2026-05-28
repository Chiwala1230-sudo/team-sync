const { Client } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

async function setup() {
    console.log('🔧 Setting up your database...');
    console.log('Using password:', process.env.DB_PASSWORD);
    
    const client = new Client({
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: 'postgres',
    });

    try {
        await client.connect();
        console.log('✅ Connected to PostgreSQL');
        
        await client.query('CREATE DATABASE team_sync');
        console.log('✅ Database "team_sync" created!');
        
    } catch (err) {
        if (err.code === '42P04') {
            console.log('✅ Database "team_sync" already exists');
        } else {
            console.log('❌ Error:', err.message);
        }
    } finally {
        await client.end();
    }
}

setup();