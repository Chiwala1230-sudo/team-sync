const fs = require('fs');
const path = require('path');

function removeBOM(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        // Remove BOM if present
        if (content.charCodeAt(0) === 0xFEFF) {
            content = content.slice(1);
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(Fixed: );
        }
    } catch(e) {
        console.log(Error: );
    }
}

const files = [
    'frontend/src/App.js',
    'frontend/src/pages/Dashboard.js',
    'frontend/src/pages/Login.js',
    'frontend/src/pages/Register.js',
    'frontend/src/services/api.js'
];

files.forEach(removeBOM);
console.log('Done!');
