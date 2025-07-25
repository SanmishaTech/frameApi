const app = require("./src/app");

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// // ngrok 
// app.listen(3000, "0.0.0.0", () => {
//   console.log("Backend listening on http://0.0.0.0:3000");
// });
