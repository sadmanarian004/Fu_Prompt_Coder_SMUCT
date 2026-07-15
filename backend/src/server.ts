import "dotenv/config";
import app from "./app";

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5000;

app.listen(PORT, () => {
  console.log(`DokanKhata API listening on http://localhost:${PORT}`);
});