import express from "express";

const app = express();
const PORT = 5500;

app.use(express.static("build"));

app.listen(PORT, () => {
    console.log(`Port: ${PORT}`);
});
