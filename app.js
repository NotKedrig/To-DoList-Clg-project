const userRoutes = require("./Routes/userRoutes");
const noteRoutes = require("./Routes/noteRoutes");
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/notes", noteRoutes);
