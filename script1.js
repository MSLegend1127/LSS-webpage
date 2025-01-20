// Connect to WebSocket server
const ws = new WebSocket('ws://localhost:8080');

ws.onopen = () => {
    console.log('Connected to WebSocket server');
};

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    // Update the displayed values when the WebSocket message is received
    document.getElementById('aValue').textContent = data.a;
    document.getElementById('bValue').textContent = data.b;
    document.getElementById('cValue').textContent = data.c;
    document.getElementById('dValue').textContent = data.d;
};

ws.onclose = () => {
    console.log('Disconnected from WebSocket server');
};
