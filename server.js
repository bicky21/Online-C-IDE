const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { exec, execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(__dirname + '/public'));

// Function to grant full control permissions to all files in a folder
const grantPermissions = (folderPath) => {
    fs.readdirSync(folderPath).forEach(file => {
        const filePath = path.join(folderPath, file);
        fs.chmodSync(filePath, '777');
    });
};

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('compile', ({ code }) => {
        if (!code) {
            console.error('No code provided');
            socket.emit('output', 'No code provided');
            return;
        }

        const filePath = path.join(__dirname, 'temp', 'temp.c');

        // Save the C code to a file
        fs.writeFileSync(filePath, code);

        // Grant full control permissions to all files in the 'temp' folder
        grantPermissions(path.join(__dirname, 'temp'));

        // Execute the compile command
        exec(`gcc ${filePath} -o ${path.join(__dirname, 'temp', 'temp.exe')}`, { cwd: path.join(__dirname, 'temp') }, (error, stdout, stderr) => {
            if (error) {
                console.error(`Compilation error: ${error.message}`);
                socket.emit('output', `Compilation error: ${error.message}`);
                return;
            }

            console.log('Compilation successful');
            socket.emit('output', 'Compilation successful');

            // Determine the number of scanf statements in the code
            const numInputs = (code.match(/scanf/g) || []).length;

            // Send the number of inputs required
            socket.emit('input', numInputs);
        });
    });

    socket.on('run', ({ inputs }) => {
        const tempExePath = path.join(__dirname, 'temp', 'temp.exe');
        if (!fs.existsSync(tempExePath)) {
            console.error('Executable file does not exist');
            socket.emit('output', 'Executable file does not exist');
            return;
        }

        // Execute the compiled C program
        const childProcess = execFile(tempExePath, inputs, (error, stdout, stderr) => {
            if (error) {
                console.error(`Execution error: ${error.message}`);
                socket.emit('output', `Execution error: ${error.message}`);
                return;
            }

            console.log('Execution successful');
            socket.emit('output', 'Execution successful');
            socket.emit('output', stdout.toString());
        });

        // Provide input to the program
        childProcess.stdin.setEncoding('utf-8');
        inputs.forEach(input => {
            childProcess.stdin.write(input + '\n');
        });
        childProcess.stdin.end();
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

server.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
