export function generateDockerfile(project) {
    const dir = project.rootDirectory ? `${project.rootDirectory}/` : "";
    const allFiles = project.rootDirectory ? `${project.rootDirectory}/` : ".";
    switch (project.kind) {
        case "next":
            return `FROM node:22-alpine\nWORKDIR /app\nCOPY ${dir}package*.json ./\nRUN npm ci\nCOPY ${allFiles} ./\nRUN npm run build\nENV NODE_ENV=production\nEXPOSE 3000\nCMD ["npm", "start"]\n`;
        case "vite":
            return `FROM node:22-alpine AS build\nWORKDIR /app\nCOPY ${dir}package*.json ./\nRUN npm ci\nCOPY ${allFiles} ./\nRUN npm run build\nFROM nginx:alpine\nCOPY --from=build /app/dist /usr/share/nginx/html\nRUN printf 'server {\\n    listen 80;\\n    location / {\\n        root /usr/share/nginx/html;\\n        index index.html index.htm;\\n        try_files $uri $uri/ /index.html;\\n    }\\n}\\n' > /etc/nginx/conf.d/default.conf\nEXPOSE 80\n`;
        case "node":
            return `FROM node:22-alpine\nWORKDIR /app\nCOPY ${dir}package*.json ./\nRUN npm ci\nCOPY ${allFiles} ./\nENV NODE_ENV=production\nEXPOSE 3000\nCMD ["npm", "start"]\n`;
        case "fastapi":
            return `FROM python:3.12-slim\nWORKDIR /app\nCOPY ${dir}requirements.txt .\nRUN pip install --no-cache-dir -r requirements.txt\nCOPY ${allFiles} ./\nEXPOSE 8000\nCMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]\n`;
        case "python":
            return `FROM python:3.12-slim\nWORKDIR /app\nCOPY ${dir}requirements.txt .\nRUN pip install --no-cache-dir -r requirements.txt\nCOPY ${allFiles} ./\nEXPOSE 8000\nCMD ["python", "main.py"]\n`;
        case "go":
            return `FROM golang:1.24-alpine AS build\nWORKDIR /app\nCOPY ${dir}go.mod ${dir}go.sum* ./\nRUN go mod download\nCOPY ${allFiles} ./\nRUN go build -o server .\nFROM alpine:3.21\nWORKDIR /app\nCOPY --from=build /app/server .\nEXPOSE 8080\nCMD ["./server"]\n`;
        case "java-maven":
            return `FROM maven:3.9-eclipse-temurin-21 AS build\nWORKDIR /app\nCOPY ${dir}pom.xml .\nCOPY ${dir}src ./src\nRUN mvn -DskipTests package\nFROM eclipse-temurin:21-jre\nWORKDIR /app\nCOPY --from=build /app/target/*.jar app.jar\nEXPOSE 8080\nENTRYPOINT ["java", "-jar", "app.jar"]\n`;
        case "java-gradle":
            return `FROM gradle:8-jdk21 AS build\nWORKDIR /app\nCOPY ${allFiles} .\nRUN gradle build -x test\nFROM eclipse-temurin:21-jre\nWORKDIR /app\nCOPY --from=build /app/build/libs/*.jar app.jar\nEXPOSE 8080\nENTRYPOINT ["java", "-jar", "app.jar"]\n`;
        default:
            throw new Error("UNSUPPORTED_PROJECT");
    }
}
//# sourceMappingURL=dockerfile-generator.service.js.map