FROM postgres:latest

ENV POSTGRES_DB=ebay_sales_tool
ENV POSTGRES_USER=your_username
ENV POSTGRES_PASSWORD=your_password

COPY ./migrations /docker-entrypoint-initdb.d/migrations
COPY ./seeds /docker-entrypoint-initdb.d/seeds

EXPOSE 5432