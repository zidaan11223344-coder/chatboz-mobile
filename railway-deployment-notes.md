# Railway deployment notes

Railway's official quick-start supports deploying from GitHub, CLI, Docker image, and templates. The current application is a Node.js/Expo project with a server process, so its existing server is a better fit for Railway than an edge-only runtime.

Railway's official MySQL service exposes MYSQLHOST, MYSQLPORT, MYSQLUSER, MYSQLPASSWORD, MYSQLDATABASE, and MYSQL_URL to connected services. The application should keep DATABASE_URL and existing secrets mapped to the Railway service variables, and database migrations should run only after review.

Railway variables are available during build and runtime. Changes to variables are staged and must be reviewed/deployed in the Railway dashboard. Secrets such as the session signing secret and local administrator credentials must be stored as sealed Railway variables and never committed.

References:
- https://docs.railway.com/quick-start
- https://docs.railway.com/databases/mysql
- https://docs.railway.com/variables
