import { Server } from "./server";

const server = new Server();

server.listen(port => {
  console.log(`Server is listening on http://198.211.117.99:${port}`);
});
