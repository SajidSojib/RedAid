import express, { Application } from "express";

const app: Application = express();

app.get("/", (req, res) => {
    res.send("Welcome to the RedAid API!");
});


export default app;