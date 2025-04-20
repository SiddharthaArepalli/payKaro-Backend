const express = require("express");
const rootRouter = require("./routes/index")
const cors = require("cors");

const app = express();

app.use(cors())
app.use(express.json())
app.use('/api/v1',rootRouter);

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use. Please use a different port.`);
        process.exit(1); // Exit the process
    } else {
        console.error("Server error:", err);
    }
});