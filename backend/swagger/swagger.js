const swaggerUi = require("swagger-ui-express");

module.exports = function setupSwagger(app) {
  const port = process.env.PORT || 2000;

  const doc = {
    swagger: "2.0",
    info: { 
      title: "Hikvision Davomat API", 
      version: "1.0.0",
      description: "Hikvision qurilmalari uchun davomat va xodimlarni boshqarish API"
    },
    host: `localhost:${port}`,
    basePath: "/",
    schemes: ["http"],
    consumes: ["application/json", "multipart/form-data"],
    produces: ["application/json"],
    
    // Definitions (modellar)
    definitions: {
      Employee: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          employeeNo: { type: "string", example: "1001" },
          name: { type: "string", example: "Ali Valiyev" },
          cardNo: { type: "string", example: "1234567890" },
          phone: { type: "string", example: "+998901234567" },
          department: { type: "string", example: "IT" },
          workStartTime: { type: "string", example: "09:00" },
          workEndTime: { type: "string", example: "18:00" },
          workDays: { 
            type: "array", 
            items: { type: "integer" },
            example: [1, 2, 3, 4, 5]
          },
          timezone: { type: "string", example: "Asia/Tashkent" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" }
        }
      },
      WorkTimeStatus: {
        type: "object",
        properties: {
          isWorkDay: { type: "boolean", example: true },
          isWorkTime: { type: "boolean", example: true },
          currentDay: { type: "integer", example: 2 },
          currentTime: { type: "string", example: "14:30" },
          workStart: { type: "string", example: "09:00" },
          workEnd: { type: "string", example: "18:00" },
          timeUntilEnd: { type: "string", example: "3 soat 30 daqiqa" }
        }
      },
      WorkTimeStatistics: {
        type: "object",
        properties: {
          total: { type: "integer", example: 50 },
          nowWorkingCount: { type: "integer", example: 35 },
          averageStartTime: { type: "string", example: "09:15" },
          averageEndTime: { type: "string", example: "17:45" },
          departmentCounts: {
            type: "object",
            example: { "IT": 10, "HR": 5, "Production": 20 }
          }
        }
      }
    },

    paths: {
      // ========== DEVICE CONFIG ==========
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
      
      "/api/device/ping": { 
        get: { 
          summary: "Device online tekshirish", 
          responses: { 200: { description: "OK" } } 
        } 
      },

      // ========== ATTENDANCE ==========
      "/api/attendance": {
        get: {
          summary: "Davomat list (DB dan)",
          parameters: [
            { 
              in: "query", 
              name: "name", 
              type: "string", 
              description: "Xodim ismi bo'yicha filter", 
              example: "Ali" 
            },
            { 
              in: "query", 
              name: "limit", 
              type: "integer", 
              description: "Natijalar soni", 
              default: 100, 
              example: 100 
            },
            { 
              in: "query", 
              name: "startDate", 
              type: "string", 
              format: "date", 
              description: "Boshlanish sana", 
              example: "2024-01-01" 
            },
            { 
              in: "query", 
              name: "endDate", 
              type: "string", 
              format: "date", 
              description: "Tugash sana", 
              example: "2024-12-31" 
            }
          ],
          responses: { 200: { description: "OK" } },
        },
      },

      // ========== EMPLOYEES (YANGI) ==========
      "/api/employees": {
        get: {
          summary: "Barcha xodimlar ro'yxati (ish vaqti bilan birga)",
          tags: ["Employees"],
          responses: {
            200: {
              description: "OK",
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  employees: {
                    type: "array",
                    items: { $ref: "#/definitions/Employee" }
                  }
                }
              }
            }
          }
        }
      },

      "/api/employees/with-work-time": {
        get: {
          summary: "Xodimlar ish vaqti statusi bilan birga",
          tags: ["Employees"],
          responses: {
            200: {
              description: "OK",
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean" },
                  employees: {
                    type: "array",
                    items: {
                      allOf: [
                        { $ref: "#/definitions/Employee" },
                        {
                          type: "object",
                          properties: {
                            workStatus: { $ref: "#/definitions/WorkTimeStatus" }
                          }
                        }
                      ]
                    }
                  }
                }
              }
            }
          }
        }
      },

      "/api/employees/statistics": {
        get: {
          summary: "Ish vaqti statistikasi",
          tags: ["Employees"],
          responses: {
            200: {
              description: "OK",
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean" },
                  statistics: { $ref: "#/definitions/WorkTimeStatistics" }
                }
              }
            }
          }
        }
      },

      "/api/employees/now-working": {
        get: {
          summary: "Hozir ishlayotgan xodimlar",
          tags: ["Employees"],
          responses: {
            200: {
              description: "OK",
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean" },
                  count: { type: "integer" },
                  timestamp: { type: "string", format: "date-time" },
                  employees: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "integer" },
                        employeeNo: { type: "string" },
                        name: { type: "string" },
                        department: { type: "string" },
                        workStartTime: { type: "string" },
                        workEndTime: { type: "string" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },

      "/api/employees/filter": {
        get: {
          summary: "Xodimlarni filterlash",
          tags: ["Employees"],
          parameters: [
            { 
              in: "query", 
              name: "department", 
              type: "string", 
              description: "Bo'lim bo'yicha filter", 
              example: "IT" 
            },
            { 
              in: "query", 
              name: "status", 
              type: "string", 
              description: "Status bo'yicha filter (now-working, not-working, day-off)", 
              enum: ["now-working", "not-working", "day-off"],
              example: "now-working" 
            },
            { 
              in: "query", 
              name: "workStart", 
              type: "string", 
              description: "Ish boshlanish vaqti", 
              example: "09:00" 
            },
            { 
              in: "query", 
              name: "workEnd", 
              type: "string", 
              description: "Ish tugash vaqti", 
              example: "18:00" 
            }
          ],
          responses: {
            200: {
              description: "OK",
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean" },
                  count: { type: "integer" },
                  employees: {
                    type: "array",
                    items: { $ref: "#/definitions/Employee" }
                  }
                }
              }
            }
          }
        }
      },

      "/api/employees/{id}": {
        get: {
          summary: "Xodimni ID bo'yicha olish",
          tags: ["Employees"],
          parameters: [
            { 
              in: "path", 
              name: "id", 
              required: true, 
              type: "integer", 
              description: "Xodim ID si",
              example: 1 
            }
          ],
          responses: {
            200: {
              description: "OK",
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean" },
                  employee: {
                    allOf: [
                      { $ref: "#/definitions/Employee" },
                      {
                        type: "object",
                        properties: {
                          workStatus: { $ref: "#/definitions/WorkTimeStatus" }
                        }
                      }
                    ]
                  }
                }
              }
            },
            404: {
              description: "Xodim topilmadi",
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: false },
                  message: { type: "string", example: "Xodim topilmadi" }
                }
              }
            }
          }
        }
      },

      "/api/employees/{id}/work-time": {
        put: {
          summary: "Xodim ish vaqtini yangilash (admin)",
          tags: ["Employees"],
          parameters: [
            { 
              in: "path", 
              name: "id", 
              required: true, 
              type: "integer", 
              description: "Xodim ID si" 
            },
            {
              in: "body",
              name: "body",
              required: true,
              schema: {
                type: "object",
                properties: {
                  workStartTime: { type: "string", example: "08:00" },
                  workEndTime: { type: "string", example: "17:00" },
                  workDays: { 
                    type: "array", 
                    items: { type: "integer" },
                    example: [1, 2, 3, 4, 5]
                  },
                  timezone: { type: "string", example: "Asia/Tashkent" }
                }
              }
            }
          ],
          responses: {
            200: {
              description: "OK",
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean" },
                  message: { type: "string", example: "Ish vaqti yangilandi" },
                  employee: { $ref: "#/definitions/Employee" }
                }
              }
            }
          }
        }
      },

      // ========== ENROLL ==========
      "/api/enroll/start": {
        post: {
          summary: "Enroll start - yangi xodim qo'shishni boshlash",
          tags: ["Enroll"],
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
                  phone: { type: "string", example: "+998901234567" },
                  department: { type: "string", example: "IT" },
                },
              },
            },
          ],
          responses: { 
            200: { 
              description: "OK",
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean" },
                  message: { type: "string" },
                  sessionId: { type: "string", example: "1001" }
                }
              }
            } 
          },
        },
      },
      
      "/api/enroll/preview.jpg": { 
        get: { 
          summary: "Device snapshot preview (jpeg)", 
          tags: ["Enroll"],
          responses: { 
            200: { 
              description: "JPEG image",
              produces: ["image/jpeg"]
            } 
          } 
        } 
      },
      
      "/api/enroll/capture-face": { 
        post: { 
          summary: "Snapshotni face qilib saqlash",
          tags: ["Enroll"],
          parameters: [
            { 
              in: "query", 
              name: "employeeNo", 
              required: true, 
              type: "string", 
              description: "Xodim raqami",
              example: "1001" 
            }
          ],
          responses: { 
            200: { 
              description: "OK",
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean" },
                  message: { type: "string" },
                  sizeKB: { type: "number", example: 45.2 }
                }
              }
            } 
          } 
        } 
      },

      "/api/enroll/upload-webm": {
        post: {
          summary: "Fayl orqali rasm yuklash",
          tags: ["Enroll"],
          consumes: ["multipart/form-data"],
          parameters: [
            {
              in: "formData",
              name: "faceFile",
              type: "file",
              required: true,
              description: "Rasm fayli (JPEG/PNG/WEBM)"
            },
            {
              in: "formData",
              name: "employeeNo",
              type: "string",
              required: true,
              description: "Xodim raqami",
              example: "1001"
            }
          ],
          responses: {
            200: {
              description: "OK",
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean" },
                  message: { type: "string" },
                  sizeKB: { type: "number" }
                }
              }
            }
          }
        }
      },
      
      "/api/enroll/confirm": {
        post: {
          summary: "Confirm + Add (DB + Device: user/card/face) - Ish vaqti avtomatik generatsiya qilinadi",
          tags: ["Enroll"],
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
                  phone: { type: "string", example: "+998901234567" },
                  department: { type: "string", example: "IT" },
                },
              },
            },
          ],
          responses: { 
            200: { 
              description: "OK",
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean" },
                  message: { type: "string", example: "Xodim muvaffaqiyatli qo'shildi" },
                  results: {
                    type: "object",
                    properties: {
                      db: { type: "boolean", example: true },
                      user: { type: "boolean", example: true },
                      card: { type: "boolean", example: true },
                      face: { type: "boolean", example: true }
                    }
                  }
                }
              }
            } 
          },
        },
      },

      "/api/enroll/cancel": {
        post: {
          summary: "Enroll sessiyasini bekor qilish",
          tags: ["Enroll"],
          parameters: [
            {
              in: "query",
              name: "employeeNo",
              required: true,
              type: "string",
              example: "1001"
            }
          ],
          responses: {
            200: {
              description: "OK",
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean" },
                  message: { type: "string", example: "Enroll bekor qilindi" }
                }
              }
            }
          }
        }
      },

      "/api/enroll/state": {
        get: {
          summary: "Enroll sessiya holatini tekshirish",
          tags: ["Enroll"],
          parameters: [
            {
              in: "query",
              name: "employeeNo",
              required: true,
              type: "string",
              example: "1001"
            }
          ],
          responses: {
            200: {
              description: "OK",
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean" },
                  session: {
                    type: "object",
                    properties: {
                      active: { type: "boolean" },
                      name: { type: "string" },
                      employeeNo: { type: "string" },
                      cardNo: { type: "string" },
                      phone: { type: "string" },
                      department: { type: "string" },
                      hasFace: { type: "boolean" }
                    }
                  },
                  device: {
                    type: "object",
                    properties: {
                      ip: { type: "string" },
                      username: { type: "string" }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },

    // Tags (guruhlash)
    tags: [
      {
        name: "Employees",
        description: "Xodimlarni boshqarish (ish vaqti bilan birga)"
      },
      {
        name: "Enroll",
        description: "Yangi xodim qo'shish jarayoni"
      },
      {
        name: "Attendance",
        description: "Davomat ma'lumotlari"
      },
      {
        name: "Device",
        description: "Qurilma sozlamalari va holati"
      }
    ]
  };

  app.use("/swagger", swaggerUi.serve, swaggerUi.setup(doc));
  app.get("/swagger.json", (req, res) => res.json(doc));
};