const swaggerUi = require("swagger-ui-express");

module.exports = function setupSwagger(app) {
  const port = process.env.PORT || 2000;

  const doc = {
    swagger: "2.0",
    info: { title: "Hikvision Davomat API", version: "1.0.0" },
    host: `localhost:${port}`,
    basePath: "/",
    schemes: ["http"],
    consumes: ["application/json"],
    produces: ["application/json"],
    paths: {
      "/api/device/config": {
        post: {
          summary: "Device config (IP, admin, password) set qilish",
          parameters: [
            {
              in: "body",
              name: "body",
              required: true,
              schema: {
                type: "object",
                properties: {
                  name: { type: "string", example: "main" },
                  ip: { type: "string", example: "192.0.0.64" },
                  username: { type: "string", example: "admin" },
                  password: { type: "string", example: "isomiddin._.8!" },
                  streamEnabled: { type: "boolean", example: true },
                },
              },
            },
          ],
          responses: { 200: { description: "OK" } },
        },
      },
      "/api/device/ping": { get: { summary: "Device online tekshirish", responses: { 200: { description: "OK" } } } },
      "/api/attendance": {
        get: {
          summary: "Davomat list (DB dan)",
          parameters: [
            { in: "query", name: "name", type: "string", example: "main" },
            { in: "query", name: "limit", type: "integer", example: 100 },
          ],
          responses: { 200: { description: "OK" } },
        },
      },
      "/api/enroll/start": {
        post: {
          summary: "Enroll start",
          parameters: [
            {
              in: "body",
              name: "body",
              required: true,
              schema: {
                type: "object",
                required: ["name", "employeeNo"],
                properties: {
                  name: { type: "string", example: "Ali Valiyev" },
                  employeeNo: { type: "string", example: "1001" },
                  phone: { type: "string", example: "+99890..." },
                  department: { type: "string", example: "IT" },
                },
              },
            },
          ],
          responses: { 200: { description: "OK" } },
        },
      },
      "/api/enroll/preview.jpg": { get: { summary: "Device snapshot preview (jpeg)", responses: { 200: { description: "OK" } } } },
      "/api/enroll/capture-face": { post: { summary: "Snapshotni face qilib saqlash", responses: { 200: { description: "OK" } } } },
      "/api/enroll/confirm": {
        post: {
          summary: "Confirm + Add (DB + Device: user/card/face)",
          parameters: [
            {
              in: "body",
              name: "body",
              required: true,
              schema: {
                type: "object",
                required: ["name", "employeeNo"],
                properties: {
                  name: { type: "string", example: "Ali Valiyev" },
                  employeeNo: { type: "string", example: "1001" },
                  cardNo: { type: "string", example: "1234567890" },
                  phone: { type: "string", example: "+99890..." },
                  department: { type: "string", example: "IT" },
                },
              },
            },
          ],
          responses: { 200: { description: "OK" } },
        },
      },
    },
  };

  app.use("/swagger", swaggerUi.serve, swaggerUi.setup(doc));
  app.get("/swagger.json", (req, res) => res.json(doc));
};
