FROM cypress/base:14.17.0 as aepp-superhero-wallet-build
WORKDIR /app
USER root
RUN apt update && apt install -y make gcc g++ python git
COPY  . .
RUN npm ci
RUN npm run build

FROM nginx:1.13.7-alpine
COPY ./nginx/nginx.conf /etc/nginx/nginx.conf
COPY ./nginx/default.conf /etc/nginx/conf.d/default.conf 
COPY --from=aepp-superhero-wallet-build /app/dist/web/root /usr/share/nginx/html
