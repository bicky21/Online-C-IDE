document.addEventListener('DOMContentLoaded', () => {
    const socket = io();

    const editor = CodeMirror.fromTextArea(document.getElementById('editor'), {
        lineNumbers: true,
        mode: 'text/x-csrc',
        theme: 'dracula'
    });

    document.getElementById('compile-button').addEventListener('click', () => {
        const code = editor.getValue();
        socket.emit('compile', { code });
    });

    document.getElementById('run-button').addEventListener('click', () => {
        const inputs = [];
        const numInputs = document.getElementsByClassName('input').length;
        for (let i = 0; i < numInputs; i++) {
            inputs.push(document.getElementById(`input${i}`).value);
        }
        socket.emit('run', { inputs });
    });

    socket.on('output', (data) => {
        document.getElementById('output').innerText += data + '\n';
    });

    socket.on('input', (numInputs) => {
        let inputBoxes = '';
        for (let i = 0; i < numInputs; i++) {
            inputBoxes += `<input type="text" id="input${i}" class="input form-control" placeholder="Enter value ${i + 1}"><br>`;
        }
        document.getElementById('inputs').innerHTML = inputBoxes;
    });
});
