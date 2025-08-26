const socketIO = require('socket.io');
const { query } = require('./database/dbpromise');

let ioInstance; // Global variable to store the io instance

function initializeSocket(server) {
    const io = socketIO(server, {
        cors: {
            origin: process.env.FRONTENDURI,
            methods: ["GET", "POST"]
        }
    });

    // Save the io instance to the global variable
    ioInstance = io;

    // Socket.IO event handling
    io.on('connection', (socket) => {
        console.log('A user connected', socket.id);

        socket.on('user_connected', async ({ userId }) => {
            console.log({ userId })
            if (userId) {
                console.log(`User ${userId?.slice(0, 5)} connected with socket ID: ${socket.id}`);
                try {
                    // Perform database operations within a try-catch block for error handling
                    await query(`DELETE FROM rooms WHERE uid = ?`, [userId]);
                    await query(`INSERT INTO rooms (uid, socket_id) VALUES (?, ?)`, [userId, socket.id]);
                } catch (error) {
                    console.error('Error executing database queries:', error);
                    // Handle error gracefully, such as sending an error response to the client
                }
            }
        });

        socket.on('disconnect', async () => {
            console.log(`A user disconnected with socket ID: ${socket.id}`);
            try {
                await query(`DELETE FROM rooms WHERE socket_id = ?`, [socket.id]);
            } catch (error) {
                console.error('Error executing database query:', error);
            }
        });

    });

    return io; // Return io instance
}

// Export a function to get the io instance
function getIOInstance() {
    return ioInstance;
}

module.exports = { initializeSocket, getIOInstance };
