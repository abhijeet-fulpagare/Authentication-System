import "dotenv/config";
import app from "./src/app.js";
import ConnectDB from './src/config/database.js'


ConnectDB();
const port = process.env.PORT;

app.listen(port, () => {
    console.log("Server running on port:", port);
})