
const express = require('express');
const {ServerConfig,Logger} = require('./config');//you dont need to specifically say ./config/index.js it automatically picks index.js
const apiRoutes = require('./routes');
const app = express();
app.use(express.json());
app.use(express.urlencoded({extended: true}))
app.use('/api', apiRoutes)

app.listen(ServerConfig.PORT,()=>{
    console.log(`Successfully started server on PORT : ${ServerConfig.PORT}`);
    Logger.info("Successfully started the server",{});

})