# Use a lightweight Node.js image
FROM node:18-slim

# 1. Install Python and Pip
RUN apt-get update && apt-get install -y python3 python3-pip

# 2. Set working directory
WORKDIR /app

# 3. Copy Backend dependency files first (for caching)
COPY server/package*.json ./server/
COPY python_engine/requirements.txt ./python_engine/

# 4. Install Node dependencies
RUN cd server && npm install

# 5. Install Python dependencies
# --break-system-packages is needed for newer Python versions in Docker
RUN pip3 install -r python_engine/requirements.txt --break-system-packages

# 6. Copy the rest of the code
COPY . .

# 7. Create necessary folders
RUN mkdir -p server/uploads server/processed

# 8. Expose the port
EXPOSE 3000

# 9. Start the server
CMD ["node", "server/app.js"]