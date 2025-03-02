// server/src/main.ts

import "dotenv/config";
import app from "./src"

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});